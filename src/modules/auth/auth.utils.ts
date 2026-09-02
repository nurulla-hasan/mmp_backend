import type { CookieOptions, Response } from "express";
import { env } from "../../config/index";
import { IAuthTokens } from "./auth.types";

const isProduction = env.NODE_ENV === "production";
const cookieDomain = isProduction
  ? `.${new URL(env.FRONTEND_URL).hostname.replace(/^www\./, "")}`
  : undefined;

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  domain: cookieDomain,
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
