import * as userModel from "../models/userModel.js";

// create resident in system
export const createResident = async (req, res, next) => {
  try {
    console.log("BODY RECEIVED:", req.body);
    const { userName, password, dateOfBirth, batchNumber } = req.body;
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

// create officer in system
export const createOfficer = async (req, res, next) => {
  try {
    // inserted into mwh_user table
    const { userName } = req.body;
    const { hashedPassword } = res.locals;
    const userRole = "officer";

    // inserted into mwh_officer table
    const { officerEmail } = req.body;

    if (!userName || !hashedPassword || !officerEmail) {
      return res.status(400).json({
        message: "missing officer's username, hashedpassword or email",
      });
    }

    const data = [userName, hashedPassword, userRole, officerEmail];

    const userId = await userModel.insertOfficer(...data);

    res.locals.userId = userId;
    next();
  } catch (e) {
    console.error(e.message);
    return res.status(400).json({
      message: "An error has occurred in creating an officer",
    });
  }
};

// create developer in system
export const createDeveloper = async (req, res, next) => {
  try {
    const { userName } = req.body;
    const { hashedPassword } = res.locals;
    const userRole = "developer";

    if (!userName || !hashedPassword) {
      return res.status(400).json({
        message: "missing required fields",
      });
    }

    const userId = await userModel.insertDeveloper(
      userName,
      hashedPassword,
      userRole
    );

    res.locals.userId = userId;
    next();
  } catch (e) {
    console.error(e.message);
    return res.status(400).json({
      message: "An error has occurred in creating a developer",
    });
  }
};

// temporarily not in service
// export const checkUserExists = async (req, res, next) => {
//   try {
//     const { username } = req.body

//     if (!username) {
//       return res.status(404).json({
//         "message": "missing required fields"
//       })
//     }

//     const selectedUser = await userModel.selectUserByUsername(username)

//     if (selectedUser != null) {
//       return res.status(404).json({
//         "message": "User already exists"
//       })
//     }

//     next()

//   } catch (e) {
//     console.error(e.message)
//     return res.status(400).json({
//       "message": "An error has occurred"
//     })
//   }
// }

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
export const validateOfficerCredentials = async (req, res, next) => {
  try {
    const { officerEmail } = req.body;

    if (!officerEmail) {
      return res.status(400).json({
        message: "missing user id in validate officer credentials",
      });
    }

    const selectedOfficer = await userModel.selectOfficerByOfficerEmail(
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
      message: "An error has occurred while validating officer credentials",
    });
  }
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
