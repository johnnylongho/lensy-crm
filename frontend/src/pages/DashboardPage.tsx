import React from 'react';
import { PhotographerDashboard } from '../components/dashboard/PhotographerDashboard';
import { CalendarEvent } from '../types';

interface Props {
  events: CalendarEvent[];
  onViewQuote: (eventId: string) => void;
  onRefreshEvents?: () => void;
}

/**
 * DashboardPage:
 * Trang Dashboard Quản Trị Trung Tâm Lensy CRM (Light Mode First).
 * - Nền sáng mặc định (bg-slate-50, text-slate-900)
 * - Khối Hero Metrics dải Gradient Brand Cam - Hồng - Tím (from-[#FF9A44] via-[#FC6076] to-[#A044FF])
 * - Font chữ số tròn trịa hiện đại (font-sans font-bold tracking-tight, không dùng font-mono)
 */
export const DashboardPage: React.FC<Props> = (props) => {
  return <PhotographerDashboard {...props} />;
};

export default DashboardPage;

