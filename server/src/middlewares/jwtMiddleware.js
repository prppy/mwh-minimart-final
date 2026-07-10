import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { prisma } from "../lib/db.js";

dotenv.config({ path: "../.env" });

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "1h";
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

export const generateAccessToken = async (req, res, next) => {
  try {
    const { userId } = res.locals;

    if (!userId) {
      return res.status(404).json({
        message: "User not found in request",
      });
    }

    // Retrieve user's role from res.locals or the database
    let role = null;
    if (res.locals.user) {
      role = res.locals.user.userRole;
    } else {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        select: { userRole: true }
      });
      if (user) {
        role = user.userRole;
      }
    }

    // create jwt
    const accessToken = jwt.sign({ userId, role }, ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });

    res.locals.accessToken = accessToken;
    next();
  } catch (e) {
    console.error(e.message);
    return res.status(400).json({
      message: "An error has occurred in generating an access token",
    });
  }
};

export const generateRefreshToken = async (req, res, next) => {
  try {
    const { userId } = res.locals;

    if (!userId) {
      return res.status(404).json({
        message: "User not found in request",
      });
    }

    const refreshToken = jwt.sign({ userId }, REFRESH_TOKEN_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    });

    res.locals.refreshToken = refreshToken;
    next();
  } catch (e) {
    console.error(e.message);
    return res.status(400).json({
      message: "An error has occurred while generating a refresh token ",
    });
  }
};

export const verifyAccessToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(403).json({ message: "Access token missing" });
    }

    const accessToken = authHeader.split(" ")[1];

    const accessTokenPayload = jwt.verify(accessToken, ACCESS_TOKEN_SECRET);
    
    // Support casing variations of the payload properties
    const userId = accessTokenPayload.userId || accessTokenPayload.User_ID;
    const role = accessTokenPayload.role || accessTokenPayload.userRole;

    res.locals.userId = userId;
    res.locals.User_ID = userId;

    req.user = {
      userId,
      role
    };

    next();
  } catch (e) {
    if (e.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Access token expired",
      });
    }

    if (e.name === "JsonWebTokenError") {
      return res.status(403).json({
        message: "Invalid access token",
      });
    }

    console.error(e.message);
    return res.status(400).json({
      message: "An error has occurred while verifying access token",
    });
  }
};

export const verifyRefreshToken = async (req, res, next) => {
  try {
    // Accept the refresh token from an httpOnly cookie or the request body
    // (the mobile/web client sends it in the body; no cookie parser is mounted).
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      return res.status(403).json({ message: "Refresh token missing" });
    }

    const refreshTokenPayload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    
    // Support casing variations of the payload properties
    const userId = refreshTokenPayload.userId || refreshTokenPayload.User_ID;

    res.locals.userId = userId;
    res.locals.User_ID = userId;

    next();
  } catch (e) {
    console.error(e.message);

    if (e.name === "TokenExpiredError") {
      return res.status(403).json({ message: "Refresh token expired" });
    }

    if (e.name === "JsonWebTokenError") {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    return res.status(400).json({ message: "An unknown error occurred" });
  }
};

/**
 * Like verifyAccessToken, but does not reject unauthenticated requests.
 * Populates req.user when a valid Bearer token is present so controllers
 * can vary their response by role on endpoints that are partially public.
 */
export const optionalAccessToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const payload = jwt.verify(authHeader.split(" ")[1], ACCESS_TOKEN_SECRET);
      const userId = payload.userId || payload.User_ID;
      const role = payload.role || payload.userRole;

      res.locals.userId = userId;
      res.locals.User_ID = userId;
      req.user = { userId, role };
    } catch {
      // Invalid/expired token on an optional route: treat as unauthenticated.
    }
  }

  next();
};

/**
 * Role guard — must run after verifyAccessToken.
 * Usage: router.post("/", verifyAccessToken, requireRole("admin", "superadmin"), handler)
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: "Access token missing" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied: insufficient permissions",
      });
    }

    next();
  };
};

export const handleAccessToken = async (req, res) => {
  try {
    const { accessToken } = res.locals;

    if (!accessToken) {
      return res.status(404).json({
        message: "missing access token",
      });
    }

    res.status(200).json({
      message: "New access token generated",
      accessToken: accessToken,
    });
  } catch (e) {
    console.error(e.message);
    return res.status(400).json({
      message: "An error has occurred while handling access token",
    });
  }
};

