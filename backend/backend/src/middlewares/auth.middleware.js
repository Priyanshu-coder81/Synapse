import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized Access");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Prisma: Use findUnique with 'id' instead of '_id'
        const user = await prisma.user.findUnique({
            where: { 
                id: decodedToken?.userId || decodedToken?.id 
            },
            select: {
                id: true,
                email: true,
                username: true,
                avatarUrl: true,
                createdAt: true,
                updatedAt: true
                // password is not selected, so it won't be in the object
            }
        });

        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token");
    }
});