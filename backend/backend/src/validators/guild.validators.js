import { z } from 'zod';

export const createGuildSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
    description: z.string().max(500, "Description too long").optional(),
});

export const createChannelSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name too long"),
    topic: z.string().max(200, "Topic too long").optional(),
});

export const joinGuildSchema = z.object({
    inviteCode: z.string().min(1, "Invite code is required"),
});
