import { Router } from 'express';
import {
  createProduct,
  createProductValidators,
  detailValidators,
  getProductDetail,
  listProducts,
  listValidators,
  updateProduct,
  updateProductStatus,
  updateProductStatusValidators,
  updateProductValidators,
} from '../controllers/product.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', listValidators, listProducts);
router.get('/:id', detailValidators, getProductDetail);
router.post('/', authenticate, createProductValidators, createProduct);
router.put('/:id', authenticate, updateProductValidators, updateProduct);
router.patch('/:id/status', authenticate, updateProductStatusValidators, updateProductStatus);

export const productRouter = router;

