import React from 'react';
import { Booking, Gear } from '@lensflow/shared';
import { Calendar, DollarSign, Camera, AlertCircle } from 'lucide-react';

interface Props {
  bookings: Booking[];
  gears: Gear[];
  onNavigateTab: (tab: string) => void;
}

export const DashboardStats: React.FC<Props> = ({ bookings, gears, onNavigateTab }) => {
  const activeBookings = bookings.filter(b => b.workflowStage !== 'completed');
  const deliveredPendingDebt = bookings.filter(b => b.workflowStage === 'delivered' && b.remainingAmount > 0);
  const totalDebt = deliveredPendingDebt.reduce((sum, b) => sum + (b.remainingAmount || 0), 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {/* Stat 1: Upcoming shoots */}
      <div 
        onClick={() => onNavigateTab('kanban')}
        className="p-4 bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl cursor-pointer transition-all space-y-2 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Lịch Chụp Đang Chạy</span>
          <div className="p-2 bg-indigo-950 text-indigo-400 rounded-xl">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-white font-mono">{activeBookings.length}</div>
        <div className="text-[11px] text-slate-500">Bao gồm chuẩn bị & hậu kỳ</div>
      </div>

      {/* Stat 2: Debts to collect */}
      <div 
        onClick={() => onNavigateTab('debt')}
        className="p-4 bg-rose-950/30 border border-rose-500/30 hover:border-rose-500/50 rounded-2xl cursor-pointer transition-all space-y-2 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-rose-300">Nợ Cần Thu Hồi (Zalo)</span>
          <div className="p-2 bg-rose-950 text-rose-400 rounded-xl">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl md:text-2xl font-extrabold text-rose-400 font-mono">
          {totalDebt.toLocaleString('vi-VN')} đ
        </div>
        <div className="text-[11px] text-rose-300 font-medium">
          {deliveredPendingDebt.length} khách đã trả link ảnh
        </div>
      </div>

      {/* Stat 3: Total Gears */}
      <div 
        onClick={() => onNavigateTab('quote')}
        className="p-4 bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl cursor-pointer transition-all space-y-2 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Thiết Bị Sẵn Sàng</span>
          <div className="p-2 bg-purple-950 text-purple-400 rounded-xl">
            <Camera className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-white font-mono">{gears.length}</div>
        <div className="text-[11px] text-slate-500">Body, Lens GM/L & Đèn</div>
      </div>

      {/* Stat 4: Fast Action */}
      <div 
        onClick={() => onNavigateTab('quote')}
        className="p-4 bg-gradient-to-br from-indigo-900/50 to-purple-900/40 border border-indigo-500/40 hover:border-indigo-500/60 rounded-2xl cursor-pointer transition-all space-y-2 shadow-sm flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-indigo-300">Quét Trùng Thiết Bị</span>
          <div className="p-1.5 bg-indigo-600/40 text-indigo-300 rounded-lg">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xs text-slate-200">
          Tạo báo giá mới & kiểm tra đụng lịch máy ngay lập tức
        </div>
        <div className="text-[11px] text-indigo-300 font-bold underline">
          Lên Báo Giá Ngay →
        </div>
      </div>
    </div>
  );
};
