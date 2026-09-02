import httpStatus from "http-status";
import { AppError } from "../../utils/app-error";
import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { surveyorProfileService } from "./surveyor-profile.service";
import { getVerificationsQuerySchema } from "./surveyor-profile.validation";

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
    message: `Surveyor verification ${result.verificationStatus.toLowerCase()} successfully.`,
    data: result,
  });
});

const getAllSurveyors = catchAsync(async (req, res) => {
  const result = await surveyorProfileService.getAllSurveyors(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Surveyors retrieved successfully.",
    data: result.data,
    meta: result.meta,
  });
});

const getSurveyorBySlug = catchAsync(async (req, res) => {
  const result = await surveyorProfileService.getSurveyorBySlug(
    req.params.slug as string,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Surveyor details retrieved.",
    data: result,
  });
});

// Admin: Get all verification requests
const getVerificationRequests = catchAsync(async (req, res) => {
  const query = getVerificationsQuerySchema.parse(req.query);
  const result = await surveyorProfileService.getVerificationRequests(query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Verification requests retrieved successfully.",
    data: result.data,
    meta: result.meta,
  });
});

// Admin: Get verification request details
const getVerificationRequestById = catchAsync(async (req, res) => {
  const result = await surveyorProfileService.getVerificationRequestById(
    req.params.id as string,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Verification request retrieved successfully.",
    data: result,
  });
});

// Upload certificate document (PDF / Image)
const uploadCertificate = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new AppError(httpStatus.BAD_REQUEST, "No certificate file provided.");
  }

  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized.");
  }

  const result = await surveyorProfileService.uploadCertificate(
    userId,
    req.file.buffer,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Certificate uploaded successfully.",
    data: result,
  });
});

// Delete certificate document (rollback / cleanup)
const deleteCertificate = catchAsync(async (req, res) => {
  const { publicId } = req.body;
  if (!publicId) {
    throw new AppError(httpStatus.BAD_REQUEST, "publicId is required.");
  }

  await surveyorProfileService.deleteCertificate(publicId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Certificate removed successfully.",
    data: null,
  });
});

export const surveyorProfileController = {
  getAllSurveyors,
  getSurveyorBySlug,
  applyAsSurveyor,
  getMyProfile,
  updateMyProfile,
  verifySurveyor,
  getVerificationRequests,
  getVerificationRequestById,
  uploadCertificate,
  deleteCertificate,
};

