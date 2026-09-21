import { Router, Request, Response } from 'express';
import { getPendingDebtReminders } from '../services/debtCollector';

export const debtRouter = Router();

// GET /api/debt-collector/pending
debtRouter.get('/pending', async (_req: Request, res: Response) => {
  try {
    const reminders = await getPendingDebtReminders();
    return res.json({ success: true, data: reminders });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});
