// routes/UserRoutes.js
import express from 'express';
const userRouter = express.Router();
import UserController from '../controllers/userController.js';

userRouter.get('/', UserController.getAllUsers);
userRouter.get('/:id', UserController.getUserById);
userRouter.put('/:id', UserController.updateUser);
userRouter.delete('/:id', UserController.deleteUser);

export default userRouter;