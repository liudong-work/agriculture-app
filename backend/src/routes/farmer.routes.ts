import { Router } from 'express';

import { authenticate } from '../middleware/auth';
import {
  createFarmerStoryEntry,
  createFarmerStoryValidators,
  getFarmerStory,
  getFarmerStoryValidators,
  listFarmerStoryEntries,
  updateFarmerStory,
  updateFarmerStoryValidators,
} from '../controllers/farmer.controller';

const router = Router();

router.get('/:id/story', getFarmerStoryValidators, getFarmerStory);
router.get('/:id/stories', getFarmerStoryValidators, listFarmerStoryEntries);

router.use(authenticate);
router.put('/:id/story', updateFarmerStoryValidators, updateFarmerStory);
router.post('/:id/stories', createFarmerStoryValidators, createFarmerStoryEntry);

export const farmerRouter = router;
