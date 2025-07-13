// routes/categories.js
const categoryRouter = express.Router();
import { getAllCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoriesController';

categoryRouter.get('/', getAllCategories);
categoryRouter.post('/', authenticateToken, requireOfficerOrAdmin, createCategory);
categoryRouter.put('/:id', authenticateToken, requireOfficerOrAdmin, updateCategory);
categoryRouter.delete('/:id', authenticateToken, requireOfficerOrAdmin, deleteCategory);