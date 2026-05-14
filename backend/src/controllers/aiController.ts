import { Request, Response } from 'express';
import {
  createChatCompletion,
  buildUserContext,
  formatUserContextForPrompt,
  isAIConfigured,
} from '../services/aiService';
import {
  SYSTEM_PROMPT,
  TRAINING_ADVICE_PROMPT,
  NUTRITION_ADVICE_PROMPT,
  PLAN_SUGGESTION_PROMPT,
  FALLBACK_RESPONSES,
} from '../prompts/fitnessPrompts';

const AI_CONFIG = {
  provider: process.env.AI_PROVIDER || 'openai',
};

type AdviceType = 'training' | 'nutrition' | 'plan' | 'general';

const PROMPT_MAP: Record<string, string> = {
  training: TRAINING_ADVICE_PROMPT,
  nutrition: NUTRITION_ADVICE_PROMPT,
  plan: PLAN_SUGGESTION_PROMPT,
};

export const checkAIStatus = (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      configured: isAIConfigured(),
      provider: AI_CONFIG.provider,
    },
  });
};

export const chatWithAI = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { message, type } = req.body;

    if (!isAIConfigured()) {
      res.json({
        success: true,
        data: {
          reply: FALLBACK_RESPONSES[type as AdviceType] || FALLBACK_RESPONSES.general,
          is_fallback: true,
        },
      });
      return;
    }

    const userContext = await buildUserContext(userId);
    const contextPrompt = formatUserContextForPrompt(userContext);
    const adviceType = type || 'general';
    const typePrompt = PROMPT_MAP[adviceType];

    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT + '\n\n' + contextPrompt + (typePrompt ? '\n\n' + typePrompt : '') },
      { role: 'user' as const, content: message },
    ];

    const result = await createChatCompletion(messages);
    res.json({ success: true, data: { reply: result.content, is_fallback: false } });
  } catch (error) {
    console.error('AI 对话失败:', error);
    const { type } = req.body;
    res.json({
      success: true,
      data: {
        reply: FALLBACK_RESPONSES[type as AdviceType] || FALLBACK_RESPONSES.general,
        is_fallback: true,
      },
    });
  }
};

export const getTrainingAdvice = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { focus_area } = req.body;

    if (!isAIConfigured()) {
      res.json({ success: true, data: { reply: FALLBACK_RESPONSES.training, is_fallback: true } });
      return;
    }

    const userContext = await buildUserContext(userId);
    const contextPrompt = formatUserContextForPrompt(userContext);
    const userMessage = focus_area
      ? `请针对"${focus_area}"方面给我训练建议`
      : '请给我训练建议';

    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT + '\n\n' + contextPrompt + '\n\n' + TRAINING_ADVICE_PROMPT },
      { role: 'user' as const, content: userMessage },
    ];

    const result = await createChatCompletion(messages);
    res.json({ success: true, data: { reply: result.content, is_fallback: false } });
  } catch (error) {
    console.error('获取训练建议失败:', error);
    res.json({ success: true, data: { reply: FALLBACK_RESPONSES.training, is_fallback: true } });
  }
};

export const getNutritionAdvice = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { focus_area } = req.body;

    if (!isAIConfigured()) {
      res.json({ success: true, data: { reply: FALLBACK_RESPONSES.nutrition, is_fallback: true } });
      return;
    }

    const userContext = await buildUserContext(userId);
    const contextPrompt = formatUserContextForPrompt(userContext);
    const userMessage = focus_area
      ? `请针对"${focus_area}"方面给我营养建议`
      : '请给我营养饮食建议';

    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT + '\n\n' + contextPrompt + '\n\n' + NUTRITION_ADVICE_PROMPT },
      { role: 'user' as const, content: userMessage },
    ];

    const result = await createChatCompletion(messages);
    res.json({ success: true, data: { reply: result.content, is_fallback: false } });
  } catch (error) {
    console.error('获取营养建议失败:', error);
    res.json({ success: true, data: { reply: FALLBACK_RESPONSES.nutrition, is_fallback: true } });
  }
};

export const getPlanSuggestion = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    if (!isAIConfigured()) {
      res.json({ success: true, data: { reply: FALLBACK_RESPONSES.plan, is_fallback: true } });
      return;
    }

    const userContext = await buildUserContext(userId);
    const contextPrompt = formatUserContextForPrompt(userContext);

    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT + '\n\n' + contextPrompt + '\n\n' + PLAN_SUGGESTION_PROMPT },
      { role: 'user' as const, content: '请根据我的情况推荐适合的健身计划' },
    ];

    const result = await createChatCompletion(messages);
    res.json({ success: true, data: { reply: result.content, is_fallback: false } });
  } catch (error) {
    console.error('获取计划推荐失败:', error);
    res.json({ success: true, data: { reply: FALLBACK_RESPONSES.plan, is_fallback: true } });
  }
};