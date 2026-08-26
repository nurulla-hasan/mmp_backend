import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';

const createToken = (payload: JwtPayload, secret: string, expiresIn: string | number): string =>
  jwt.sign(payload, secret, {
    expiresIn: expiresIn as SignOptions['expiresIn'],
  });

const verifyToken = (token: string, secret: string): JwtPayload =>
  jwt.verify(token, secret) as JwtPayload;

export const jwtUtils = {
  createToken,
  verifyToken,
};
