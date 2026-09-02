import multer from "multer";

// Configure Multer memory storage for direct buffer upload
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max file size
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."));
    }
  },
});

// Configure Multer for document/certificate uploads (PDF + Images, max 10MB)
export const uploadDocument = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max file size
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and image files (JPG, PNG, WebP) are allowed."));
    }
  },
});


