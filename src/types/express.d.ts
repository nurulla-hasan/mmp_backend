import 'express-serve-static-core';
import type { Role, UserStatus } from '../../generated/prisma/enums';

declare global {
  namespace Express {
    interface User {
      id: string;
      name: string;
      email: string;
      role: Role;
      status: UserStatus;
      emailVerified: boolean;
      imageUrl: string;
    }
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: Express.User;
  }
}
