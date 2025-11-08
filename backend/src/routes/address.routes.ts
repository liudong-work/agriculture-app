import { Router } from 'express';

import {
  createAddress,
  createAddressValidators,
  deleteAddress,
  deleteAddressValidators,
  listAddresses,
  updateAddress,
  updateAddressValidators,
} from '../controllers/address.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', listAddresses);
router.post('/', createAddressValidators, createAddress);
router.put('/:id', updateAddressValidators, updateAddress);
router.delete('/:id', deleteAddressValidators, deleteAddress);

export const addressRouter = router;


