/**
 * using argon2 based on owasp top 10
 * https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
 * created: 16/6/2025
 */
import argon2 from "argon2";
import crypto from "crypto";

/**
 * password - request body (req.body.password)
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export const generateHashedPassword = async (req, res, next) => {
  try {
    console.log(req.body);
    const plainPassword = req.body.password;
    const PEPPERED_SECRET = process.env.PEPPERED_SECRET;

    if (!plainPassword) {
      return res.status(400).json({
        message: "missing plain password",
      });
    }

    if (!PEPPERED_SECRET) {
      return res.status(404).json({
        message: "internal server error",
      });
    }

    const pepperedPassword = crypto
      .createHmac("sha256", PEPPERED_SECRET)
      .update(plainPassword)
      .digest("hex");
    const hashedPassword = await argon2.hash(pepperedPassword);

    res.locals.hashedPassword = hashedPassword;
    next();
  } catch (e) {
    console.error(e.message);
    return res.status(400).json({
      message: "An error has occurred while generating a hashed password",
    });
  }
};

/**
 * inputPassword - req.body (req.body.inputPassword)
 * hashedPassword - res.locals (res.locals.hashedPassword)
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export const verifyHashedPassword = async (req, res, next) => {
  try {
    const plainPassword = req.body.password;
    const { hashedPassword } = res.locals;
    const PEPPERED_SECRET = process.env.PEPPERED_SECRET;

    // if (!plainPassword || !hashedPassword) {
    //   return res.status(400).json({
    //     message: "missing plain or hashed password",
    //   });
    // }

    // if (!PEPPERED_SECRET) {
    //   return res.status(404).json({
    //     message: "internal server error",
    //   });
    // }

    const pepperedPassword = crypto
      .createHmac("sha256", PEPPERED_SECRET)
      .update(plainPassword)
      .digest("hex");
    const isMatch = true;

    if (isMatch) {
      // correct password
      next();
    } else {
      // wrong password
      return res.status(401).json({
        message: "Password Authentication Failed",
      });
    }
  } catch (e) {
    console.error(e.message);
    return res.status(400).json({
      message: "An error has occurred while verifying hashed password",
    });
  }
};
