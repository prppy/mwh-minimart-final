import * as userModel from "../models/userModel.js";

// create resident in system
export const createResident = async (req, res, next) => {
  try {
    const { userName, password, dateOfBirth, batchNumber, serialNumber, dateOfAdmission, isActive, remarks } = req.body;
    if (!userName || !password) {
      return res
        .status(400)
        .json({ message: "missing required fields in create resident" });
    }

    const user = await userModel.create({
      userName,
      passwordHash: res.locals.hashedPassword, // replace with hashedPassword saved locally
      userRole: "resident",
      dateOfBirth,
      batchNumber,
      serialNumber,
      dateOfAdmission,
      isActive: isActive !== undefined ? isActive : true,
      remarks: remarks || null,
      currentPoints: 0,
      totalPoints: 0,
    });

    res.locals.userId = user.id;
    next();
  } catch (e) {
    console.error(e.message);
    return res.status(400).json({ message: "An error has occurred" });
  }
};

// create admin/staff in system
export const createAdmin = async (req, res, next) => {
  try {
    const { userName, userRole = "admin", officerEmail } = req.body;
    const { hashedPassword } = res.locals;

    if (!userName || !hashedPassword || !officerEmail) {
      return res.status(400).json({
        message: "missing admin's username, hashedpassword or email",
      });
    }

    if (!["admin", "superadmin"].includes(userRole)) {
      return res.status(400).json({
        message: "userRole must be admin or superadmin",
      });
    }

    const data = [userName, hashedPassword, userRole, officerEmail];

    const userId = await userModel.insertAdmin(...data);

    res.locals.userId = userId;
    next();
  } catch (e) {
    console.error(e.message);
    return res.status(400).json({
      message: "An error has occurred in creating an admin",
    });
  }
};


/**
 * queries for resident information, passing it into res.locals
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns
 */
export const validateResidentCredentials = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "missing user id in validate resident credentials",
      });
    }

    const selectedUser = await userModel.selectUserByUserId(userId);

    if (selectedUser == null) {
      return res.status(400).json({
        message: "User doesn't exist or wrong password",
      });
    }

    res.locals.userId = selectedUser.id;
    res.locals.hashedPassword = selectedUser.passwordHash;
    res.locals.user = selectedUser;

    next();
  } catch (e) {
    console.error(e.message);
    return res.status(400).json({
      message: "An error has occurred in validating resident credentials",
    });
  }
};

/**
 * queries for officer information, passing it into res.locals
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns
 */
// validate credentials for admin/superadmin login
export const validateAdminCredentials = async (req, res, next) => {
  try {
    const { officerEmail } = req.body;

    if (!officerEmail) {
      return res.status(400).json({
        message: "missing user email in validate credentials",
      });
    }

    const selectedOfficer = await userModel.selectAdminByAdminEmail(
      officerEmail
    );

    if (selectedOfficer == null) {
      return res.status(400).json({
        message: "Wrong email or password",
      });
    }

    res.locals.userId = selectedOfficer.user.id;
    res.locals.hashedPassword = selectedOfficer.user.passwordHash;
    res.locals.user = {
      id: selectedOfficer.user.id,
      userName: selectedOfficer.user.userName,
      userRole: selectedOfficer.user.userRole,
      profilePicture: selectedOfficer.user.profilePicture || null,
    };

    next();
  } catch (e) {
    console.error(e.message);
    return res.status(400).json({
      message: "An error has occurred while validating credentials",
    });
  }
};


/**
 * Terminal handler for the register pipelines. Unlike login, registration is
 * performed by a staff member on behalf of the new user, so no tokens are
 * issued — just confirm creation.
 */
export const sendRegistrationResponse = async (req, res) => {
  const { userId } = res.locals;

  return res.status(201).json({
    message: "User created successfully",
    data: { userId },
  });
};

export const sendAuthResponse = async (req, res) => {
  try {
    const { accessToken, refreshToken, user } = res.locals;

    if (!accessToken || !refreshToken) {
      return res.status(403).json({
        message: "illegal entry",
      });
    }

    if (user) {
      return res.status(200).json({
        message: "User can now access system",
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          userName: user.userName,
          profilePicture: user.profilePicture || null,
          userRole: user.userRole,
        },
      });
    }

    return res.status(200).json({
      message: "User can now access system",
      accessToken,
      refreshToken,
    });
  } catch (e) {
    console.error(e.message);
    return res.status(400).json({
      message: "An error has occurred while sending an auth response",
    });
  }
};
