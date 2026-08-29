import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import httpStatus from "http-status";

export type DistrictResponse = {
  value: string;
  label: string;
  upazilas: string[];
};

const getAllDistricts = async (): Promise<DistrictResponse[]> => {
  const districts = await prisma.district.findMany({
    include: { upazilas: true },
    orderBy: { name: "asc" },
  });

  return districts.map((d) => ({
    value: d.slug,
    label: d.name,
    upazilas: d.upazilas.map((u) => u.name),
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
