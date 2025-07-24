/*
checkUserExists removed temporarily until i figure out a better way to approach it :<

*/

import { Router } from "express";
const router = Router();
import * as authenticationController from "../controllers/authenticationController.js";
import * as argonMiddleware from "../middlewares/argonMiddleware.js";
import * as jwtMiddleware from "../middlewares/jwtMiddleware.js";

// register officer
// router.post("/register/officer", 
//     // authenticationController.checkUserExists, 
//     argonMiddleware.generateHashedPassword, 
//     authenticationController.createOfficer, 
//     jwtMiddleware.generateAccessToken, 
//     jwtMiddleware.generateRefreshToken, 
//     authenticationController.sendAuthResponse
// );

// register resident
router.post("/register/resident", 
    // authenticationController.checkUserExists, 
    argonMiddleware.generateHashedPassword, 
    authenticationController.createResident, 
    jwtMiddleware.generateAccessToken, 
    jwtMiddleware.generateRefreshToken, 
    authenticationController.sendAuthResponse
);

// register officer
router.post("/register/officer", 
    // authenticationController.checkUserExists, 
    argonMiddleware.generateHashedPassword, 
    authenticationController.createOfficer, 
    jwtMiddleware.generateAccessToken, 
    jwtMiddleware.generateRefreshToken, 
    authenticationController.sendAuthResponse
);

// register developer
router.post("/register/developer", 
    // authenticationController.checkUserExists, 
    argonMiddleware.generateHashedPassword, 
    authenticationController.createDeveloper, 
    jwtMiddleware.generateAccessToken, 
    jwtMiddleware.generateRefreshToken, 
    authenticationController.sendAuthResponse
);

// login resident
router.post("/login/resident", 
    authenticationController.validateResidentCredentials, 
    argonMiddleware.verifyHashedPassword, 
    jwtMiddleware.generateAccessToken, 
    jwtMiddleware.generateRefreshToken, 
    authenticationController.sendAuthResponse
);

// login officer
router.post("/login/officer", 
    authenticationController.validateOfficerCredentials, 
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