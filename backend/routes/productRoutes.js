import { Router } from 'express';

import { createProduct, deleteProduct, getProductById, getProducts, updateProductStock } from '../controllers/productController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.route('/').get(getProducts).post(requireAdmin, createProduct);
router.route('/:productId').get(getProductById).delete(requireAdmin, deleteProduct);
router.route('/:productId/stock').patch(requireAdmin, updateProductStock);

export default router;
