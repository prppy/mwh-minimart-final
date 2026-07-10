import { validationResult } from "express-validator";
import * as userModel from "../models/userModel.js";

const isStaff = (user) => !!user && ["admin", "superadmin"].includes(user.role);

// Unauthenticated callers (the kiosk login picker) only ever need the
// resident list with enough data to render a name + avatar. The picker cards
// are colour-coded per resident, so the cosmetic wallpaper fields are
// included; everything else (points, DOB, serial number, remarks) stays out.
const toPublicUser = (user) => ({
  id: user.id,
  userName: user.userName,
  userRole: user.userRole,
  profilePicture: user.profilePicture ?? null,
  resident: user.resident
    ? {
        wallpaperType: user.resident.wallpaperType,
        backgroundType: user.resident.backgroundType,
      }
    : null,
});

// Get all users with filtering
export const getAllUsers = async (req, res) => {
  try {
    const { role, batchNumber, limit, offset, search, sortBy, sortOrder } =
      req.query;

    const staffCaller = isStaff(req.user);

    const result = await userModel.findMany({
      // Non-staff callers may only list residents
      role: staffCaller ? role : "resident",
      batchNumber,
      limit,
      offset,
      search,
      sortBy,
      sortOrder,
    });

    // Sanitize user data
    const sanitizedUsers = result.users.map((user) =>
      staffCaller ? userModel.sanitize(user) : toPublicUser(user)
    );

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

// Get users by role
export const readUsersByRole = async (req, res) => {
  try {
    const { role } = req.query;
    const { includeProfilePicture = "true" } = req.query; // Allow excluding profile pictures for performance

    if (role !== "superadmin" && role !== "resident" && role !== "admin") {
      return res.status(400).json({
        message: "Please use a valid user role",
      });
    }

    const staffCaller = isStaff(req.user);
    if (!staffCaller && role !== "resident") {
      return res.status(403).json({
        error: { message: "Access denied" },
      });
    }

    const result = await userModel.findMany({
      role,
      includeProfilePicture: includeProfilePicture === "true",
    });
    const sanitizedUsers = result.users.map((user) =>
      staffCaller ? userModel.sanitize(user) : toPublicUser(user)
    );

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

    // Residents may only read their own profile
    if (!isStaff(req.user) && parseInt(id) !== parseInt(req.user.userId)) {
      return res.status(403).json({
        error: { message: "Access denied" },
      });
    }

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
    let updates = req.body;

    const currentUserRole = req.user.role;

    // Retrieve target user profile to verify their role
    const targetUser = await userModel.findById(parseInt(id));
    if (!targetUser) {
      return res.status(404).json({
        error: { message: "User not found" },
      });
    }

    // Residents may only edit their own profile, and only cosmetic fields.
    if (currentUserRole === "resident") {
      if (parseInt(id) !== parseInt(req.user.userId)) {
        return res.status(403).json({
          error: { message: "Access denied: you can only edit your own profile." },
        });
      }
      updates = {
        ...(updates.profilePicture !== undefined && {
          profilePicture: updates.profilePicture,
        }),
        ...(updates.resident && {
          resident: {
            ...(updates.resident.wallpaperType && {
              wallpaperType: updates.resident.wallpaperType,
            }),
            ...(updates.resident.backgroundType && {
              backgroundType: updates.resident.backgroundType,
            }),
          },
        }),
      };
    }

    // Role-based editing restrictions:
    // 1. Super Admin can edit anyone and change roles.
    // 2. Admins have read-only access to profiles — they cannot edit anyone.
    // 3. Residents may edit only their own cosmetic fields (filtered above).
    if (currentUserRole === "admin") {
      return res.status(403).json({
        error: { message: "Access denied: Only Super Admins can change user profiles." },
      });
    }
    if (currentUserRole !== "superadmin") {
      if (updates.userRole && updates.userRole !== targetUser.userRole) {
        return res.status(403).json({
          error: { message: "Access denied: Only Super Admins can assign user roles." },
        });
      }
    }

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

    const currentUserRole = req.user.role;

    // Strict check: Only Super Admin can delete/remove users!
    if (currentUserRole !== "superadmin") {
      return res.status(403).json({
        error: { message: "Access denied: Only Super Admins can delete/remove users." },
      });
    }

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
      !["admin", "superadmin"].includes(userRole)
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
};

// Get user statistics
const getUserStatistics = async (req, res) => {
  try {
    const statistics = await userModel.getStatistics();

    res.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    console.error("Get user statistics error:", error);
    res.status(500).json({
      error: { message: "Internal server error" },
    });
  }
};

// Get current user profile
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await userModel.findById(userId, {
      includeResident: true,
      includeOfficer: true,
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
    console.error("Get current user error:", error);
    res.status(500).json({
      error: { message: "Internal server error" },
    });
  }
};

// Update current user profile
const updateCurrentUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: { message: "Validation failed", details: errors.array() },
      });
    }

    const userId = req.user.userId;
    const updates = req.body;

    // Remove sensitive fields that users shouldn't be able to update themselves
    delete updates.userRole;
    delete updates.passwordHash;
    delete updates.biometricHash;

    const updatedUser = await userModel.updateProfile(userId, updates);

    const sanitizedUser = userModel.sanitize(updatedUser);

    res.json({
      success: true,
      data: sanitizedUser,
    });
  } catch (error) {
    console.error("Update current user error:", error);
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

// Upload profile picture
const uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({
        error: { message: "No file uploaded" },
      });
    }

    // Update user with profile picture
    const updatedUser = await userModel.updateProfile(userId, {
      profilePicture: req.file.buffer,
    });

    const sanitizedUser = userModel.sanitize(updatedUser);

    res.json({
      success: true,
      data: sanitizedUser,
    });
  } catch (error) {
    console.error("Upload profile picture error:", error);
    res.status(500).json({
      error: { message: "Internal server error" },
    });
  }
};

// Search users
const searchUsers = async (req, res) => {
  try {
    const { q: search, role, limit = 20 } = req.query;

    if (!search) {
      return res.status(400).json({
        error: { message: "Search query is required" },
      });
    }

    const result = await userModel.findMany({
      search,
      role,
      limit,
      offset: 0,
    });

    const sanitizedUsers = result.users.map((user) => userModel.sanitize(user));

    res.json({
      success: true,
      data: sanitizedUsers,
    });
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({
      error: { message: "Internal server error" },
    });
  }
};
