import { Router } from 'express';

import { authenticate } from '../middleware/auth';
import {
  appendFarmerCheckpointValidators,
  appendFarmerLogisticsCheckpoint,
  getFarmerOrderDetail,
  getFarmerOrderDetailValidators,
  listFarmerOrders,
  listFarmerOrdersValidators,
  setFarmerLogistics,
  setFarmerLogisticsValidators,
  updateFarmerAfterSale,
  updateFarmerAfterSaleValidators,
  updateFarmerOrderStatus,
  updateFarmerOrderStatusValidators,
} from '../controllers/farmer-order.controller';

const router = Router();

router.use(authenticate);

router.get('/', listFarmerOrdersValidators, listFarmerOrders);
router.get('/:id', getFarmerOrderDetailValidators, getFarmerOrderDetail);
router.patch('/:id/status', updateFarmerOrderStatusValidators, updateFarmerOrderStatus);
router.put('/:id/logistics', setFarmerLogisticsValidators, setFarmerLogistics);
router.post('/:id/logistics/checkpoints', appendFarmerCheckpointValidators, appendFarmerLogisticsCheckpoint);
router.patch('/:id/after-sale', updateFarmerAfterSaleValidators, updateFarmerAfterSale);

export const farmerOrderRouter = router;
