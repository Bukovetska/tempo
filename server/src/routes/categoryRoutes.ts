import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getCategories, createCategory, deleteCategory } from '../controllers/categoryController';

const router = Router();

router.use(authMiddleware);

router.get('/',       getCategories);
router.post('/',      createCategory);
router.delete('/:id', deleteCategory);

export default router;