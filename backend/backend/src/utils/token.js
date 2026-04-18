import jwt from 'jsonwebtoken';

/**
 * Generates an Access Token for the user
 * @param {string} userId - The unique identifier of the user
 * @returns {string} - Signed JWT Access Token
 */
export const generateAccessToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '1d' }
    );
};

/**
 * Generates a Refresh Token for the user
 * @param {string} userId - The unique identifier of the user
 * @returns {string} - Signed JWT Refresh Token
 */
export const generateRefreshToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '10d' }
    );
};
