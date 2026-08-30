import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { subscriptionController } from "./subscription.controller";
import {
  createSubscriptionSchema,
  extendSubscriptionSchema,
  updateSubscriptionSchema,
} from "./subscription.validation";

export const subscriptionRouter = Router();

// Admin: Get all subscribers
subscriptionRouter.get(
  "/",
  auth("ADMIN"),
  subscriptionController.getAllSubscribers,
);

// Admin: Get single subscriber
subscriptionRouter.get(
  "/:id",
  auth("ADMIN"),
  subscriptionController.getSubscriberById,
);

// Admin: Create subscription manually
subscriptionRouter.post(
  "/",
  auth("ADMIN"),
  validate(createSubscriptionSchema),
  subscriptionController.createSubscription,
);

// Admin: Update subscription
subscriptionRouter.patch(
  "/:id",
  auth("ADMIN"),
  validate(updateSubscriptionSchema),
  subscriptionController.updateSubscription,
);

// Admin: Extend subscription
subscriptionRouter.patch(
  "/:id/extend",
  auth("ADMIN"),
  validate(extendSubscriptionSchema),
  subscriptionController.extendSubscription,
);

// Admin: Revoke subscription
subscriptionRouter.patch(
  "/:id/revoke",
  auth("ADMIN"),
  subscriptionController.revokeSubscription,
);

