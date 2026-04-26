import {
  getFeedbackList,
  getFeedbackStats,
  getAllFeedbackForExport,
  updateFeedbackStatus,
  createRating,
  createProductRequest,
} from "../models/feedbackModel.js";

export const listFeedback = async (req, res) => {
  try {
    const {
      search   = "",
      category = "all",
      rating   = "0",
      sortBy   = "newest",
      status   = "new",
      page     = "1",
      pageSize = "5",
    } = req.query;

    const result = await getFeedbackList({
      search,
      category,
      rating:   parseInt(rating),
      sortBy,
      status,
      page:     parseInt(page),
      pageSize: parseInt(pageSize),
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch feedback" });
  }
};

export const feedbackStats = async (req, res) => {
  try {
    const stats = await getFeedbackStats();
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch feedback stats" });
  }
};

export const exportFeedback = async (req, res) => {
  try {
    const data = await getAllFeedbackForExport();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to export feedback" });
  }
};

export const patchFeedbackStatus = async (req, res) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    if (!["new", "reviewed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status. Must be 'new' or 'reviewed'" });
    }

    await updateFeedbackStatus(id, status);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update feedback status" });
  }
};

export const submitRating = async (req, res) => {
  try {
    const { residentName, rating, feedbackCategory, feedback } = req.body;

    if (!rating || rating < 1 || rating > 3) {
      return res.status(400).json({ error: "Rating must be between 1 and 3" });
    }

    await createRating({ residentName, rating, feedbackCategory, feedback });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit rating" });
  }
};

export const submitProductRequest = async (req, res) => {
  try {
    const { residentName, productName, description, requestCategory } = req.body;

    if (!productName) {
      return res.status(400).json({ error: "Product name is required" });
    }

    await createProductRequest({ residentName, productName, description, requestCategory });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit product request" });
  }
};