import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes';
import { serviceRouter } from '../modules/service/service.routes';
import { districtRouter } from '../modules/district/district.routes';
import { surveyorServiceRouter } from '../modules/surveyor-service/surveyor-service.routes';
import { surveyorProfileRouter } from '../modules/surveyor-profile/surveyor-profile.routes';
import { calculationRouter } from '../modules/calculation/calculation.routes';

export const apiRouter = Router();
apiRouter.use('/auth', authRouter);
apiRouter.use('/services', serviceRouter);
apiRouter.use('/districts', districtRouter);
apiRouter.use('/surveyor/services', surveyorServiceRouter);
apiRouter.use('/surveyor', surveyorProfileRouter);
apiRouter.use('/calculations', calculationRouter);
