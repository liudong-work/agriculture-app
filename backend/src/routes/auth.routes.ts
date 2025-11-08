import { Router } from 'express';

import { login, loginValidators, register, registerValidators } from '../controllers/auth.controller';

const router = Router();

router.post('/register', registerValidators, register);
router.post('/login', loginValidators, login);

export const authRouter = router;

