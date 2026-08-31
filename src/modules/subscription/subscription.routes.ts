import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { subscriptionController } from "./subscription.controller";
import {
  createSubscriptionSchema,
  extendSubscriptionSchema,
  manualCheckoutSchema,
  updatePaymentNumbersSchema,
  updateSubscriptionSchema,
  approveSubscriptionSchema,
  rejectSubscriptionSchema,
} from "./subscription.validation";

export const subscriptionRouter = Router();

// 1. Get payment numbers (Public / Auth)
subscriptionRouter.get(
  "/payment-numbers",
  subscriptionController.getPaymentNumbers,
);

// 2. Update payment numbers (Admin)
subscriptionRouter.patch(
  "/payment-numbers",
  auth("ADMIN"),
  validate(updatePaymentNumbersSchema),
  subscriptionController.updatePaymentNumbers,
);

// 3. User submits manual payment checkout
subscriptionRouter.post(
  "/manual-checkout",
  auth(),
  validate(manualCheckoutSchema),
  subscriptionController.submitManualCheckout,
);

// 4. Current user's subscription info
subscriptionRouter.get(
  "/my-subscription",
  auth(),
  subscriptionController.getMySubscription,
);

// 5. Admin: Approve subscription
subscriptionRouter.patch(
  "/:id/approve",
  auth("ADMIN"),
  validate(approveSubscriptionSchema),
  subscriptionController.approveSubscription,
);

// 6. Admin: Reject subscription
subscriptionRouter.patch(
  "/:id/reject",
  auth("ADMIN"),
  validate(rejectSubscriptionSchema),
  subscriptionController.rejectSubscription,
);

// 7. Admin: Get all subscribers
subscriptionRouter.get(
  "/",
  auth("ADMIN"),
  subscriptionController.getAllSubscribers,
);

// 8. Admin: Get single subscriber
subscriptionRouter.get(
  "/:id",
  auth("ADMIN"),
  subscriptionController.getSubscriberById,
);

// 9. Admin: Create subscription manually
subscriptionRouter.post(
  "/",
  auth("ADMIN"),
  validate(createSubscriptionSchema),
  subscriptionController.createSubscription,
);

// 10. Admin: Update subscription
subscriptionRouter.patch(
  "/:id",
  auth("ADMIN"),
  validate(updateSubscriptionSchema),
  subscriptionController.updateSubscription,
);

// 11. Admin: Extend subscription
subscriptionRouter.patch(
  "/:id/extend",
  auth("ADMIN"),
  validate(extendSubscriptionSchema),
  subscriptionController.extendSubscription,
);

// 12. Admin: Revoke subscription
subscriptionRouter.patch(
  "/:id/revoke",
  auth("ADMIN"),
  subscriptionController.revokeSubscription,
);
