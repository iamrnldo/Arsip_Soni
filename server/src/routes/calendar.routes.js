import {Router} from 'express';import {listEvents} from '../controllers/calendar.controller.js';import {authenticate} from '../middlewares/auth.middleware.js';import {asyncHandler} from '../utils/async-handler.js';
const router=Router();router.get('/events',authenticate,asyncHandler(listEvents));export default router;
