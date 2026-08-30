import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { serviceService } from "./service.service";
import { getServicesQuerySchema } from "./service.validation";

// 1. Get all services
const getAllServices = catchAsync(async (req, res) => {
  const query = getServicesQuerySchema.parse(req.query);
  const result = await serviceService.getAllServices(query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Services retrieved successfully.",
    data: result.data,
    meta: result.meta,
  });
});

// 2. Get service by ID or Slug
const getServiceById = catchAsync(async (req, res) => {
  const result = await serviceService.getServiceById(String(req.params.id));
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Service details retrieved successfully.",
    data: result,
  });
});

// 3. Create service (Admin only)
const createService = catchAsync(async (req, res) => {
  const result = await serviceService.createService(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Service created successfully.",
    data: result,
  });
});

// 4. Update service (Admin only)
const updateService = catchAsync(async (req, res) => {
  const result = await serviceService.updateService(
    String(req.params.id),
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Service updated successfully.",
    data: result,
  });
});

// 5. Delete service (Admin only)
const deleteService = catchAsync(async (req, res) => {
  await serviceService.deleteService(String(req.params.id));
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Service deleted successfully.",
    data: null,
  });
});

export const serviceController = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
};
