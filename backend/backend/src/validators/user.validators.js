import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email("Invalid email format"),
    username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username too long"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
    username: z.string().optional(),
    email: z.email().optional(),
    password: z.string().min(1, "Password is required"),
}).refine(data => data.username || data.email, {
    message: "Either username or email is required",
    path: ["username"],
});

export const updateUserNameSchema = z.object({
    username: z.string().min(3).max(20).optional(),
}).refine(data => data.username, {
    message: "Username is required",
    path: ["username"],
});

export const changePasswordSchema = z.object({
    oldPassword: z.string().min(1, "Old password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
});
