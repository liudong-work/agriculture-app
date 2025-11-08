import { Router } from 'express';

import {
  createOrder,
  createOrderValidators,
  appendCheckpointValidators,
  appendLogisticsCheckpoint,
  applyAfterSale,
  applyAfterSaleValidators,
  cancelOrder,
  cancelOrderValidators,
  detailOrderValidators,
  getOrderDetail,
  listOrderValidators,
  listOrders,
  setLogistics,
  setLogisticsValidators,
  updateOrderStatus,
  updateStatusValidators,
  updateAfterSale,
  updateAfterSaleValidators,
} from '../controllers/order.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', listOrderValidators, listOrders);
router.post('/', createOrderValidators, createOrder);
router.get('/:id', detailOrderValidators, getOrderDetail);
router.patch('/:id/status', updateStatusValidators, updateOrderStatus);
router.put('/:id/logistics', setLogisticsValidators, setLogistics);
router.post('/:id/logistics/checkpoints', appendCheckpointValidators, appendLogisticsCheckpoint);
router.post('/:id/cancel', cancelOrderValidators, cancelOrder);
router.post('/:id/after-sale', applyAfterSaleValidators, applyAfterSale);
router.patch('/:id/after-sale', updateAfterSaleValidators, updateAfterSale);

export const orderRouter = router;


