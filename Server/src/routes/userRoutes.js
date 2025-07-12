// routes/users.js
const userRouter = express.Router();
import { getAllUsers, getUserById, updateUser, deleteUser } from '../controllers/usersController';

userRouter.get('/', authenticateToken, requireOfficerOrAdmin, getAllUsers);
userRouter.get('/:id', authenticateToken, requireOwnershipOrStaff, getUserById);
userRouter.put('/:id', authenticateToken, requireOwnershipOrStaff, updateUser);
userRouter.delete('/:id', authenticateToken, requireOfficerOrAdmin, deleteUser);