import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { subscriptionService } from "./subscription.service";
import {
  extendSubscriptionSchema,
  getSubscribersQuerySchema,
} from "./subscription.validation";

// 1. Admin: Create subscription
const createSubscription = catchAsync(async (req, res) => {
  const result = await subscriptionService.createSubscription(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Subscription created successfully.",
    data: result,
  });
});

// 2. Admin: Get all subscribers
const getAllSubscribers = catchAsync(async (req, res) => {
  const query = getSubscribersQuerySchema.parse(req.query);
  const result = await subscriptionService.getAllSubscribers(query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Subscribers retrieved successfully.",
    data: result.data,
    meta: result.meta,
  });
});

// 3. Admin: Get single subscriber by ID
const getSubscriberById = catchAsync(async (req, res) => {
  const result = await subscriptionService.getSubscriberById(
    String(req.params.id),
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Subscription details retrieved successfully.",
    data: result,
  });
});

// 4. Admin: Update subscription
const updateSubscription = catchAsync(async (req, res) => {
  const result = await subscriptionService.updateSubscription(
    String(req.params.id),
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Subscription updated successfully.",
    data: result,
  });
});

// 5. Admin: Revoke subscription
const revokeSubscription = catchAsync(async (req, res) => {
  const result = await subscriptionService.revokeSubscription(
    String(req.params.id),
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Subscription revoked successfully.",
    data: result,
  });
});

// 6. Admin: Extend subscription
const extendSubscription = catchAsync(async (req, res) => {
  const body = extendSubscriptionSchema.parse(req.body);
  const result = await subscriptionService.extendSubscription(
    String(req.params.id),
    body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `Subscription extended by ${body.days} days successfully.`,
    data: result,
  });
});

export const subscriptionController = {
  createSubscription,
  getAllSubscribers,
  getSubscriberById,
  updateSubscription,
  revokeSubscription,
  extendSubscription,
};

