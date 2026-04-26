import { getProductRequestList, updateProductRequestStatus } from "../models/productRequestModel.js";

const VALID_STATUSES = ["pending", "approved", "rejected", "in_progress", "completed"];

export const listProductRequests = async (req, res) => {
  try {
    const {
      search   = "",
      category = "all",
      status   = "all",
      sortBy   = "newest",
      page     = "1",
      pageSize = "5",
    } = req.query;

    const result = await getProductRequestList({
      search,
      category,
      status,
      sortBy,
      page:     parseInt(page),
      pageSize: parseInt(pageSize),
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch product requests" });
  }
};

export const patchRequestStatus = async (req, res) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` });
    }

    await updateProductRequestStatus(id, status);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update request status" });
  }
};