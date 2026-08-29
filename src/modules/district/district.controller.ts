import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { districtService } from "./district.service";
import {
  createDistrictSchema,
  createUpazilaSchema,
  updateDistrictSchema,
  updateUpazilaSchema,
} from "./district.validation";

const getAllDistricts = catchAsync(async (_req, res) => {
  const result = await districtService.getAllDistricts();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "All districts retrieved.",
    data: result,
  });
});

const createDistrict = catchAsync(async (req, res) => {
  const payload = createDistrictSchema.parse(req.body);
  const result = await districtService.createDistrict(payload);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "District created successfully.",
    data: result,
  });
});

const updateDistrict = catchAsync(async (req, res) => {
  const payload = updateDistrictSchema.parse(req.body);
  const result = await districtService.updateDistrict(String(req.params.id), payload);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "District updated successfully.",
    data: result,
  });
});

const deleteDistrict = catchAsync(async (req, res) => {
  await districtService.deleteDistrict(String(req.params.id));
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "District deleted successfully.",
    data: null,
  });
});

const createUpazila = catchAsync(async (req, res) => {
  const payload = createUpazilaSchema.parse(req.body);
  const result = await districtService.createUpazila(payload);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Upazila created successfully.",
    data: result,
  });
});

const updateUpazila = catchAsync(async (req, res) => {
  const payload = updateUpazilaSchema.parse(req.body);
  const result = await districtService.updateUpazila(String(req.params.id), payload);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Upazila updated successfully.",
    data: result,
  });
});

const deleteUpazila = catchAsync(async (req, res) => {
  await districtService.deleteUpazila(String(req.params.id));
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Upazila deleted successfully.",
    data: null,
  });
});

export const districtController = {
  getAllDistricts,
  createDistrict,
  updateDistrict,
  deleteDistrict,
  createUpazila,
  updateUpazila,
  deleteUpazila,
};
