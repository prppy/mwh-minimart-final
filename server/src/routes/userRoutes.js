import express from "express";
const userRouter = express.Router();
import * as userController from "../controllers/userController.js";

userRouter.get('/', userController.getAllUsers);
userRouter.get('/role', userController.readUsersByRole);
userRouter.get('/me', userController.getCurrentUser); // Must be before /:id to avoid matching "me" as an ID
userRouter.get('/:id', userController.getUserById);
userRouter.put('/:id', userController.updateUser);
userRouter.delete('/:id', userController.deleteUser);


export default userRouter;
