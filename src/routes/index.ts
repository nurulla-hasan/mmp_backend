import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes';
import { serviceRouter } from '../modules/service/service.routes';
import { surveyorServiceRouter } from '../modules/surveyor-service/surveyor-service.routes';
import { surveyorProfileRouter } from '../modules/surveyor-profile/surveyor-profile.routes';

export const apiRouter = Router();
apiRouter.use('/auth', authRouter);
apiRouter.use('/services', serviceRouter);
apiRouter.use('/surveyor/services', surveyorServiceRouter);
apiRouter.use('/surveyor', surveyorProfileRouter);
