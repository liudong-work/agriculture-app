import { Router } from 'express';

import { authenticate } from '../middleware/auth';
import { createUploadCredential, presignUploadValidators, uploadBase64ToOss, uploadBase64Validators } from '../controllers/upload.controller';

const router = Router();

router.use(authenticate);
router.post('/presign', presignUploadValidators, createUploadCredential);
router.post('/oss', uploadBase64Validators, uploadBase64ToOss);

export const uploadRouter = router;
