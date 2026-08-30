import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { calculationService } from "./calculation.service";
import { getCalculationsQuerySchema } from "./calculation.validation";

const createCalculation = catchAsync(async (req, res) => {
  const result = await calculationService.createCalculation(
    req.user!.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Calculation saved successfully.",
    data: result,
  });
});

const incrementPlotCount = catchAsync(async (req, res) => {
  const result = await calculationService.incrementPlotCount(req.user!.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Plot count incremented successfully.",
    data: result,
  });
});

const getUserCalculations = catchAsync(async (req, res) => {
  const query = getCalculationsQuerySchema.parse(req.query);
  const result = await calculationService.getUserCalculations(
    req.user!.id,
    query,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Calculations retrieved successfully.",
    data: result.data,
    meta: result.meta,
  });
});

const getCalculationById = catchAsync(async (req, res) => {
  const result = await calculationService.getCalculationById(
    req.user!.id,
    req.params.id as string,
    req.user!.role,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Calculation details retrieved.",
    data: result,
  });
});

const updateCalculation = catchAsync(async (req, res) => {
  const result = await calculationService.updateCalculation(
    req.user!.id,
    req.params.id as string,
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Calculation updated successfully.",
    data: result,
  });
});

const deleteCalculation = catchAsync(async (req, res) => {
  await calculationService.deleteCalculation(
    req.user!.id,
    req.params.id as string,
    req.user!.role,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Calculation deleted successfully.",
    data: null,
  });
});

const getMyMeasurementStats = catchAsync(async (req, res) => {
  const result = await calculationService.getMyMeasurementStats(req.user!.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Measurement stats retrieved.",
    data: result,
  });
});

const getAllMeasurementStats = catchAsync(async (req, res) => {
  const result = await calculationService.getAllMeasurementStats();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "All measurement stats retrieved.",
    data: result,
  });
});

export const calculationController = {
  createCalculation,
  incrementPlotCount,
  getUserCalculations,
  getCalculationById,
  updateCalculation,
  deleteCalculation,
  getMyMeasurementStats,
  getAllMeasurementStats,
};
