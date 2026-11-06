import { CalendarEvent } from '../types';

/**
 * Format number as Vietnamese Dong currency string
 * Example: 12600000 -> "12.600.000 ₫"
 */
export function formatVND(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') {
    return '0\u00A0₫';
  }
  const num = typeof amount === 'number' ? amount : Number(amount) || 0;
  return new Intl.NumberFormat('vi-VN').format(Math.round(num)) + '\u00A0₫';
}

/**
 * Calculate deposit amount based on percentage
 */
export function calculateDeposit(totalAmount: number, ratePercent: number = 30): number {
  if (!totalAmount || totalAmount <= 0) return 0;
  return Math.round((totalAmount * ratePercent) / 100);
}

export interface StudioKPIs {
  totalContractValue: number;
  totalCollected: number;
  collectionRate: number;
  netProfit: number;
  todayShowsCount: number;
  todayNextTime: string | null;
  pendingDepositCount: number;
  totalDebt: number;
  completedThisMonth: number;
  totalThisMonth: number;
  completionRate: number;
}

/**
 * Calculate 4 core Hero metrics for Lensy Studio Command Center from CalendarEvent[]
 */
export function calculateStudioKPIs(events: CalendarEvent[], todayDateStr?: string): StudioKPIs {
  const today = todayDateStr || new Date().toISOString().split('T')[0];
  const currentMonth = today.slice(0, 7); // YYYY-MM

  let totalContractValue = 0;
  let totalCollected = 0;
  let totalEkipCost = 0;
  let pendingDepositCount = 0;
  let totalDebt = 0;
  let todayShowsCount = 0;
  let earliestTodayTime: string | null = null;
  let completedThisMonth = 0;
  let totalThisMonth = 0;

  for (const event of events) {
    if (event.status === 'cancelled' || (event.status as any) === 'da_huy') continue;

    const price = Number(event.packagePrice || 0);
    const paid = Number(event.paidAmount || 0);
    const expenses = Number(event.expenses || 0);

    totalContractValue += price;
    totalCollected += paid;

    // Calculate ekip and direct expenses
    const crewCost = (event.crew_assignments || []).reduce((sum, c) => sum + Number((c as any).fee || (c as any).amount || 0), 0);
    totalEkipCost += crewCost + expenses;

    const remaining = Number(
      event.remainingAmount !== undefined && event.remainingAmount !== null
        ? event.remainingAmount
        : Math.max(0, price - paid)
    );

    if (remaining > 0 && event.status !== 'cho_coc' && (event.status as any) !== 'lead') {
      totalDebt += remaining;
    }

    if (event.status === 'cho_coc' || (event.status as any) === 'lead' || event.status === 'cho_xac_nhan_coc') {
      pendingDepositCount++;
    }

    // Today checks
    if (event.eventDate === today) {
      todayShowsCount++;
      const time = event.startTime || '08:00';
      if (!earliestTodayTime || time < earliestTodayTime) {
        earliestTodayTime = time;
      }
    }

    // Month checks
    if (event.eventDate && event.eventDate.startsWith(currentMonth)) {
      totalThisMonth++;
      if (event.status === 'da_chot' || event.status === 'hoan_thanh' || event.status === 'done' || (event.status as any) === 'completed') {
        completedThisMonth++;
      }
    }
  }

  const collectionRate = totalContractValue > 0 ? Math.round((totalCollected / totalContractValue) * 100) : 0;
  const netProfit = totalCollected - totalEkipCost;
  const completionRate = totalThisMonth > 0 ? Math.round((completedThisMonth / totalThisMonth) * 100) : 0;

  return {
    totalContractValue,
    totalCollected,
    collectionRate,
    netProfit,
    todayShowsCount,
    todayNextTime: earliestTodayTime,
    pendingDepositCount,
    totalDebt,
    completedThisMonth,
    totalThisMonth,
    completionRate,
  };
}

