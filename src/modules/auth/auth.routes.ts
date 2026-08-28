import { Router } from "express";
import { env } from "../../config/index";
import { passport } from "../../config/passport";
import { auth } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { authController } from "./auth.controller";
import {
  exchangeSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resendOtpSchema,
  verifyEmailSchema,
} from "./auth.validation";

export const authRouter = Router();

authRouter.post(
  "/register",
  validate(registerSchema),
  authController.registerUser,
);

authRouter.post(
  "/verify-email",
  validate(verifyEmailSchema),
  authController.verifyEmail,
);

authRouter.post(
  "/resend-otp",
  validate(resendOtpSchema),
  authController.resendVerificationOtp,
);

authRouter.post(
  "/login",
  validate(loginSchema),
  authController.loginUserWithPassport,
  authController.loginUser,
);

authRouter.post(
  "/refresh-token",
  validate(refreshSchema),
  authController.refreshAuthTokens,
);

authRouter.post(
  "/google/exchange",
  validate(exchangeSchema),
  authController.exchangeGoogleLoginCode,
);

authRouter.post("/logout", authController.logoutUser);
authRouter.get("/me", auth(), authController.getMe);

authRouter.get("/google", authController.startGoogleLogin);

authRouter.get(
  "/google/callback",
  authController.verifyGoogleLoginState,
  passport.authenticate("google", {
    failureRedirect: `${env.FRONTEND_URL}/login?error=google_auth_failed`,
    session: false,
  }),
  authController.googleLoginCallback,
);
