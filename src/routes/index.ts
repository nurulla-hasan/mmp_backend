import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes';
import { serviceRouter } from '../modules/service/service.routes';

export const apiRouter = Router();
apiRouter.use('/auth', authRouter);
apiRouter.use('/services', serviceRouter);
