import { Router } from "express";
import { auth, optionalAuth } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { broadcastController } from "./broadcast.controller";
import {
  createBroadcastSchema,
  updateBroadcastSchema,
} from "./broadcast.validation";

export const broadcastRouter = Router();

// Public/User: Get active announcements. A valid session is optional and is
// used only to include audience-targeted USER/SURVEYOR/PRO announcements.
broadcastRouter.get("/active", optionalAuth, broadcastController.getActiveBroadcasts);

// Admin: Get all announcements
broadcastRouter.get("/", auth("ADMIN"), broadcastController.getAllBroadcasts);

// Admin: Get single announcement
broadcastRouter.get("/:id", auth("ADMIN"), broadcastController.getBroadcastById);

// Admin: Create announcement
broadcastRouter.post(
  "/",
  auth("ADMIN"),
  validate(createBroadcastSchema),
  broadcastController.createBroadcast,
);

// Admin: Update announcement
broadcastRouter.patch(
  "/:id",
  auth("ADMIN"),
  validate(updateBroadcastSchema),
  broadcastController.updateBroadcast,
);

// Admin: Toggle active status
broadcastRouter.patch(
  "/:id/status",
  auth("ADMIN"),
  broadcastController.toggleBroadcastStatus,
);

// Admin: Delete announcement
broadcastRouter.delete(
  "/:id",
  auth("ADMIN"),
  broadcastController.deleteBroadcast,
);
