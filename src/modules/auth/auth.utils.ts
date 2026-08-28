import type { CookieOptions, Response } from "express";
import httpStatus from "http-status";
import type { User } from "../../../generated/prisma/client";
import { env } from "../../config/index.js";
import { AppError } from "../../utils/app-error.js";
import { IAuthTokens } from "./auth.types";

const isProduction = env.NODE_ENV === "production";

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
};

export const setAuthCookies = (res: Response, tokens: IAuthTokens): void => {
  res.cookie("accessToken", tokens.accessToken, {
    ...baseCookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", tokens.refreshToken, {
    ...baseCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const clearAuthCookies = (res: Response): void => {
  res.clearCookie("accessToken", baseCookieOptions);
  res.clearCookie("refreshToken", baseCookieOptions);
};

export const ensureActiveUser = (user: User | null): User => {
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.status !== "ACTIVE") {
    throw new AppError(httpStatus.FORBIDDEN, "Your account is unavailable");
  }

  return user;
};

