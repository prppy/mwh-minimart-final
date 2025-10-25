import * as userModel from "../models/userModel.js";

// create resident in system
export const createResident = async (req, res, next) => {
  try {
    // inserted into mwh_user table
    const { userName } = req.body
    const { hashedPassword } = res.locals
    const userRole = "resident"

    // inserted into mwh_resident table
    const { dateOfBirth, dateOfAdmission, lastAbscondence } = req.body

    if (!userName || !hashedPassword || !dateOfBirth || !dateOfAdmission) {
      return res.status(400).json({
        "message": "missing required fields"
      })
    }

    const data = [
      userName, 
      hashedPassword, 
      userRole, 
      new Date(dateOfBirth), 
      new Date(dateOfAdmission), 
      lastAbscondence === null ? null : new Date(lastAbscondence)
    ]

    const userId = await userModel.insertResident(
      ...data
    )

    res.locals.userId = userId
    next()

  } catch (e) {
    console.error(e.message)
    return res.status(400).json({
      "message": "An error has occurred"
    })
  }
}

// create officer in system
export const createOfficer = async (req, res, next) => {
  try {
    // inserted into mwh_user table
    const { userName } = req.body
    const { hashedPassword } = res.locals
    const userRole = "officer"

    // inserted into mwh_officer table
    const { officerEmail } = req.body

    if (!userName || !hashedPassword || !officerEmail) {
      return res.status(400).json({
        "message": "missing required fields"
      })
    }

    const data = [
      userName, 
      hashedPassword, 
      userRole, 
      officerEmail
    ]

    const userId = await userModel.insertOfficer(
      ...data
    )

    res.locals.userId = userId
    next()

  } catch (e) {
    console.error(e.message)
    return res.status(400).json({
      "message": "An error has occurred"
    })
  }
}

// create developer in system
export const createDeveloper = async (req, res, next) => {
  try {
    const { userName } = req.body
    const { hashedPassword } = res.locals
    const userRole = "developer"

    if (!userName || !hashedPassword) {
      return res.status(400).json({
        "message": "missing required fields"
      })
    }

    const userId = await userModel.insertDeveloper(userName, hashedPassword, userRole)

    res.locals.userId = userId
    next()

  } catch (e) {
    console.error(e.message)
    return res.status(400).json({
      "message": "An error has occurred"
    })
  }
}

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
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({
        "message": "missing required fields"
      })
    }

    const selectedUser = await userModel.selectUserByUserId(userId)

    if (selectedUser == null) {
      return res.status(400).json({
        "message": "User doesn't exist or wrong password"
      })
    }

    res.locals.userId = selectedUser.id
    res.locals.hashedPassword = selectedUser.passwordHash

    next()

  } catch (e) {
    console.error(e.message)
    return res.status(400).json({
      "message": "An error has occurred"
    })
  }
}

/**
 * queries for officer information, passing it into res.locals
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
export const validateOfficerCredentials = async (req, res, next) => {
  try {
    const { officerEmail } = req.body

    if (!officerEmail) {
      return res.status(400).json({
        "message": "missing required fields"
      })
    }

    const selectedOfficer = await userModel.selectOfficerByOfficerEmail(officerEmail)

    if (selectedOfficer == null) {
      return res.status(400).json({
        "message": "Wrong email or password"
      })
    }

    res.locals.userId = selectedOfficer.user.id
    res.locals.hashedPassword = selectedOfficer.user.passwordHash

    next()

  } catch (e) {
    console.error(e.message)
    return res.status(400).json({
      "message": "An error has occurred"
    })
  }
}

export const sendAuthResponse = async (req, res) => {
  try {
    const { accessToken, refreshToken } = res.locals

    if (!accessToken || !refreshToken) {
      return res.status(403).json({
        "message": "illegal entry"
      })
    }

    return res.status(200).json({
      "message": "User can now access system",
      "accessToken": accessToken,
      "refreshToken": refreshToken,
    })

  } catch (e) {
    console.error(e.message)
    return res.status(400).json({
      "message": "An error has occurred"
    })
  }
}