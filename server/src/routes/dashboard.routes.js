import {Router} from 'express';import {summary} from '../controllers/dashboard.controller.js';import {authenticate} from '../middlewares/auth.middleware.js';import {asyncHandler} from '../utils/async-handler.js';
const router=Router();router.get('/',authenticate,asyncHandler(summary));export default router;
