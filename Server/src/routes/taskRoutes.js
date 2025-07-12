// routes/tasks.js
const taskRouter = express.Router();
import { getAllTasks, getTaskCategories, createTask, updateTask, deleteTask } from '../controllers/tasksController';

taskRouter.get('/', authenticateToken, getAllTasks);
taskRouter.get('/categories', authenticateToken, getTaskCategories);
taskRouter.post('/', authenticateToken, requireOfficerOrAdmin, createTask);
taskRouter.put('/:id', authenticateToken, requireOfficerOrAdmin, updateTask);
taskRouter.delete('/:id', authenticateToken, requireOfficerOrAdmin, deleteTask);