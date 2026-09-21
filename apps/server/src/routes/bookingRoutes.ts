import { Router, Request, Response } from 'express';
import { mockStore } from '../mockStore';
import { supabase, isSupabaseConfigured } from '../supabase';
import { Booking } from '@lensflow/shared';

export const bookingRouter = Router();

// GET /api/bookings
bookingRouter.get('/', async (_req: Request, res: Response) => {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, booking_gears(gear_id)')
        .order('event_date', { ascending: true });
      if (error) throw error;
      return res.json({ success: true, data });
    }
    return res.json({ success: true, data: mockStore.getBookings() });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/bookings/quote/:token (Client-facing Quote Link)
bookingRouter.get('/quote/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, booking_gears(gear_id)')
        .eq('quote_token', token)
        .single();
      if (error) return res.status(404).json({ success: false, error: 'Quote not found' });
      return res.json({ success: true, data });
    }

    const booking = mockStore.getBookingByQuoteToken(token);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Quote not found' });
    }
    // Enrich with gear details
    const gears = mockStore.getGears().filter(g => booking.assignedGearIds.includes(g.id));
    return res.json({ success: true, data: { ...booking, assignedGears: gears } });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/bookings
bookingRouter.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const newBooking: Booking = {
      id: `booking-${Date.now()}`,
      clientName: body.clientName,
      clientPhone: body.clientPhone,
      clientEmail: body.clientEmail || '',
      sessionType: body.sessionType || 'portrait',
      eventDate: body.eventDate,
      startTime: body.startTime || '08:00',
      endTime: body.endTime || '12:00',
      location: body.location || '',
      packagePrice: Number(body.packagePrice || 0),
      depositAmount: Number(body.depositAmount || 0),
      paidAmount: Number(body.paidAmount || 0),
      remainingAmount: Number(body.packagePrice || 0) - Number(body.paidAmount || 0),
      workflowStage: body.workflowStage || 'lead',
      paymentStatus: body.paymentStatus || 'unpaid',
      quoteToken: `quote-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      assignedGearIds: body.assignedGearIds || [],
      driveDeliveryLink: body.driveDeliveryLink || '',
      notes: body.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('bookings').insert([{
        client_name: newBooking.clientName,
        client_phone: newBooking.clientPhone,
        client_email: newBooking.clientEmail,
        session_type: newBooking.sessionType,
        event_date: newBooking.eventDate,
        start_time: newBooking.startTime,
        end_time: newBooking.endTime,
        location: newBooking.location,
        package_price: newBooking.packagePrice,
        deposit_amount: newBooking.depositAmount,
        paid_amount: newBooking.paidAmount,
        workflow_stage: newBooking.workflowStage,
        payment_status: newBooking.paymentStatus,
        quote_token: newBooking.quoteToken,
        notes: newBooking.notes,
      }]).select().single();
      if (error) throw error;
      return res.status(201).json({ success: true, data });
    }

    mockStore.createBooking(newBooking);
    return res.status(201).json({ success: true, data: newBooking });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/bookings/:id (Update stage, payment status, etc.)
bookingRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.json({ success: true, data });
    }

    const updated = mockStore.updateBooking(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});
