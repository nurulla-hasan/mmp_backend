import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { surveyorServiceService } from "./surveyor-service.service";

const addService = catchAsync(async (req, res) => {
  const result = await surveyorServiceService.addService(
    req.user!.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Service added to your profile.",
    data: result,
  });
});

const getMyServices = catchAsync(async (req, res) => {
  const result = await surveyorServiceService.getMyServices(req.user!.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Your services retrieved.",
    data: result,
  });
});

const updateServicePrice = catchAsync(async (req, res) => {
  const result = await surveyorServiceService.updateServicePrice(
    req.user!.id,
    req.params.id as string,
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Service price updated.",
    data: result,
  });
});

const removeService = catchAsync(async (req, res) => {
  await surveyorServiceService.removeService(
    req.user!.id,
    req.params.id as string,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Service removed from your profile.",
    data: null,
  });
});

export const surveyorServiceController = {
  addService,
  getMyServices,
  updateServicePrice,
  removeService,
};
