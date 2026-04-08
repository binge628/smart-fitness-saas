import express from 'express';
import { registerUser, loginUser, getCurrentUser, updateCurrentUser, changePassword } from '../controllers/userController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateBody } from '../utils/validation';
import { registerSchema, loginSchema, updateUserSchema, changePasswordSchema } from '../schemas';

const router = express.Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags:
 *       - auth
 *     summary: 用户注册
 *     description: 创建新用户账户
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               phone:
 *                 type: string
 *     responses:
 *       '200':
 *         description: 注册成功
 */
router.post('/register', validateBody(registerSchema), registerUser);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - auth
 *     summary: 用户登录
 *     description: 使用用户名/邮箱和密码登录系统
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: 用户名或邮箱
 *               password:
 *                 type: string
 *     responses:
 *       '200':
 *         description: 登录成功
 *       '401':
 *         description: 用户名或密码错误
 *       '403':
 *         description: 账户已被禁用
 */
router.post('/login', validateBody(loginSchema), loginUser);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags:
 *       - auth
 *     summary: 获取当前用户信息
 *     description: 获取已登录用户的详细信息
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: 用户信息
 *       '401':
 *         description: 未认证
 */
router.get('/me', authMiddleware, getCurrentUser);

/**
 * @openapi
 * /api/auth/me:
 *   put:
 *     tags:
 *       - auth
 *     summary: 更新当前用户信息
 *     description: 更新已登录用户的个人信息
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 description: 头像URL（base64编码）
 *     responses:
 *       '200':
 *         description: 更新成功
 */
router.put('/me', authMiddleware, validateBody(updateUserSchema), updateCurrentUser);

/**
 * @openapi
 * /api/auth/me/password:
 *   put:
 *     tags:
 *       - auth
 *     summary: 修改密码
 *     description: 修改已登录用户的密码
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 description: 当前密码
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: 新密码，至少6位
 *     responses:
 *       '200':
 *         description: 修改成功
 */
router.put('/me/password', authMiddleware, validateBody(changePasswordSchema), changePassword);

export default router;