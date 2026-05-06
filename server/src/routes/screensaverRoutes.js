import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  getScreensaverImages,
  uploadScreensaverImage,
  deleteScreensaverImage,
  updateScreensaverImageOrder,
} from "../controllers/screensaverController.js";

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = "uploads/";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Created uploads directory");
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      "screensaver-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

// Routes
router.get("/", getScreensaverImages);
router.post("/", upload.single("image"), uploadScreensaverImage);
router.delete("/:id", deleteScreensaverImage);
router.patch("/:id/order", updateScreensaverImageOrder);

export default router;
