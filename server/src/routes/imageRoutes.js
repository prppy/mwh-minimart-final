import express from 'express';
const imageRouter = express.Router();
import * as imageController from '../controllers/imageController.js';

// Generate AI image
imageRouter.post('/generate', imageController.generateAIImage);

// Upload image to Supabase
imageRouter.post('/upload', imageController.uploadImageToSupabase);

// Combined: Generate and save
imageRouter.post('/generate-and-save', imageController.generateAndSaveImage);

export default imageRouter;
