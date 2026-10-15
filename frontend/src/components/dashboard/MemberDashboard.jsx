import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Camera,
  DollarSign,
  Bell,
  AlertCircle,
  FileText,
  User,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { formatCurrencyVND } from '../../utils/currency';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';

export const MemberDashboard = ({
  events = [],
  onOpenDetailModal,
}) => {
  const { currentStudio, switchRole } = useWorkspace();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('today');

  const todayStr = new Date().toISOString().split('T')[0];

  // Các buổi chụp phân công cho thành viên này (hoặc tất cả buổi chụp studio phân công)
  const myAssignedEvents = events.filter(e => {
    if (e.is_deleted) return false;
    if (user?.id && (e.staff_id === user.id || e.photographer_id === user.id)) return true;
    if (e.crew_assignments?.some(c => c.user_id === user?.id)) return true;
    return true; // Trong mock/demo, hiển thị lịch ekip
  });

  // Nhiệm vụ hôm nay
  const todayTasks = myAssignedEvents.filter(e => e.eventDate === todayStr);

  // Lịch sắp tới
  const upcomingTasks = myAssignedEvents.filter(e => e.eventDate > todayStr);

  // Tính toán thu nhập cá nhân (My Payroll)
  const totalMyEarnings = myAssignedEvents.reduce((sum, e) => {
    const myCrew = e.crew_assignments?.find(c => c.user_id === user?.id);
    if (myCrew) return sum + (myCrew.fee || 0);
    return sum + (e.packagePrice ? Math.round(e.packagePrice * 0.15) : 500000);
  }, 0);

  // Danh sách thông báo nội bộ từ quản lý Studio
  const studioAnnouncements = [
    {
      id: 1,
      title: '📌 Lưu ý chuẩn bị thiết bị mùa cao điểm cưới',
      sender: currentStudio?.name || 'Quản Lý Studio',
      time: 'Hôm nay 08:30',
      urgent: true,
      content:
        'Tất cả thợ ảnh chính và phụ vui lòng kiểm tra pin, sạc đôi và định dạng thẻ nhớ kép trước giờ xuất phát 30 phút. Trả thiết bị về tủ chống ẩm ngay sau ca chụp.',
    },
    {
      id: 2,
      title: '🎉 Thưởng chỉ tiêu xuất sắc quý',
      sender: 'Kế toán & Nhân sự',
      time: 'Hôm qua 16:45',
      urgent: false,
      content:
        'Ekip hoàn thành trên 15 show đúng hạn và nhận đánh giá 5 sao từ khách hàng sẽ được thưởng 1.500.000đ trực tiếp vào kỳ lương ngày 25.',
    },
    {
      id: 3,
      title: '📸 Quy chuẩn lưu trữ file RAW & Bàn giao ảnh',
      sender: 'Trưởng nhóm Hậu kỳ',
      time: '12/10/2026',
      urgent: false,
      content:
        'Upload đầy đủ file gốc lên Google Drive Studio trong vòng 12h sau buổi chụp để bộ phận Proofing gửi link cho khách chọn ảnh kịp thời.',
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* 1. TOP BANNER: GIAO DIỆN CÁ NHÂN HÓA THÀNH VIÊN EKIP */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-[#df8653]/10 to-amber-500/10 border border-emerald-500/20 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-500/20">
            📸
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Thành viên Studio (Member)
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {currentStudio?.name || 'Mirmia Studio Team'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
              Bảng Phân Công & Nhiệm Vụ Hôm Nay
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Chào ngày mới! Xem chi tiết các ca chụp được phân công, lịch trình và hướng dẫn từ quản lý.
            </p>
          </div>
        </div>

        {/* Quick KPI Pills for Member */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-center min-w-[100px]">
            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Ca hôm nay</div>
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">{todayTasks.length}</div>
          </div>
          <div className="px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-center min-w-[110px]">
            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Thu nhập dự kiến</div>
            <div className="text-lg font-black text-[#df8653] dark:text-orange-400">
              {formatCurrencyVND(totalMyEarnings)}
            </div>
          </div>
        </div>
      </div>

      {/* 2. GRID 2 CỘT: NHIỆM VỤ HÔM NAY VS THÔNG BÁO TỪ QUẢN LÝ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CỘT TRÁI (7 CỘT): NHIỆM VỤ HÔM NAY & CA CHỤP PHÂN CÔNG */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>Nhiệm Vụ Tác Chiến Hôm Nay ({todayTasks.length})</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>

          {todayTasks.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center text-2xl">
                ✨
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Hôm nay bạn không có ca chụp nào được phân công!
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Hãy kiểm tra lại thiết bị, bảo dưỡng thẻ nhớ hoặc xem qua các ca chụp sắp tới trong tuần.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayTasks.map((task, idx) => (
                <div
                  key={task.id || idx}
                  onClick={() => onOpenDetailModal && onOpenDetailModal(task)}
                  className="p-5 rounded-3xl bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-slate-200/90 dark:border-white/10 transition-all shadow-sm hover:shadow-md cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-emerald-500 text-white">
                          {task.sessionType || 'Gói Chụp'}
                        </span>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          {task.startTime} - {task.endTime}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#df8653] transition-colors">
                        Khách hàng: {task.clientName}
                      </h3>

                      <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 pt-1">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          <span>{task.location || 'Tại Studio'}</span>
                        </div>
                        {task.clientPhone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-blue-500" />
                            <span>{task.clientPhone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-xl">
                        Xem Chi Tiết
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Lịch chụp sắp tới */}
          <div className="pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#df8653]" />
              <span>Ca Chụp Phân Công Sắp Tới ({upcomingTasks.length})</span>
            </h3>

            <div className="space-y-2.5">
              {upcomingTasks.slice(0, 3).map((task, idx) => (
                <div
                  key={task.id || idx}
                  onClick={() => onOpenDetailModal && onOpenDetailModal(task)}
                  className="p-4 rounded-2xl bg-white/60 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 border border-slate-200/70 dark:border-white/5 flex items-center justify-between gap-3 text-xs cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-black/30 font-mono font-bold text-[#df8653] text-center">
                      {task.eventDate}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{task.clientName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {task.sessionType} • {task.startTime}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (5 CỘT): THÔNG BÁO TỪ QUẢN LÝ (STUDIO ANNOUNCEMENTS) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
              <Bell className="w-5 h-5 text-amber-500" />
              <span>Thông Báo Từ Quản Lý Studio</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
              3 thông báo
            </span>
          </div>

          <div className="space-y-3.5">
            {studioAnnouncements.map(notice => (
              <div
                key={notice.id}
                className={`p-4 rounded-3xl border transition-all ${
                  notice.urgent
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-white/80 dark:bg-white/5 border-slate-200/80 dark:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    {notice.urgent && <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{notice.title}</h4>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 flex-shrink-0">
                    {notice.time}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{notice.content}</p>
                <div className="pt-2 mt-2 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Người gửi: <strong>{notice.sender}</strong></span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Đã xác thực
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Help Card */}
          <div className="p-4 rounded-3xl bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Hỗ trợ kỹ thuật & thiết bị</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
              Gặp sự cố máy móc hoặc cần hỗ trợ tại hiện trường? Liên hệ ngay Quản lý Studio qua hotline nội bộ hoặc mục Tin nhắn Ekip.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;
