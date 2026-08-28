import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { serviceService } from "./service.service";

const createService = catchAsync(async (req, res) => {
  const result = await serviceService.createService(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Service created successfully.",
    data: result,
  });
});

const getAllServices = catchAsync(async (_req, res) => {
  const result = await serviceService.getAllServices();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "All services retrieved.",
    data: result,
  });
});

const getActiveServices = catchAsync(async (_req, res) => {
  const result = await serviceService.getActiveServices();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Active services retrieved.",
    data: result,
  });
});


const updateService = catchAsync(async (req, res) => {
  const result = await serviceService.updateService(req.params.slug as string, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Service updated successfully.",
    data: result,
  });
});

const deleteService = catchAsync(async (req, res) => {
  await serviceService.deleteService(req.params.slug as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Service deleted successfully.",
    data: null,
  });
});

export const serviceController = {
  createService,
  getAllServices,
  getActiveServices,
  updateService,
  deleteService,
};
