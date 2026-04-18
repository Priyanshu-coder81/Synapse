import bcrypt from 'bcrypt';
import prisma from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadOnCloudinary } from '../utils/Cloudinary.js';
import { deleteFromCloudinary } from '../utils/RemoveFile.js';
import { generateAccessToken, generateRefreshToken } from '../utils/token.js';
import {
    registerSchema,
    loginSchema,
    updateProfileSchema,
    changePasswordSchema,
    updateUserNameSchema
} from '../validators/user.validators.js';

// Helper to set tokens in cookies
const setTokenCookies = (res, accessToken, refreshToken) => {
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'None',
    };

    res.cookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: 24 * 60 * 60 * 1000 // 1 day matching token expiry
    });
    res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days matching token expiry
    });
};

const registerUser = asyncHandler(async (req, res) => {
    // 1. Validate Input
    const validatedData = registerSchema.parse(req.body);
    const { email, username, password } = validatedData;

    // 2. Check for existing user
    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [{ email }, { username }]
        }
    });

    if (existingUser) {
        throw new ApiError(409, "User with this email or username already exists");
    }

    // 3. Handle Avatar Upload (if present)
    let avatarUrl = null;
    let avatarPublicId = null;

    if (req.file) {
        const uploadResult = await uploadOnCloudinary(req.file.path);
        if (uploadResult) {
            avatarUrl = uploadResult.secure_url;
            avatarPublicId = uploadResult.public_id;
        }
    }

    // 4. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Create User
    const user = await prisma.user.create({
        data: {
            email,
            username,
            password: hashedPassword,
            avatarUrl,
            avatarPublicId
        },
        select: {
            id: true,
            email: true,
            username: true,
            avatarUrl: true,
            createdAt: true
        }
    });

    return res.status(201).json(
        new ApiResponse(201, user, "User registered successfully")
    );
});

const loginUser = asyncHandler(async (req, res) => {
    // 1. Validate Input
    const { username, email, password } = loginSchema.parse(req.body);

    if(!username && !email){
        throw new ApiError(400, "Atleast one filed is required (Username or Email)");
    }

    // 2. Find User
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { email: email || undefined },
                { username: username || undefined }
            ]
        }
    });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    // 3. Compare Password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    // 4. Generate Tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // 5. Save Refresh Token in DB
    await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken }
    });

    // 6. Set Cookies and Respond
    setTokenCookies(res, accessToken, refreshToken);

    const loggedInUser = {
        id: user.id,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl
    };

    return res.status(200).json(
        new ApiResponse(200, loggedInUser, "User logged in successfully")
    );
});

const logoutUser = asyncHandler(async (req, res) => {
    // 1. Remove refresh token from DB
    await prisma.user.update({
        where: { id: req.user.id },
        data: { refreshToken: null }
    });

    // 2. Clear cookies
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
    };

    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);

    return res.status(200).json(
        new ApiResponse(200, {}, "User logged out successfully")
    );
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, req.user, "Current user fetched successfully")
    );
});

const updateUserName = asyncHandler(async (req, res) => {
    // 1. Validate Input
    const validatedData = updateUserNameSchema.parse(req.body);

    if (Object.keys(validatedData).length === 0) {
        throw new ApiError(400, "No data provided for update");
    }   

    // check if username already exists
    const existingUser = await prisma.user.findFirst({
        where: {
            username: validatedData.username
        }
    });

    if (existingUser) {
        throw new ApiError(409, "Username already exists");
    }

    // 2. Update DB
    const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: validatedData,
        select: {
            id: true,
            email: true,
            username: true,
            avatarUrl: true,
            updatedAt: true
        }
    });

    if(!updatedUser){
        throw new ApiError(500, "Error while updating username");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedUser, "Profile updated successfully")
    );
});

const updateAvatar = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, "Avatar file is required");
    }

    // 1. Upload new avatar
    const uploadResult = await uploadOnCloudinary(req.file.path);

    if (!uploadResult) {
        throw new ApiError(500, "Error while uploading avatar");
    }

   
    // 3. Update DB
    const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: {
            avatarUrl: uploadResult.secure_url,
            avatarPublicId: uploadResult.public_id
        },
        select: {
            id: true,
            avatarUrl: true,
            updatedAt: true
        }
    });

    if(!updatedUser){
        throw new ApiError(500, "Error while updating avatar");
    }

     // 2. Delete old avatar if it exists
    if (req.user.avatarPublicId) {
        await deleteFromCloudinary(req.user.avatarPublicId);
    }


    return res.status(200).json(
        new ApiResponse(200, updatedUser, "Avatar updated successfully")
    );
});

const updatePassword = asyncHandler(async (req, res) => {
    // 1. Validate Input
    const { oldPassword, newPassword } = changePasswordSchema.parse(req.body);

    // 2. Verify Old Password (fully refetch user to get password)
    const user = await prisma.user.findUnique({
        where: { id: req.user.id }
    });

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordValid) {
        throw new ApiError(400, "Invalid old password");
    }

    // 3. Hash and Update New Password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { id: req.user.id },
        data: { password: hashedPassword }
    });

    return res.status(200).json(
        new ApiResponse(200, {}, "Password updated successfully")
    );
});

const deleteUser = asyncHandler(async (req, res) => {
    // 1. Delete Avatar from Cloudinary
    if (req.user.avatarPublicId) {
        await deleteFromCloudinary(req.user.avatarPublicId);
    }

    // 2. Delete from DB (Cascade will handle memberships/messages)
    await prisma.user.delete({
        where: { id: req.user.id }
    });

    // 3. Clear Cookies
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
    };
    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);

    return res.status(200).json(
        new ApiResponse(200, {}, "User account deleted successfully")
    );
});

export {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    updateUserName,
    updateAvatar,
    updatePassword,
    deleteUser
};