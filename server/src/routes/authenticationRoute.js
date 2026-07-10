import { Router } from "express";
import rateLimit from "express-rate-limit";
const router = Router();
import * as authenticationController from "../controllers/authenticationController.js";
import * as argonMiddleware from "../middlewares/argonMiddleware.js";
import * as jwtMiddleware from "../middlewares/jwtMiddleware.js";

// Stricter rate limit for credential-guessing surfaces (login only)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: {
        error: {
            message: "Too many login attempts, please try again later.",
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// register resident (superadmin only — admins cannot change resident profiles)
router.post("/register/resident",
    jwtMiddleware.verifyAccessToken,
    jwtMiddleware.requireRole("superadmin"),
    argonMiddleware.generateHashedPassword,
    authenticationController.createResident,
    authenticationController.sendRegistrationResponse
);

// register admin/staff (superadmin only)
router.post("/register/admin",
    jwtMiddleware.verifyAccessToken,
    jwtMiddleware.requireRole("superadmin"),
    argonMiddleware.generateHashedPassword,
    authenticationController.createAdmin,
    authenticationController.sendRegistrationResponse
);

// login resident
router.post("/login/resident",
    loginLimiter,
    authenticationController.validateResidentCredentials,
    argonMiddleware.verifyHashedPassword,
    jwtMiddleware.generateAccessToken,
    jwtMiddleware.generateRefreshToken,
    authenticationController.sendAuthResponse
);

// login admin/staff
router.post("/login/admin",
    loginLimiter,
    authenticationController.validateAdminCredentials,
    argonMiddleware.verifyHashedPassword,
    jwtMiddleware.generateAccessToken,
    jwtMiddleware.generateRefreshToken,
    authenticationController.sendAuthResponse
);

// generate new access token
router.post("/refresh",
    jwtMiddleware.verifyRefreshToken,
    jwtMiddleware.generateAccessToken,
    jwtMiddleware.handleAccessToken
);

export default router;
