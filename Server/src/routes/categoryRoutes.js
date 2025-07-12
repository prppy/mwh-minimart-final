// routes/categories.js
const categoryRouter = express.Router();
const CategoriesController = require('../controllers/categoriesController');

categoryRouter.get('/', CategoriesController.getAllCategories);
categoryRouter.post('/', authenticateToken, requireOfficerOrAdmin, CategoriesController.createCategory);
categoryRouter.put('/:id', authenticateToken, requireOfficerOrAdmin, CategoriesController.updateCategory);
categoryRouter.delete('/:id', authenticateToken, requireOfficerOrAdmin, CategoriesController.deleteCategory);