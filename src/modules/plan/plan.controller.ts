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

export const planController = {
  createPlan,
  getAllPlans,
  getPlanById,
  updatePlan,
  togglePlanStatus,
  deletePlan,
};

