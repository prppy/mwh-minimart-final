// routes/categories.js
import express from 'express';
const categoryRouter = express.Router();
import * as categoryController from '../controllers/categoryController.js';

categoryRouter.get('/', categoryController.getAllCategories);
categoryRouter.post('/', categoryController.createCategory);
categoryRouter.put('/:id', categoryController.updateCategory);
categoryRouter.delete('/:id', categoryController.deleteCategory);

export default categoryRouter;