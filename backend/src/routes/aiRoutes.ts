import express from 'express';
import {
  checkAIStatus,
  chatWithAI,
  getTrainingAdvice,
  getNutritionAdvice,
  getPlanSuggestion,
} from '../controllers/aiController';
import { authMiddleware } from '../middleware/authMiddleware';
import { aiRateLimit } from '../middleware/rateLimitMiddleware';
import { validateBody } from '../utils/validation';
import { aiChatSchema, aiAdviceSchema } from '../schemas';

const router = express.Router();

router.get('/status', checkAIStatus);
router.post('/chat', authMiddleware, aiRateLimit, validateBody(aiChatSchema), chatWithAI);
router.post('/training-advice', authMiddleware, aiRateLimit, validateBody(aiAdviceSchema), getTrainingAdvice);
router.post('/nutrition-advice', authMiddleware, aiRateLimit, validateBody(aiAdviceSchema), getNutritionAdvice);
router.get('/plan-suggestion', authMiddleware, aiRateLimit, getPlanSuggestion);

export default router;