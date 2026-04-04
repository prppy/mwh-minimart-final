import { getFeedbackList, getFeedbackStats, getAllFeedbackForExport } from "../models/feedbackModel.js";

export const listFeedback = async (req, res) => {
  try {
    const {
      search   = "",
      category = "all",
      rating   = "0",
      sortBy   = "newest",
      page     = "1",
      pageSize = "5",
    } = req.query;

    const result = await getFeedbackList({
      search,
      category,
      rating:   parseInt(rating),
      sortBy,
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