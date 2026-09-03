import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import httpStatus from "http-status";

export type UpazilaItem = {
  id: string;
  name: string;
  slug: string;
  districtId: string;
};

export type DistrictResponse = {
  id: string;
  name: string;
  slug: string;
  value: string;
  label: string;
  upazilas: string[];
  upazilaList: UpazilaItem[];
  createdAt?: Date;
  updatedAt?: Date;
};

const getAllDistricts = async (): Promise<DistrictResponse[]> => {
  const districts = await prisma.district.findMany({
    include: {
      upazilas: {
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return districts.map((d) => ({
    id: d.id,
    name: d.name,
    slug: d.slug,
    value: d.slug,
    label: d.name,
    upazilas: d.upazilas.map((u) => u.name),
    upazilaList: d.upazilas.map((u) => ({
      id: u.id,
      name: u.name,
      slug: u.slug,
      districtId: u.districtId,
    })),
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }));
};

const createDistrict = async (payload: { name: string; slug: string }) => {
  return prisma.district.create({
    data: payload,
  });
};

const updateDistrict = async (
  id: string,
  payload: { name?: string; slug?: string },
) => {
  const exists = await prisma.district.findUnique({ where: { id } });
  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, "District not found.");
  }
  return prisma.district.update({
    where: { id },
    data: payload,
  });
};

const deleteDistrict = async (id: string) => {
  const exists = await prisma.district.findUnique({ where: { id } });
  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, "District not found.");
  }
  return prisma.district.delete({ where: { id } });
};

const createUpazila = async (payload: {
  name: string;
  slug: string;
  districtId: string;
}) => {
  return prisma.upazila.create({
    data: payload,
  });
};

const updateUpazila = async (
  id: string,
  payload: { name?: string; slug?: string; districtId?: string },
) => {
  const exists = await prisma.upazila.findUnique({ where: { id } });
  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, "Upazila not found.");
  }
  return prisma.upazila.update({
    where: { id },
    data: payload,
  });
};

const deleteUpazila = async (id: string) => {
  const exists = await prisma.upazila.findUnique({ where: { id } });
  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, "Upazila not found.");
  }
  return prisma.upazila.delete({ where: { id } });
};

export const districtService = {
  getAllDistricts,
  createDistrict,
  updateDistrict,
  deleteDistrict,
  createUpazila,
  updateUpazila,
  deleteUpazila,
};
