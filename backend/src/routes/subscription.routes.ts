import { Router } from 'express';

import { authenticate } from '../middleware/auth';
import {
  createSubscriptionPlan,
  createPlanValidators,
  createUserSubscription,
  createSubscriptionValidators,
  getSubscriptionPlan,
  getPlanValidators,
  listSubscriptionPlans,
  listUserSubscriptions,
  updateSubscriptionPlan,
  updatePlanValidators,
  updateUserSubscriptionStatus,
  updateSubscriptionStatusValidators,
  listFarmerSubscriptionPlans,
} from '../controllers/subscription.controller';

const router = Router();

router.get('/plans', listSubscriptionPlans);
router.get('/plans/mine', authenticate, listFarmerSubscriptionPlans);
router.get('/plans/:id', getPlanValidators, getSubscriptionPlan);

router.use(authenticate);
router.post('/plans', createPlanValidators, createSubscriptionPlan);
router.patch('/plans/:id', updatePlanValidators, updateSubscriptionPlan);
router.get('/', listUserSubscriptions);
router.post('/', createSubscriptionValidators, createUserSubscription);
router.patch('/:id/status', updateSubscriptionStatusValidators, updateUserSubscriptionStatus);

export const subscriptionRouter = router;
