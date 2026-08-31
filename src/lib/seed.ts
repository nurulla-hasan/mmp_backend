import bcrypt from "bcryptjs";
import { env } from "../config/index";
import { prisma } from "./prisma";

const ADMIN_EMAIL = env.ADMIN_EMAIL ?? "admin@mouzamappro.com";
const ADMIN_NAME = env.ADMIN_NAME ?? "Super Admin";
const ADMIN_PASSWORD = env.ADMIN_PASSWORD ?? "11111111";

export const seedAdmin = async (): Promise<void> => {
  const existing = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (existing) {
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  await prisma.user.create({
    data: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: passwordHash,
      role: "SUPER_ADMIN",
      emailVerified: true,
      status: "ACTIVE",
      isSubscribed: true,
    },
  });

  console.log(`Super Admin seeded successfully: ${ADMIN_EMAIL}`);
};
