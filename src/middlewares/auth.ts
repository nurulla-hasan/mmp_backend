import type { Request, RequestHandler } from "express";
import { JsonWebTokenError, JwtPayload, TokenExpiredError } from "jsonwebtoken";
import { AppError } from "../utils/app-error";
import httpStatus from "http-status";
import { env } from "../config/index";
import { prisma } from "../lib/prisma";
import { jwtUtils } from "../utils/jwt";
import { catchAsync } from "../utils/catch-async";
import { Role } from "../../generated/prisma/enums";

const validRoles = new Set<Role>(Object.values(Role));

const getAccessToken = (req: Request): string | undefined => {
  const token =
    req.cookies?.accessToken ??
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : req.headers.authorization);

  return token ? token : undefined;
};

export const auth = (...allowedRoles: Role[]): RequestHandler =>
  catchAsync(async (req, _res, next) => {
    const token = getAccessToken(req);

    if (!token) {
      throw new AppError(httpStatus.UNAUTHORIZED, "You are not logged in!");
    }

    let decoded: JwtPayload;
    try {
      decoded = jwtUtils.verifyToken(token, env.JWT_ACCESS_SECRET);
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Access token has expired");
      }
      if (error instanceof JsonWebTokenError) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Access token is invalid");
      }
      throw error;
    }

    if (!validRoles.has(decoded.role as Role)) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Your role is invalid!");
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        emailVerified: true,
      },
    });

    if (!user) {
      throw new AppError(httpStatus.UNAUTHORIZED, "User not found");
    }

    if (!user.emailVerified) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Your email is not verified!");
    }

    if (user.status === "BLOCKED") {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Your account has been blocked!",
      );
    }

    if (
      allowedRoles.length > 0 &&
      !allowedRoles.includes(user.role as Role)
    ) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You do not have permission to access this resource",
      );
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    };
    next();
  });
