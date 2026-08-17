import "express-serve-static-core";
import type { Role, UserStatus } from "../generated/prisma/enums";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      name: string;
      email: string;
      role: Role;
      status: UserStatus;
    };
  }
}
