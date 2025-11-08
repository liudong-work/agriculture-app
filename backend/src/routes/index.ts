import type { Express, Request, Response } from 'express';

import { authRouter } from './auth.routes';
import { productRouter } from './product.routes';
import { userRouter } from './user.routes';
import { cartRouter } from './cart.routes';
import { addressRouter } from './address.routes';
import { orderRouter } from './order.routes';
import { uploadRouter } from './upload.routes';
import { farmerOrderRouter } from './farmer-order.routes';

export function registerRoutes(app: Express) {
  app.get('/health', (req: Request, res: Response) => {
    res.json({ success: true, message: 'API is running' });
  });

  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/products', productRouter);
  app.use('/api/v1/users', userRouter);
  app.use('/api/v1/cart', cartRouter);
  app.use('/api/v1/orders', orderRouter);
  app.use('/api/v1/farmer/orders', farmerOrderRouter);
  app.use('/api/v1/addresses', addressRouter);
  app.use('/api/v1/uploads', uploadRouter);

  app.use((req: Request, res: Response) => {
    res.status(404).json({ success: false, message: '接口不存在' });
  });
}

