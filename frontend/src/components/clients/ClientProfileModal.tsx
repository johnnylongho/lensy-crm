import React from 'react';
import { CalendarEvent } from '../../types';
import { STATUS_CONFIG } from '../dashboard/BookingStatusSelect';
import {
  X,
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Camera,
  Layers,
  Sparkles,
} from 'lucide-react';

export interface ClientProfileData {
  id: string;
  name: string;
  phone: string;
  email?: string;
  created_at?: string;
  totalBookings: number;
  totalSpent: number; // LTV (Lifetime Value)
  totalRemainingDebt: number;
  isVip: boolean;
  tier: 'vip' | 'regular' | 'lead';
  lastBookingDate?: string;
  bookings: CalendarEvent[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  client: ClientProfileData | null;
}

export const ClientProfileModal: React.FC<Props> = ({ isOpen, onClose, client }) => {
  if (!isOpen || !client) return null;

  // Lấy 2 chữ cái đầu làm avatar
  const initials = client.name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map(w => w[0]?.toUpperCase())
    .join('') || 'KH';

  const cleanPhone = client.phone.replace(/[^0-9]/g, '');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop kính mờ */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel: Slide-over từ bên phải trên Desktop (w-[540px] lg:w-[600px]), Bottom Sheet trên Mobile */}
      <div
        className="fixed inset-x-0 bottom-0 md:inset-y-0 md:left-auto md:right-0 w-full md:w-[540px] lg:w-[600px] max-h-[92vh] md:max-h-full h-auto md:h-full bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 shadow-[-16px_0_48px_0_rgba(0,0,0,0.6)] flex flex-col z-50 overflow-hidden rounded-t-3xl md:rounded-t-none md:rounded-l-3xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Drawer Header (Cố định trên cùng) */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md flex items-start justify-between gap-3 flex-shrink-0">
          {/* Profile Header: Avatar, Name, VIP Badge, Contact Links */}
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black shadow-lg flex-shrink-0 ${
                client.isVip
                  ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-slate-950 ring-4 ring-amber-500/20'
                  : 'bg-slate-800 border border-slate-700 text-slate-200'
              }`}
            >
              {initials}
            </div>

            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-bold text-white truncate">
                  {client.name}
                </h3>
                {client.isVip ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/50 text-amber-300 shadow-sm animate-pulse-subtle">
                    <span>👑</span>
                    <span>VIP GOLD</span>
                  </span>
                ) : client.tier === 'regular' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 border border-slate-700 text-slate-300">
                    <span>🥈</span>
                    <span>Thân Thiết</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800/50 border border-slate-800 text-slate-400">
                    <span>🥉</span>
                    <span>Khách Mới</span>
                  </span>
                )}
              </div>

              {/* Thông tin liên hệ nhanh */}
              <div className="flex items-center gap-3 flex-wrap text-xs text-slate-400 pt-0.5">
                <span className="flex items-center gap-1 font-mono text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  {client.phone}
                </span>
                {client.email && (
                  <span className="flex items-center gap-1 text-slate-400 truncate max-w-[220px]">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    {client.email}
                  </span>
                )}
              </div>
            </div>

            {/* Quick action buttons: Zalo, Phone */}
            <div className="flex items-center gap-2 pt-2 sm:pt-0">
              <a
                href={`https://zalo.me/${cleanPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-bold transition-all flex items-center gap-1.5"
                title="Nhắn tin Zalo nhanh"
              >
                <MessageCircle className="w-4 h-4 text-blue-400" />
                <span>Nhắn Zalo</span>
              </a>
              <a
                href={`tel:${cleanPhone}`}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Gọi điện trực tiếp"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Close button in header */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex-shrink-0"
            title="Đóng hồ sơ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* 4 Thẻ KPI Khách Hàng (Lifetime Metrics) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* LTV */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Giá trị trọn đời (LTV)</span>
              </span>
              <p className="text-base sm:text-lg font-black font-mono text-emerald-400">
                {client.totalSpent.toLocaleString('vi-VN')} đ
              </p>
            </div>

            {/* Số show chụp */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>Số Lần Chụp</span>
              </span>
              <p className="text-base sm:text-lg font-black font-mono text-white">
                {client.totalBookings} <span className="text-xs font-normal text-slate-400">show</span>
              </p>
            </div>

            {/* Phân hạng */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Hạng Thành Viên</span>
              </span>
              <p className="text-sm sm:text-base font-bold text-amber-300 flex items-center gap-1">
                {client.isVip ? '👑 VIP Gold' : client.tier === 'regular' ? '🥈 Thân Thiết' : '🥉 Khách Mới'}
              </p>
            </div>

            {/* Trạng thái công nợ */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-rose-400" />
                <span>Nợ Chưa Thu</span>
              </span>
              {client.totalRemainingDebt > 0 ? (
                <p className="text-sm sm:text-base font-black font-mono text-rose-400">
                  {client.totalRemainingDebt.toLocaleString('vi-VN')} đ
                </p>
              ) : (
                <p className="text-xs font-bold text-emerald-400 flex items-center gap-1 pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Đã tất toán</span>
                </p>
              )}
            </div>
          </div>

          {/* Lịch sử các gói chụp (Booking History) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>Lịch Sử Các Gói Chụp Đã Dùng ({client.bookings.length})</span>
              </h4>
              <span className="text-[11px] text-slate-400">
                Gần nhất: {client.lastBookingDate || 'Chưa chụp'}
              </span>
            </div>

            {client.bookings.length === 0 ? (
              <div className="text-center py-8 rounded-2xl border border-dashed border-slate-800 text-slate-500 text-xs">
                Chưa có lịch sử show chụp nào được ghi nhận.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                {client.bookings.map((booking, idx) => {
                  const statusConf = STATUS_CONFIG[booking.status] || STATUS_CONFIG.lead || STATUS_CONFIG.cho_coc;
                  const paid = booking.paidAmount ?? (booking.status === 'done' || booking.status === 'hoan_thanh' ? booking.packagePrice : booking.depositAmount);
                  const remaining = Math.max(0, booking.packagePrice - paid);

                  return (
                    <div
                      key={booking.id || idx}
                      className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">
                              {booking.clientName || client.name}
                            </span>
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {booking.sessionType}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-amber-400" />
                              {booking.eventDate}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {booking.startTime} - {booking.endTime}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusConf.badgeBg} ${statusConf.textColor} ${statusConf.borderColor}`}
                        >
                          {statusConf.label}
                        </span>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px] truncate">
                        <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                        <span className="truncate">{booking.location}</span>
                      </div>

                      {/* Pricing breakdown */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 font-mono text-[11px]">
                        <span className="text-slate-400">
                          Giá gói: <strong className="text-slate-200">{booking.packagePrice.toLocaleString('vi-VN')} đ</strong>
                        </span>
                        {remaining > 0 ? (
                          <span className="text-rose-400 font-bold">
                            Chưa thu: {remaining.toLocaleString('vi-VN')} đ
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Đã thanh toán đủ
                          </span>
                        )}
                      </div>

                      {/* Link báo giá nếu có quoteToken */}
                      {booking.quoteToken && (
                        <div className="pt-1 flex justify-end">
                          <a
                            href={`/quote/${booking.quoteToken}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-amber-400 hover:underline"
                          >
                            <span>Xem thư báo giá</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Drawer Sticky Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/90 backdrop-blur-md flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-slate-400">
            Hồ sơ khách hàng Lensy CRM
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
          >
            Đóng Hồ Sơ
          </button>
        </div>
      </div>
    </div>
  );
};
