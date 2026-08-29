import bcrypt from "bcryptjs";
import { env } from "../config/index";
import { prisma } from "./prisma";

const ADMIN_EMAIL = env.ADMIN_EMAIL ?? "admin@mouzamappro.com";
const ADMIN_NAME = env.ADMIN_NAME ?? "System Admin";
const ADMIN_PASSWORD = env.ADMIN_PASSWORD ?? "Admin@123456";

const SURVEYOR_EMAIL = env.SURVEYOR_EMAIL ?? "surveyor@mouzamappro.com";
const SURVEYOR_NAME = env.SURVEYOR_NAME ?? "Demo Surveyor";
const SURVEYOR_PASSWORD = env.SURVEYOR_PASSWORD ?? "Surveyor@123456";

export const seedAdmin = async (): Promise<void> => {
  const existing = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (existing) {
    console.log(`Admin already exists: ${ADMIN_EMAIL}`);
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  await prisma.user.create({
    data: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: passwordHash,
      role: "ADMIN",
      emailVerified: true,
      status: "ACTIVE",
    },
  });

  console.log(`Admin seeded successfully: ${ADMIN_EMAIL}`);
};

const SEED_SERVICES = [
  { slug: "land-measurement", name: "Land Measurement" },
  { slug: "mouza-map-studio", name: "Mouza Map Studio" },
  { slug: "land-division", name: "Land Division" },
  { slug: "boundary-determination", name: "Boundary Determination" },
  { slug: "digital-survey", name: "Digital Survey" },
  { slug: "survey-report", name: "Survey Report" },
  { slug: "khatian-search", name: "Khatian Search" },
  { slug: "mutation", name: "Mutation (Namjari)" },
  { slug: "record-verification", name: "Record Verification" },
  { slug: "plot-layout", name: "Plot Layout & Design" },
];

const seedServices = async (): Promise<void> => {
  for (const service of SEED_SERVICES) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: {},
      create: service,
    });
  }
  console.log(`Seeded ${SEED_SERVICES.length} services.`);
};

export const seedSurveyor = async (): Promise<void> => {
  const existing = await prisma.user.findUnique({
    where: { email: SURVEYOR_EMAIL },
  });

  if (existing) {
    console.log(`Surveyor already exists: ${SURVEYOR_EMAIL}`);
    return;
  }

  await seedServices();

  const passwordHash = await bcrypt.hash(SURVEYOR_PASSWORD, 12);

  await prisma.user.create({
    data: {
      name: SURVEYOR_NAME,
      email: SURVEYOR_EMAIL,
      password: passwordHash,
      role: "SURVEYOR",
      emailVerified: true,
      status: "ACTIVE",
      district: "Dhaka",
      upazila: "Tejgaon",
      surveyorProfile: {
        create: {
          slug: "demo-surveyor",
          headline: "Professional Land Surveyor",
          bio: "Experienced surveyor for Mouza Map Pro demo.",
          experienceYears: 5,
          verificationStatus: "APPROVED",
          isVerified: true,
          verifiedAt: new Date(),
          surveyorServices: {
            create: [
              { service: { connect: { slug: "land-measurement" } }, startingPrice: 500 },
              { service: { connect: { slug: "mouza-map-studio" } }, startingPrice: 800 },
            ],
          },
          serviceAreas: {
            create: [
              { district: "Dhaka", upazilas: ["Tejgaon", "Gulshan", "Dhanmondi"] },
              { district: "Chittagong", upazilas: ["Kotwali", "Pahartali"] },
            ],
          },
        },
      },
    },
  });

  console.log(`Surveyor seeded successfully: ${SURVEYOR_EMAIL}`);
};
