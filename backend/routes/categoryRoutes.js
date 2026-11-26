import { Router } from 'express';

import { createCategory, deleteCategory, getCategories } from '../controllers/categoryController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.route('/').get(getCategories).post(requireAdmin, createCategory);
router.route('/:categoryId').delete(requireAdmin, deleteCategory);

export default router;
