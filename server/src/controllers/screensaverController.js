import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all screensaver images
export const getScreensaverImages = async (req, res) => {
  try {
    // Check if the table exists (prisma model is available)
    if (!prisma.screensaverImage) {
      // Return empty array if table doesn't exist yet
      console.log("ScreensaverImage table not found - returning empty array (will use default images)");
      return res.json([]);
    }
    
    const images = await prisma.screensaverImage.findMany({
      orderBy: {
        displayOrder: "asc",
      },
    });
    res.json(images);
  } catch (error) {
    console.error("Error fetching screensaver images:", error);
    // Return empty array on error (will use default images)
    res.json([]);
  }
};

// Upload new screensaver image
export const uploadScreensaverImage = async (req, res) => {
  try {
    if (!prisma.screensaverImage) {
      return res.status(503).json({ 
        error: { message: "Screensaver feature not available. Please run the database migration first." } 
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: { message: "No image file provided" } });
    }

    // Get the next display order
    const lastImage = await prisma.screensaverImage.findFirst({
      orderBy: {
        displayOrder: "desc",
      },
    });

    const displayOrder = lastImage ? lastImage.displayOrder + 1 : 1;

    // Create the image record
    const imageUrl = `/uploads/${req.file.filename}`;
    const image = await prisma.screensaverImage.create({
      data: {
        imageUrl,
        displayOrder,
      },
    });

    res.status(201).json(image);
  } catch (error) {
    console.error("Error uploading screensaver image:", error);
    res.status(500).json({ error: { message: "Failed to upload screensaver image" } });
  }
};

// Delete screensaver image
export const deleteScreensaverImage = async (req, res) => {
  try {
    if (!prisma.screensaverImage) {
      return res.status(503).json({ 
        error: { message: "Screensaver feature not available. Please run the database migration first." } 
      });
    }
    
    const { id } = req.params;

    const image = await prisma.screensaverImage.findUnique({
      where: { id: parseInt(id) },
    });

    if (!image) {
      return res.status(404).json({ error: { message: "Image not found" } });
    }

    // Delete from database
    await prisma.screensaverImage.delete({
      where: { id: parseInt(id) },
    });

    // TODO: Delete file from filesystem if needed
    // const fs = require('fs');
    // const path = require('path');
    // const filePath = path.join(__dirname, '../../..', image.imageUrl);
    // if (fs.existsSync(filePath)) {
    //   fs.unlinkSync(filePath);
    // }

    res.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Error deleting screensaver image:", error);
    res.status(500).json({ error: { message: "Failed to delete screensaver image" } });
  }
};

// Update display order
export const updateScreensaverImageOrder = async (req, res) => {
  try {
    if (!prisma.screensaverImage) {
      return res.status(503).json({ 
        error: { message: "Screensaver feature not available. Please run the database migration first." } 
      });
    }
    
    const { id } = req.params;
    const { displayOrder } = req.body;

    const image = await prisma.screensaverImage.update({
      where: { id: parseInt(id) },
      data: { displayOrder: parseInt(displayOrder) },
    });

    res.json(image);
  } catch (error) {
    console.error("Error updating screensaver image order:", error);
    res.status(500).json({ error: { message: "Failed to update image order" } });
  }
};
