import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { planService } from "./plan.service";
import { getPlansQuerySchema } from "./plan.validation";

// 1. Create plan (Admin)
const createPlan = catchAsync(async (req, res) => {
  const result = await planService.createPlan(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Subscription plan created successfully.",
    data: result,
  });
});

// 2. Get all plans
const getAllPlans = catchAsync(async (req, res) => {
  const query = getPlansQuerySchema.parse(req.query);
  const result = await planService.getAllPlans(query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Plans retrieved successfully.",
    data: result.data,
    meta: result.meta,
  });
});

// 3. Get single plan by ID
const getPlanById = catchAsync(async (req, res) => {
  const result = await planService.getPlanById(String(req.params.id));
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Plan details retrieved successfully.",
    data: result,
  });
});

// 4. Update plan (Admin)
const updatePlan = catchAsync(async (req, res) => {
  const result = await planService.updatePlan(String(req.params.id), req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Plan updated successfully.",
    data: result,
  });
});

// 5. Toggle plan active status (Admin)
const togglePlanStatus = catchAsync(async (req, res) => {
  const result = await planService.togglePlanStatus(String(req.params.id));
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `Plan ${result.isActive ? "activated" : "deactivated"} successfully.`,
    data: result,
  });
});

// 6. Delete plan (Admin)
const deletePlan = catchAsync(async (req, res) => {
  await planService.deletePlan(String(req.params.id));
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Plan deleted successfully.",
    data: null,
  });
});

// 7. Get auto-pro on register setting
const getAutoProSetting = catchAsync(async (_req, res) => {
  const result = await planService.getAutoProSetting();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Auto-pro setting retrieved successfully.",
    data: result,
  });
});

// 8. Update auto-pro on register setting (Admin)
const setAutoProSetting = catchAsync(async (req, res) => {
  const enabled =
    req.body.enabled !== undefined ? Boolean(req.body.enabled) : undefined;
  const planId =
    req.body.planId !== undefined ? (req.body.planId as string | null) : undefined;

  const result = await planService.setAutoProSetting({ enabled, planId });
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `Auto-grant Pro setting updated.`,
    data: result,
  });
});

export const planController = {
  createPlan,
  getAllPlans,
  getPlanById,
  updatePlan,
  togglePlanStatus,
  deletePlan,
  getAutoProSetting,
  setAutoProSetting,
};

