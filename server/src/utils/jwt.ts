import jwt, { type SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
  throw new Error(
    "FATAL: JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set in environment variables",
  );
}

const ACCESS_SECRET: string = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET: string = process.env.JWT_REFRESH_SECRET;

export interface TokenPayload {
  userId: string;
  email: string;
}

/**
 * Generate access token (short-lived, 15 minutes)
 */
export function generateAccessToken(payload: TokenPayload): string {
  const options: SignOptions = { expiresIn: "15m" };
  return jwt.sign(payload, ACCESS_SECRET, options);
}

/**
 * Generate refresh token (long-lived, 7 days)
 */
export function generateRefreshToken(payload: TokenPayload): string {
  const options: SignOptions = { expiresIn: "7d" };
  return jwt.sign(payload, REFRESH_SECRET, options);
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, ACCESS_SECRET) as unknown as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(
      token,
      REFRESH_SECRET,
    ) as unknown as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare password with hash
 */
export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Hash refresh token for storage in database
 */
export async function hashRefreshToken(token: string): Promise<string> {
  return hashPassword(token);
}

/**
 * Cookie options for production-ready security
 */
const isProduction = process.env.NODE_ENV === "production";

export const accessTokenCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" as const : "lax" as const,
  maxAge: 15 * 60 * 1000,
  path: "/",
};

export const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" as const : "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};
