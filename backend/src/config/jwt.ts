import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { env } from './environment';

export const JWT_SECRET: string = env.JWT_SECRET;
export const JWT_EXPIRES_IN: string = env.JWT_EXPIRES_IN;

export interface TokenPayload {
  userId: string;
  role: string;
  email: string;
}

export const generateToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as any,
  };
  return jwt.sign(payload, JWT_SECRET, options);
};

export const verifyToken = (token: string): TokenPayload => {
  const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & TokenPayload;
  return {
    userId: decoded.userId,
    role: decoded.role,
    email: decoded.email,
  };
};
