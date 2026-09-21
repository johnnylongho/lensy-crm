import { Router, Request, Response } from 'express';
import { mockStore } from '../mockStore';
import { supabase, isSupabaseConfigured } from '../supabase';
import { checkGearConflicts } from '../services/conflictScanner';

export const gearRouter = Router();

// GET /api/gears
gearRouter.get('/', async (_req: Request, res: Response) => {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('gears').select('*').order('name');
      if (error) throw error;
      return res.json({ success: true, data });
    }
    return res.json({ success: true, data: mockStore.getGears() });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/gears/check-conflict
gearRouter.post('/check-conflict', async (req: Request, res: Response) => {
  try {
    const { eventDate, selectedGearIds, currentBookingId } = req.body;
    if (!eventDate || !Array.isArray(selectedGearIds)) {
      return res.status(400).json({ success: false, error: 'eventDate and selectedGearIds are required' });
    }
    const report = await checkGearConflicts(eventDate, selectedGearIds, currentBookingId);
    return res.json({ success: true, data: report });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});
