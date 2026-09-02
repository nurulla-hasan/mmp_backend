import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { broadcastService } from "./broadcast.service";
import { getBroadcastsQuerySchema } from "./broadcast.validation";

// 1. Admin: Create broadcast
const createBroadcast = catchAsync(async (req, res) => {
  const result = await broadcastService.createBroadcast(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Broadcast announcement created successfully.",
    data: result,
  });
});

// 2. Admin: Get all broadcasts
const getAllBroadcasts = catchAsync(async (req, res) => {
  const query = getBroadcastsQuerySchema.parse(req.query);
  const result = await broadcastService.getAllBroadcasts(query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Broadcast announcements retrieved successfully.",
    data: result.data,
    meta: result.meta,
  });
});

// 3. Public/User: Get active broadcasts
const getActiveBroadcasts = catchAsync(async (req, res) => {
  const result = await broadcastService.getActiveBroadcasts({
    role: req.user?.role,
    isSubscribed: req.user?.isSubscribed,
  });
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Active broadcast announcements retrieved successfully.",
    data: result,
  });
});

// 4. Admin: Get single broadcast
const getBroadcastById = catchAsync(async (req, res) => {
  const result = await broadcastService.getBroadcastById(String(req.params.id));
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Broadcast details retrieved successfully.",
    data: result,
  });
});

// 5. Admin: Update broadcast
const updateBroadcast = catchAsync(async (req, res) => {
  const result = await broadcastService.updateBroadcast(
    String(req.params.id),
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Broadcast announcement updated successfully.",
    data: result,
  });
});

// 6. Admin: Toggle status
const toggleBroadcastStatus = catchAsync(async (req, res) => {
  const result = await broadcastService.toggleBroadcastStatus(
    String(req.params.id),
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `Broadcast announcement ${result.isActive ? "activated" : "deactivated"} successfully.`,
    data: result,
  });
});

// 7. Admin: Delete broadcast
const deleteBroadcast = catchAsync(async (req, res) => {
  await broadcastService.deleteBroadcast(String(req.params.id));
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Broadcast announcement deleted successfully.",
    data: null,
  });
});

export const broadcastController = {
  createBroadcast,
  getAllBroadcasts,
  getActiveBroadcasts,
  getBroadcastById,
  updateBroadcast,
  toggleBroadcastStatus,
  deleteBroadcast,
};
