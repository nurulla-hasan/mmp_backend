import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { subscriptionService } from "./subscription.service";
import { getSubscribersQuerySchema } from "./subscription.validation";

// 1. Get Payment Numbers & Instructions (Public / Auth)
const getPaymentNumbers = catchAsync(async (_req, res) => {
  const result = await subscriptionService.getPaymentNumbers();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payment numbers retrieved successfully.",
    data: result,
  });
});

// 2. Update Payment Numbers & Instructions (Admin)
const updatePaymentNumbers = catchAsync(async (req, res) => {
  const result = await subscriptionService.updatePaymentNumbers(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payment numbers updated successfully.",
    data: result,
  });
});

// 3. User submits manual payment checkout
const submitManualCheckout = catchAsync(async (req, res) => {
  const result = await subscriptionService.submitManualCheckout(
    req.user!.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Payment request submitted successfully. Pending admin approval.",
    data: result,
  });
});

// 4. Current user's subscription info
const getMySubscription = catchAsync(async (req, res) => {
  const result = await subscriptionService.getMySubscription(req.user!.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User subscription retrieved successfully.",
    data: result,
  });
});

// 5. Admin Approves Subscription
const approveSubscription = catchAsync(async (req, res) => {
  const result = await subscriptionService.approveSubscription(
    String(req.params.id),
    req.body.adminNote,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Subscription approved and activated successfully.",
    data: result,
  });
});

// 6. Admin Rejects Subscription
const rejectSubscription = catchAsync(async (req, res) => {
  const result = await subscriptionService.rejectSubscription(
    String(req.params.id),
    req.body.adminNote,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Subscription request rejected.",
    data: result,
  });
});

// 7. Get all subscribers (Admin)
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

// 8. Get single subscriber by ID (Admin)
const getSubscriberById = catchAsync(async (req, res) => {
  const result = await subscriptionService.getSubscriberById(
    String(req.params.id),
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Subscriber retrieved successfully.",
    data: result,
  });
});

// 9. Create subscription manually (Admin)
const createSubscription = catchAsync(async (req, res) => {
  const result = await subscriptionService.createSubscription(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Subscription created successfully.",
    data: result,
  });
});

// 10. Update subscription (Admin)
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

// 11. Extend subscription (Admin)
const extendSubscription = catchAsync(async (req, res) => {
  const result = await subscriptionService.extendSubscription(
    String(req.params.id),
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Subscription extended successfully.",
    data: result,
  });
});

// 12. Revoke subscription (Admin)
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

export const subscriptionController = {
  getPaymentNumbers,
  updatePaymentNumbers,
  submitManualCheckout,
  getMySubscription,
  approveSubscription,
  rejectSubscription,
  getAllSubscribers,
  getSubscriberById,
  createSubscription,
  updateSubscription,
  extendSubscription,
  revokeSubscription,
};
