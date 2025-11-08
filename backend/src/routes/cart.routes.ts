import { Router } from 'express';

import {
  addToCart,
  addValidators,
  getCart,
  removeCartItem,
  selectAllValidators,
  setSelectAll,
  updateCartItem,
  updateValidators,
} from '../controllers/cart.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getCart);
router.post('/', addValidators, addToCart);
router.patch('/:id', updateValidators, updateCartItem);
router.delete('/:id', removeCartItem);
router.post('/select-all', selectAllValidators, setSelectAll);

export const cartRouter = router;

