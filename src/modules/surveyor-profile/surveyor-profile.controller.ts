import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { surveyorProfileService } from "./surveyor-profile.service";

const applyAsSurveyor = catchAsync(async (req, res) => {
  const result = await surveyorProfileService.applyAsSurveyor(
    req.user!.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Surveyor application submitted. Awaiting admin verification.",
    data: result,
  });
});

const getMyProfile = catchAsync(async (req, res) => {
  const result = await surveyorProfileService.getMyProfile(req.user!.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Surveyor profile retrieved.",
    data: result,
  });
});

const updateMyProfile = catchAsync(async (req, res) => {
  const result = await surveyorProfileService.updateMyProfile(
    req.user!.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Surveyor profile updated.",
    data: result,
  });
});

const verifySurveyor = catchAsync(async (req, res) => {
  const result = await surveyorProfileService.verifySurveyor(
    req.params.userId as string,
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `Surveyor ${result.verificationStatus.toLowerCase()}.`,
    data: result,
  });
});

export const surveyorProfileController = {
  applyAsSurveyor,
  getMyProfile,
  updateMyProfile,
  verifySurveyor,
};
