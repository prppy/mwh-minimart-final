import { validationResult } from "express-validator";
import * as userModel from "../models/userModel.js";

// Get all users with filtering
export const getAllUsers = async (req, res) => {
  try {
    const { role, batchNumber, limit, offset, search, sortBy, sortOrder } =
      req.query;

    const result = await userModel.findMany({
      role,
      batchNumber,
      limit,
      offset,
      search,
      sortBy,
      sortOrder,
    });

    // Sanitize user data
    const sanitizedUsers = result.users.map((user) => userModel.sanitize(user));

    res.json({
      success: true,
      data: {
        users: sanitizedUsers,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      error: { message: "Internal server error" },
    });
  }
};

// Get user by ID
export const readUsersByRole = async (req, res) => {
  try {
    const { role } = req.query;
    const { includeProfilePicture = "true" } = req.query; // Allow excluding profile pictures for performance
    console.log(role);

    if (role !== "developer" && role !== "resident" && role !== "officer") {
      return res.status(400).json({
        message: "Please use a valid user role",
      });
    }

    const result = await userModel.findMany({
      role,
      includeProfilePicture: includeProfilePicture === "true",
    });
    const sanitizedUsers = result.users.map((user) => UserModel.sanitize(user));

    return res.status(200).json({
      message: "List of users of role " + role,
      data: {
        users: sanitizedUsers,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({
      error: { message: "Internal server error" },
    });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const { includeTransactions = false } = req.query;

    const user = await userModel.findById(parseInt(id), {
      includeResident: true,
      includeOfficer: true,
      includeTransactions: includeTransactions === "true",
    });

    if (!user) {
      return res.status(404).json({
        error: { message: "User not found" },
      });
    }

    const sanitizedUser = userModel.sanitize(user);

    res.json({
      success: true,
      data: sanitizedUser,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      error: { message: "Internal server error" },
    });
  }
};

// Get user by Role
export const getUserByRole = async (req, res) => {
  try {
    const { role } = req.query;
    const { includeTransactions = false } = req.query;

    const user = await userModel.findById(parseInt(id), {
      includeResident: true,
      includeOfficer: true,
      includeTransactions: includeTransactions === "true",
    });

    if (!user) {
      return res.status(404).json({
        error: { message: "User not found" },
      });
    }

    const sanitizedUser = userModel.sanitize(user);

    res.json({
      success: true,
      data: sanitizedUser,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      error: { message: "Internal server error" },
    });
  }
};

// Update user profile
export const updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: { message: "Validation failed", details: errors.array() },
      });
    }

    const { id } = req.params;
    const updates = req.body;

    const updatedUser = await userModel.updateProfile(parseInt(id), updates);

    const sanitizedUser = userModel.sanitize(updatedUser);

    res.json({
      success: true,
      data: sanitizedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);
    if (error.message === "User not found") {
      return res.status(404).json({
        error: { message: error.message },
      });
    }
    res.status(500).json({
      error: { message: "Internal server error" },
    });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    await userModel.softDelete(parseInt(id));

    res.json({
      success: true,
      data: { message: "User deleted successfully" },
    });
  } catch (error) {
    console.error("Delete user error:", error);
    if (
      error.message.includes("Cannot delete user with existing transactions")
    ) {
      return res.status(400).json({
        error: { message: error.message },
      });
    }
    res.status(500).json({
      error: { message: "Internal server error" },
    });
  }
};

// Change user password
export const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: { message: "Validation failed", details: errors.array() },
      });
    }

    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Check if user can change this password
    const requestedUserId = parseInt(id);
    const currentUserId = req.user.userId;
    const userRole = req.user.role;

    if (
      requestedUserId !== currentUserId &&
      !["officer", "admin"].includes(userRole)
    ) {
      return res.status(403).json({
        error: { message: "Access denied" },
      });
    }

    await userModel.changePassword(
      requestedUserId,
      currentPassword,
      newPassword
    );

    res.json({
      success: true,
      data: { message: "Password changed successfully" },
    });
  } catch (error) {
    console.error("Change password error:", error);
    if (error.message === "User not found") {
      return res.status(404).json({
        error: { message: error.message },
      });
    }
    if (error.message === "Current password is incorrect") {
      return res.status(400).json({
        error: { message: error.message },
      });
    }
    res.status(500).json({
      error: { message: "Internal server error" },
    });
  }
}