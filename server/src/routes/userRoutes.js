import express from "express";
const userRouter = express.Router();
import * as userController from "../controllers/userController.js";
import { verifyAccessToken, optionalAccessToken, requireRole } from "../middlewares/jwtMiddleware.js";

// Listing is partially public: the kiosk login screen needs the resident list
// before any user is authenticated. The controller strips results down to
// id/userName/profilePicture for unauthenticated or non-staff callers.
userRouter.get('/', optionalAccessToken, userController.getAllUsers);
userRouter.get('/role', optionalAccessToken, userController.readUsersByRole);

// Authenticated: residents may only read/update their own profile (enforced
// in the controller); only superadmins can change other users' profiles —
// regular admins have read-only access.
userRouter.get('/:id', verifyAccessToken, userController.getUserById);
userRouter.put('/:id', verifyAccessToken, userController.updateUser);
userRouter.delete('/:id', verifyAccessToken, requireRole('superadmin'), userController.deleteUser);


export default userRouter;
