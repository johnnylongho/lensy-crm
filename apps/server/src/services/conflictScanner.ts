import { ConflictReport, ConflictItem, Gear, Booking } from '@lensflow/shared';
import { mockStore } from '../mockStore';
import { supabase, isSupabaseConfigured } from '../supabase';

export async function checkGearConflicts(
  eventDate: string,
  selectedGearIds: string[],
  currentBookingId?: string
): Promise<ConflictReport> {
  let allBookings: Booking[] = [];
  let allGears: Gear[] = [];

  if (isSupabaseConfigured && supabase) {
    const { data: bData } = await supabase.from('bookings').select('*, booking_gears(gear_id)').eq('event_date', eventDate);
    const { data: gData } = await supabase.from('gears').select('*');
    allBookings = (bData || []).map((b: any) => ({
      ...b,
      assignedGearIds: b.booking_gears?.map((bg: any) => bg.gear_id) || []
    }));
    allGears = gData || [];
  } else {
    allBookings = mockStore.getBookings();
    allGears = mockStore.getGears();
  }

  // Filter bookings on the same date excluding the current one being edited
  const sameDateBookings = allBookings.filter(b => 
    b.eventDate === eventDate && 
    b.id !== currentBookingId &&
    b.workflowStage !== 'completed'
  );

  const conflictingGears: ConflictItem[] = [];
  let totalSuggestedRentalCost = 0;

  for (const gearId of selectedGearIds) {
    const gear = allGears.find(g => g.id === gearId);
    if (!gear) continue;

    // Check if gear is already allocated to another booking on this date
    const conflictingBooking = sameDateBookings.find(b => b.assignedGearIds?.includes(gearId));
    if (conflictingBooking) {
      conflictingGears.push({
        gear,
        conflictWithBookingId: conflictingBooking.id,
        conflictWithClientName: conflictingBooking.clientName,
        suggestedRentalCost: gear.estimatedRentalCost,
      });
      totalSuggestedRentalCost += gear.estimatedRentalCost;
    }
  }

  const hasConflict = conflictingGears.length > 0;
  const warningMessage = hasConflict
    ? `Phát hiện ${conflictingGears.length} thiết bị/nhân sự bị trùng lịch chụp vào ngày ${eventDate}! Đề xuất cộng thêm ${totalSuggestedRentalCost.toLocaleString('vi-VN')} đ chi phí thuê ngoài vào báo giá.`
    : 'Không phát hiện trùng lặp thiết bị cho lịch chụp này.';

  return {
    hasConflict,
    eventDate,
    conflictingGears,
    totalSuggestedRentalCost,
    warningMessage,
  };
}
