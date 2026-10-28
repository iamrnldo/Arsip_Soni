import {Router} from 'express';import {login,me} from '../controllers/auth.controller.js';import {authenticate} from '../middlewares/auth.middleware.js';import {asyncHandler} from '../utils/async-handler.js';
const router=Router();router.post('/login',asyncHandler(login));router.get('/me',authenticate,asyncHandler(me));export default router;
