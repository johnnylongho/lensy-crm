import React, { useState, useEffect } from 'react';
import { CalendarEvent } from '../../types';
import { STATUS_CONFIG } from '../dashboard/BookingStatusSelect';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { formatCurrencyVND, parseCurrencyVND } from '../../utils/currency';
import {
  X,
  Phone,
  Mail,
  Calendar,
  Clock,
  ExternalLink,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Camera,
  Layers,
  Sparkles,
  Pencil,
  Save,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react';

export interface ClientProfileData {
  id: string;
  name: string;
  phone: string;
  email?: string;
  created_at?: string;
  totalBookings: number;
  totalSpent: number; // Doanh thu thực tế đã thu
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
  onClientUpdated?: (updatedClient: ClientProfileData) => void;
  onClientDeleted?: (clientId: string) => void;
}

export const ClientProfileModal: React.FC<Props> = ({
  isOpen,
  onClose,
  client,
  onClientUpdated,
  onClientDeleted,
}) => {
  // Local state của Client để phản hồi tức thì khi người dùng chỉnh sửa
  const [currentClient, setCurrentClient] = useState<ClientProfileData | null>(client);

  // Chế độ xóa khách hàng
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingClient, setIsDeletingClient] = useState(false);

  // Chế độ xóa một buổi chụp đơn lẻ (vẫn giữ thông tin khách)
  const [deletingBooking, setDeletingBooking] = useState<CalendarEvent | null>(null);
  const [isDeletingBooking, setIsDeletingBooking] = useState(false);

  // Chế độ chỉnh sửa thông tin khách hàng (Tên, SĐT, Email)
  const [isEditingClientInfo, setIsEditingClientInfo] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  // Chế độ chỉnh sửa từng buổi chụp (Gói chụp, Giá chụp, Số tiền đã trả)
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [bookingForm, setBookingForm] = useState<{
    sessionTitle: string;
    sessionType: string;
    packagePrice: number;
    paidAmount: number;
    depositAmount: number;
    eventDate: string;
    status: string;
  }>({
    sessionTitle: '',
    sessionType: 'portrait',
    packagePrice: 0,
    paidAmount: 0,
    depositAmount: 0,
    eventDate: '',
    status: 'lead',
  });

  // Chế độ thêm show chụp / giao dịch quá khứ cho khách
  const [isAddingPastShoot, setIsAddingPastShoot] = useState(false);
  const [newShootForm, setNewShootForm] = useState<{
    sessionTitle: string;
    sessionType: string;
    packagePrice: number;
    paidAmount: number;
    eventDate: string;
  }>({
    sessionTitle: '',
    sessionType: 'portrait',
    packagePrice: 0,
    paidAmount: 0,
    eventDate: new Date().toISOString().substring(0, 10),
  });

  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Đồng bộ props client vào local state khi mở modal
  useEffect(() => {
    if (client) {
      setCurrentClient(client);
      setClientName(client.name || '');
      setClientPhone(client.phone || '');
      setClientEmail(client.email || '');
      setIsEditingClientInfo(false);
      setEditingBookingId(null);
      setIsAddingPastShoot(false);
      setDeletingBooking(null);
    }
  }, [client]);

  // Tự tắt Toast sau 3.5 giây
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  if (!isOpen || !currentClient) return null;

  // Lấy 2 chữ cái đầu làm avatar
  const initials = currentClient.name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map(w => w[0]?.toUpperCase())
    .join('') || 'KH';

  const cleanPhone = currentClient.phone.replace(/[^0-9]/g, '');

  // Hàm tính toán lại dòng tiền thực tế (chỉ tính tiền thực tế đã thu)
  const recalculateClientMetrics = (bookingsList: CalendarEvent[], baseName?: string, basePhone?: string, baseEmail?: string): ClientProfileData => {
    let totalSpent = 0;
    let totalRemainingDebt = 0;

    bookingsList.forEach(b => {
      const price = Number(b.packagePrice || 0);
      const isCompleted = b.status === 'done' || b.status === 'hoan_thanh' || b.status === 'da_tra_file';
      const isLead = b.status === 'lead' || b.status === 'cho_coc';

      // Tiền thực thu: Nếu có paidAmount thì dùng, nếu đã hoàn thành mà chưa nhập paid thì dùng giá gói,
      // nếu chưa hoàn thành thì chỉ tính tiền cọc depositAmount, nếu là lead/chưa cọc thì = 0
      let paid = Number(b.paidAmount || 0);
      if (paid === 0) {
        if (isCompleted) {
          paid = price;
        } else if (!isLead && b.depositAmount) {
          paid = Number(b.depositAmount);
        }
      }

      totalSpent += paid;
      totalRemainingDebt += Math.max(0, price - paid);
    });

    const totalBookings = bookingsList.length;
    const isVip = totalSpent >= 20000000 || totalBookings >= 3;
    const tier = isVip ? 'vip' : totalBookings >= 2 ? 'regular' : 'lead';

    return {
      ...currentClient,
      name: baseName ?? currentClient.name,
      phone: basePhone ?? currentClient.phone,
      email: baseEmail ?? currentClient.email,
      totalBookings,
      totalSpent,
      totalRemainingDebt,
      isVip,
      tier,
      bookings: bookingsList,
      lastBookingDate: bookingsList[0]?.eventDate || currentClient.lastBookingDate,
    };
  };

  // ==========================================================================
  // 1. LƯU CHỈNH SỬA THÔNG TIN KHÁCH HÀNG (TÊN, SĐT, EMAIL)
  // ==========================================================================
  const handleSaveClientInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = clientName.trim();
    const cleanPhoneVal = clientPhone.trim();
    if (!cleanName || !cleanPhoneVal) {
      setToastMessage({ type: 'error', text: 'Tên và số điện thoại không được để trống!' });
      return;
    }

    setIsSaving(true);
    try {
      if (isSupabaseConfigured) {
        // 1. Cập nhật bảng clients nếu client có ID thật
        if (currentClient.id && !currentClient.id.startsWith('cli-')) {
          await supabase
            .from('clients')
            .update({
              name: cleanName,
              phone: cleanPhoneVal,
              email: clientEmail.trim() || null,
            })
            .eq('id', currentClient.id);
        }

        // 2. Đồng bộ Tên & SĐT vào tất cả các bookings của khách hàng này
        if (currentClient.bookings.length > 0) {
          const bookingIds = currentClient.bookings.map(b => b.id).filter(id => id && !id.startsWith('ev-'));
          if (bookingIds.length > 0) {
            await supabase
              .from('bookings')
              .update({
                client_name: cleanName,
                client_phone: cleanPhoneVal,
                client_email: clientEmail.trim() || null,
              })
              .in('id', bookingIds);
          }
        }
      }

      // Cập nhật bookings trong local state
      const updatedBookings = currentClient.bookings.map(b => ({
        ...b,
        clientName: cleanName,
        clientPhone: cleanPhoneVal,
        clientEmail: clientEmail.trim() || undefined,
      }));

      const updated = recalculateClientMetrics(updatedBookings, cleanName, cleanPhoneVal, clientEmail.trim() || undefined);
      setCurrentClient(updated);
      setIsEditingClientInfo(false);
      if (onClientUpdated) onClientUpdated(updated);

      setToastMessage({ type: 'success', text: 'Đã cập nhật thông tin khách hàng thành công!' });
    } catch (err: any) {
      console.error('Lỗi khi cập nhật khách hàng:', err);
      setToastMessage({ type: 'error', text: `Lỗi: ${err.message || 'Không thể lưu thông tin'}` });
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================================================
  // 2. XÓA BUỔI CHỤP ĐƠN LẺ (GIỮ LẠI THÔNG TIN KHÁCH HÀNG)
  // ==========================================================================
  const handleConfirmDeleteBooking = async () => {
    if (!deletingBooking || !currentClient) return;

    setIsDeletingBooking(true);
    try {
      const bookingId = deletingBooking.id;

      if (isSupabaseConfigured && bookingId && !bookingId.startsWith('ev-')) {
        const { error } = await supabase
          .from('bookings')
          .delete()
          .eq('id', bookingId);

        if (error) {
          console.error('Lỗi khi xóa booking từ Supabase:', error);
          throw error;
        }
      }

      // Cập nhật mảng bookings của khách
      const updatedBookings = currentClient.bookings.filter(b => b.id !== bookingId);
      const updated = recalculateClientMetrics(updatedBookings);
      setCurrentClient(updated);
      setDeletingBooking(null);

      if (onClientUpdated) onClientUpdated(updated);

      // Phát event để màn hình lịch và dashboard cập nhật ngay
      window.dispatchEvent(new CustomEvent('lensy:refresh-bookings'));

      setToastMessage({
        type: 'success',
        text: 'Đã xóa buổi chụp! Hồ sơ khách hàng vẫn được giữ nguyên vẹn.',
      });
    } catch (err: any) {
      console.error('Lỗi khi xóa lịch chụp:', err);
      setToastMessage({ type: 'error', text: `Lỗi: ${err.message || 'Không thể xóa lịch chụp'}` });
    } finally {
      setIsDeletingBooking(false);
    }
  };

  // ==========================================================================
  // 3. XÁC NHẬN XÓA TOÀN BỘ HỒ SƠ KHÁCH HÀNG
  // ==========================================================================
  const handleConfirmDeleteClient = async () => {
    if (!currentClient) return;
    setIsDeletingClient(true);
    try {
      if (isSupabaseConfigured) {
        const isRealUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentClient.id);
        if (isRealUuid) {
          const { error } = await supabase.from('clients').delete().eq('id', currentClient.id);
          if (error) {
            console.error('Lỗi khi xóa client từ Supabase:', error);
          }
        }
      }
      if (onClientDeleted) {
        onClientDeleted(currentClient.id);
      }
      setShowDeleteConfirm(false);
      onClose();
    } catch (err: any) {
      console.error('Lỗi thực thi xóa khách hàng:', err);
      alert('Đã xảy ra lỗi khi xóa hồ sơ khách hàng. Vui lòng thử lại.');
    } finally {
      setIsDeletingClient(false);
    }
  };

  // ==========================================================================
  // 4. BẮT ĐẦU CHỈNH SỬA MỘT BUỔI CHỤP
  // ==========================================================================
  const handleStartEditBooking = (b: CalendarEvent) => {
    setEditingBookingId(b.id);
    setBookingForm({
      sessionTitle: b.sessionTitle || (b as any).session_title || b.package_type || `Gói ${b.sessionType}`,
      sessionType: b.sessionType || 'portrait',
      packagePrice: Number(b.packagePrice || 0),
      paidAmount: Number(b.paidAmount ?? (b.status === 'done' || b.status === 'hoan_thanh' ? b.packagePrice : b.depositAmount || 0)),
      depositAmount: Number(b.depositAmount || 0),
      eventDate: b.eventDate || new Date().toISOString().substring(0, 10),
      status: b.status || 'lead',
    });
  };

  // LƯU BUỔI CHỤP ĐÃ CHỈNH SỬA
  const handleSaveBooking = async (bookingId: string) => {
    setIsSaving(true);
    try {
      const priceNum = Number(bookingForm.packagePrice) || 0;
      const paidNum = Number(bookingForm.paidAmount) || 0;
      const depositNum = Number(bookingForm.depositAmount) || 0;
      const cleanTitle = bookingForm.sessionTitle.trim() || `Gói ${bookingForm.sessionType}`;

      if (isSupabaseConfigured && bookingId && !bookingId.startsWith('ev-')) {
        const updatePayload: any = {
          session_title: cleanTitle,
          session_type: bookingForm.sessionType,
          package_type: cleanTitle,
          package_price: priceNum,
          paid_amount: paidNum,
          deposit_amount: depositNum,
          event_date: bookingForm.eventDate,
          status: bookingForm.status,
        };

        const { error } = await supabase
          .from('bookings')
          .update(updatePayload)
          .eq('id', bookingId);

        if (error) throw error;
      }

      // Cập nhật local bookings
      const updatedBookings = currentClient.bookings.map(b => {
        if (b.id === bookingId) {
          return {
            ...b,
            sessionTitle: cleanTitle,
            sessionType: bookingForm.sessionType as any,
            package_type: cleanTitle,
            packagePrice: priceNum,
            paidAmount: paidNum,
            depositAmount: depositNum,
            remainingAmount: Math.max(0, priceNum - paidNum),
            eventDate: bookingForm.eventDate,
            status: bookingForm.status as any,
          };
        }
        return b;
      });

      const updated = recalculateClientMetrics(updatedBookings);
      setCurrentClient(updated);
      setEditingBookingId(null);
      if (onClientUpdated) onClientUpdated(updated);

      window.dispatchEvent(new CustomEvent('lensy:refresh-bookings'));

      setToastMessage({ type: 'success', text: 'Đã cập nhật gói chụp và tính toán lại doanh thu thực tế!' });
    } catch (err: any) {
      console.error('Lỗi khi cập nhật buổi chụp:', err);
      setToastMessage({ type: 'error', text: `Lỗi: ${err.message || 'Không thể lưu buổi chụp'}` });
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================================================
  // 5. THÊM GÓI CHỤP / GIAO DỊCH QUÁ KHỨ (BỔ SUNG THỰC THU CHO KHÁCH)
  // ==========================================================================
  const handleCreatePastShoot = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = newShootForm.sessionTitle.trim() || `Gói chụp ${newShootForm.sessionType}`;
    const priceNum = Number(newShootForm.packagePrice) || 0;
    const paidNum = Number(newShootForm.paidAmount) || 0;

    setIsSaving(true);
    try {
      let createdId = `ev-${Date.now()}`;
      const quoteToken = `q-${Date.now().toString().slice(-6)}`;

      if (isSupabaseConfigured) {
        const { data: authData } = await supabase.auth.getUser();
        const photographerId = authData?.user?.id;

        const newRecord: any = {
          client_name: currentClient.name,
          client_phone: currentClient.phone,
          client_email: currentClient.email || null,
          session_type: newShootForm.sessionType,
          session_title: cleanTitle,
          package_type: cleanTitle,
          event_date: newShootForm.eventDate,
          start_time: '08:00:00',
          end_time: '12:00:00',
          location: 'Tại Studio / Địa điểm yêu cầu',
          package_price: priceNum,
          deposit_amount: paidNum,
          paid_amount: paidNum,
          status: 'done', // Show quá khứ mặc định là Hoàn tất
          quote_token: quoteToken,
        };

        if (photographerId) newRecord.photographer_id = photographerId;
        if (currentClient.id && !currentClient.id.startsWith('cli-')) {
          newRecord.client_id = currentClient.id;
        }

        const { data, error } = await supabase
          .from('bookings')
          .insert([newRecord])
          .select()
          .single();

        if (error) throw error;
        if (data) createdId = data.id;
      }

      const newBooking: CalendarEvent = {
        id: createdId,
        clientName: currentClient.name,
        clientPhone: currentClient.phone,
        sessionType: newShootForm.sessionType as any,
        sessionTitle: cleanTitle,
        package_type: cleanTitle,
        eventDate: newShootForm.eventDate,
        startTime: '08:00',
        endTime: '12:00',
        location: 'Tại Studio',
        status: 'done',
        packagePrice: priceNum,
        depositAmount: paidNum,
        paidAmount: paidNum,
        remainingAmount: Math.max(0, priceNum - paidNum),
        quoteToken: quoteToken,
      };

      const updatedBookings = [newBooking, ...currentClient.bookings];
      const updated = recalculateClientMetrics(updatedBookings);
      setCurrentClient(updated);
      setIsAddingPastShoot(false);
      setNewShootForm({
        sessionTitle: '',
        sessionType: 'portrait',
        packagePrice: 0,
        paidAmount: 0,
        eventDate: new Date().toISOString().substring(0, 10),
      });

      if (onClientUpdated) onClientUpdated(updated);
      window.dispatchEvent(new CustomEvent('lensy:refresh-bookings'));

      setToastMessage({ type: 'success', text: `Đã bổ sung ca chụp và ghi nhận ${paidNum.toLocaleString('vi-VN')} đ thực thu!` });
    } catch (err: any) {
      console.error('Lỗi khi thêm show chụp:', err);
      setToastMessage({ type: 'error', text: `Lỗi: ${err.message || 'Không thể tạo show'}` });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop kính mờ */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel: Slide-over từ bên phải, phong cách Lensy Terracotta */}
      <div
        className="fixed inset-x-0 bottom-0 md:inset-y-0 md:left-auto md:right-0 w-full md:w-[620px] lg:w-[680px] max-h-[94vh] md:max-h-full h-auto md:h-full bg-white dark:bg-zinc-900 border-t md:border-t-0 md:border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col z-50 overflow-hidden rounded-t-3xl md:rounded-t-none md:rounded-l-3xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Drawer Header (Cố định trên cùng) */}
        <div className="p-5 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md flex items-start justify-between gap-3 flex-shrink-0">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {/* Avatar cam đất Lensy */}
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black shadow-md flex-shrink-0 ${
                currentClient.isVip
                  ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-[#df8653] text-white ring-4 ring-orange-500/20'
                  : 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200'
              }`}
            >
              {initials}
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {currentClient.name}
                </h3>
                {currentClient.isVip ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/40 text-[#df8653] dark:text-orange-400">
                    <span>👑</span>
                    <span>VIP GOLD</span>
                  </span>
                ) : currentClient.tier === 'regular' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                    <span>🥈</span>
                    <span>Thân Thiết</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">
                    <span>🥉</span>
                    <span>Khách Mới</span>
                  </span>
                )}

                {/* Nút bật/tắt form sửa thông tin khách */}
                <button
                  type="button"
                  onClick={() => setIsEditingClientInfo(!isEditingClientInfo)}
                  className={`p-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    isEditingClientInfo
                      ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                      : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-orange-50 dark:hover:bg-zinc-700 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                  }`}
                  title="Chỉnh sửa Tên, SĐT, Email khách hàng"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span className="text-[11px]">{isEditingClientInfo ? 'Đóng form' : 'Sửa Hồ Sơ'}</span>
                </button>
              </div>

              {/* Thông tin liên hệ */}
              <div className="flex items-center gap-3 flex-wrap text-xs text-zinc-500 dark:text-zinc-400 pt-0.5">
                <span className="flex items-center gap-1 font-mono text-zinc-700 dark:text-zinc-300">
                  <Phone className="w-3.5 h-3.5 text-[#df8653]" />
                  {currentClient.phone}
                </span>
                {currentClient.email && (
                  <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400 truncate max-w-[220px]">
                    <Mail className="w-3.5 h-3.5 text-zinc-400" />
                    {currentClient.email}
                  </span>
                )}
              </div>
            </div>

            {/* Quick action: Zalo */}
            <div className="flex items-center gap-2">
              <a
                href={`https://zalo.me/${cleanPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                title="Nhắn tin Zalo nhanh"
              >
                <MessageCircle className="w-4 h-4 text-blue-500" />
                <span className="hidden sm:inline">Nhắn Zalo</span>
              </a>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors flex-shrink-0 cursor-pointer"
            title="Đóng hồ sơ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Toast Notification */}
          {toastMessage && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-fadeIn shadow-sm ${
                toastMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              }`}
            >
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
              )}
              <span>{toastMessage.text}</span>
            </div>
          )}

          {/* FORM CHỈNH SỬA THÔNG TIN KHÁCH HÀNG (TÊN, SĐT, EMAIL) */}
          {isEditingClientInfo && (
            <form onSubmit={handleSaveClientInfo} className="p-4 sm:p-5 rounded-2xl bg-orange-50/50 dark:bg-zinc-800/80 border border-orange-200 dark:border-orange-500/30 space-y-3.5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-orange-100 dark:border-zinc-700/60 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#df8653] dark:text-orange-400 flex items-center gap-1.5">
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Chỉnh Sửa Thông Tin Khách Hàng</span>
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Đồng bộ cả vào các lịch chụp</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">Tên khách hàng:</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="VD: Nguyễn Thị Lan"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#df8653] focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">Số điện thoại:</label>
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    placeholder="VD: 0987654321"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#df8653] focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">Email:</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={e => setClientEmail(e.target.value)}
                    placeholder="VD: khachhang@gmail.com"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#df8653] focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingClientInfo(false)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 text-zinc-700 dark:text-zinc-300 text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded-xl bg-[#df8653] hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Lưu Hồ Sơ Khách</span>
                </button>
              </div>
            </form>
          )}

          {/* 4 Thẻ KPI Khách Hàng (Dòng Tiền Thực Thu) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Thực thu */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-zinc-800/80 border border-emerald-200 dark:border-emerald-900/50 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Thực Thu Đã Nhận</span>
              </span>
              <p className="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                {currentClient.totalSpent.toLocaleString('vi-VN')} đ
              </p>
              <p className="text-[9px] text-zinc-500 dark:text-zinc-400">Không tính cọc ảo/chưa chốt</p>
            </div>

            {/* Số show chụp */}
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-[#df8653]" />
                <span>Số Lần Chụp</span>
              </span>
              <p className="text-base sm:text-lg font-black font-mono text-zinc-900 dark:text-zinc-100">
                {currentClient.totalBookings} <span className="text-xs font-normal text-zinc-500">lịch</span>
              </p>
            </div>

            {/* Phân hạng */}
            <div className="p-3.5 rounded-2xl bg-orange-50/40 dark:bg-zinc-800/80 border border-orange-200 dark:border-orange-500/30 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#df8653] dark:text-orange-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#df8653]" />
                <span>Hạng Khách Hàng</span>
              </span>
              <p className="text-sm sm:text-base font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                {currentClient.isVip ? '👑 VIP Gold' : currentClient.tier === 'regular' ? '🥈 Thân Thiết' : '🥉 Khách Mới'}
              </p>
            </div>

            {/* Trạng thái công nợ */}
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-rose-500" />
                <span>Nợ Chưa Thu</span>
              </span>
              {currentClient.totalRemainingDebt > 0 ? (
                <p className="text-sm sm:text-base font-black font-mono text-rose-500">
                  {currentClient.totalRemainingDebt.toLocaleString('vi-VN')} đ
                </p>
              ) : (
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Đã tất toán</span>
                </p>
              )}
            </div>
          </div>

          {/* Lịch sử các gói chụp (Booking History) & Chức năng Xóa Lịch Chụp Chưa Chốt */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#df8653] dark:text-orange-400 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>Danh Sách Lịch Hẹn & Gói Chụp ({currentClient.bookings.length})</span>
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Bạn có thể tùy chỉnh xóa lịch chưa chốt mà không ảnh hưởng hồ sơ khách hàng.
                </p>
              </div>

              {/* Nút thêm show chụp quá khứ */}
              <button
                type="button"
                onClick={() => setIsAddingPastShoot(!isAddingPastShoot)}
                className="px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-[#df8653] dark:text-orange-400 border border-orange-500/30 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="Bổ sung ca chụp hoặc giao dịch thực thu cho khách"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingPastShoot ? 'Hủy Thêm' : 'Thêm Gói Chụp / Giao Dịch'}</span>
              </button>
            </div>

            {/* FORM THÊM GÓI CHỤP MỚI / BỔ SUNG THỰC THU */}
            {isAddingPastShoot && (
              <form onSubmit={handleCreatePastShoot} className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/90 border border-orange-300 dark:border-orange-500/40 space-y-3 animate-fadeIn shadow-sm">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 pb-2">
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#df8653]" />
                    <span>Ghi Nhận Buổi Chụp / Giao Dịch Thực Thu Cho Khách</span>
                  </span>
                  <span className="text-[10px] text-zinc-500">Cộng trực tiếp vào thực thu</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">Tên gói / Buổi chụp:</label>
                    <input
                      type="text"
                      required
                      value={newShootForm.sessionTitle}
                      onChange={e => setNewShootForm(prev => ({ ...prev, sessionTitle: e.target.value }))}
                      placeholder="VD: Gói Chân Dung Doanh Nhân VIP"
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#df8653]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">Loại hình chụp:</label>
                    <select
                      value={newShootForm.sessionType}
                      onChange={e => setNewShootForm(prev => ({ ...prev, sessionType: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#df8653]"
                    >
                      <option value="portrait">Chân dung (Portrait)</option>
                      <option value="wedding">Tiệc cưới (Wedding)</option>
                      <option value="prewedding">Pre-Wedding / Ngoại cảnh</option>
                      <option value="lookbook">Lookbook / Thời trang</option>
                      <option value="event">Sự kiện (Event)</option>
                      <option value="commercial">Thương mại / Quảng cáo</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">Giá gói chụp (đ):</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={newShootForm.packagePrice ? formatCurrencyVND(newShootForm.packagePrice) : ''}
                      onChange={e => {
                        const val = parseCurrencyVND(e.target.value);
                        setNewShootForm(prev => ({
                          ...prev,
                          packagePrice: val,
                          paidAmount: prev.paidAmount === 0 ? val : prev.paidAmount,
                        }));
                      }}
                      placeholder="VD: 5.000.000"
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100 font-bold outline-none focus:border-[#df8653]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">Khách đã thực trả (đ):</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={newShootForm.paidAmount ? formatCurrencyVND(newShootForm.paidAmount) : ''}
                      onChange={e => setNewShootForm(prev => ({ ...prev, paidAmount: parseCurrencyVND(e.target.value) }))}
                      placeholder="VD: 5.000.000"
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">Ngày chụp:</label>
                    <input
                      type="date"
                      required
                      value={newShootForm.eventDate}
                      onChange={e => setNewShootForm(prev => ({ ...prev, eventDate: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 outline-none focus:border-[#df8653]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingPastShoot(false)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-1.5 rounded-xl bg-[#df8653] hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>Lưu & Ghi Nhận Thực Thu</span>
                  </button>
                </div>
              </form>
            )}

            {currentClient.bookings.length === 0 ? (
              <div className="text-center py-8 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 text-zinc-500 text-xs space-y-1">
                <p>Khách hàng hiện chưa có lịch chụp nào (hoặc đã xóa các lịch chưa chốt).</p>
                <p className="text-[11px] text-zinc-400">Bạn có thể bấm "Thêm Gói Chụp / Giao Dịch" để bổ sung lịch sử cho khách.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {currentClient.bookings.map((booking, idx) => {
                  const isEditingThisBooking = editingBookingId === booking.id;
                  const statusConf = STATUS_CONFIG[booking.status] || STATUS_CONFIG.lead || STATUS_CONFIG.cho_coc;
                  const price = Number(booking.packagePrice || 0);
                  const isCompleted = booking.status === 'done' || booking.status === 'hoan_thanh' || booking.status === 'da_tra_file';
                  const isLead = booking.status === 'lead' || booking.status === 'cho_coc';

                  let paid = Number(booking.paidAmount || 0);
                  if (paid === 0) {
                    if (isCompleted) {
                      paid = price;
                    } else if (!isLead && booking.depositAmount) {
                      paid = Number(booking.depositAmount);
                    }
                  }

                  const remaining = Math.max(0, price - paid);

                  return (
                    <div
                      key={booking.id || idx}
                      className={`p-4 rounded-2xl transition-all text-xs space-y-3 ${
                        isEditingThisBooking
                          ? 'bg-orange-50/40 dark:bg-zinc-800/90 border-2 border-[#df8653] shadow-md'
                          : 'bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 hover:border-zinc-300 dark:hover:border-zinc-600'
                      }`}
                    >
                      {/* NẾU ĐANG CHỈNH SỬA BUỔI CHỤP NÀY */}
                      {isEditingThisBooking ? (
                        <div className="space-y-3 animate-fadeIn">
                          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 pb-2">
                            <span className="text-xs font-bold text-[#df8653] dark:text-orange-400 flex items-center gap-1.5">
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Sửa Gói Chụp & Giá Quyết Toán</span>
                            </span>
                            <span className="text-[10px] text-zinc-400">Mã: {booking.id}</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">Tên gói / Tiêu đề:</label>
                              <input
                                type="text"
                                value={bookingForm.sessionTitle}
                                onChange={e => setBookingForm(prev => ({ ...prev, sessionTitle: e.target.value }))}
                                placeholder="VD: Gói Pre-Wedding Ngoại Cảnh"
                                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#df8653]"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">Loại hình chụp:</label>
                              <select
                                value={bookingForm.sessionType}
                                onChange={e => setBookingForm(prev => ({ ...prev, sessionType: e.target.value }))}
                                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#df8653]"
                              >
                                <option value="portrait">Chân dung (Portrait)</option>
                                <option value="wedding">Tiệc cưới (Wedding)</option>
                                <option value="prewedding">Pre-Wedding / Ngoại cảnh</option>
                                <option value="lookbook">Lookbook / Thời trang</option>
                                <option value="event">Sự kiện (Event)</option>
                                <option value="commercial">Thương mại / Quảng cáo</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">Giá chụp / Gói (đ):</label>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={bookingForm.packagePrice ? formatCurrencyVND(bookingForm.packagePrice) : ''}
                                onChange={e => setBookingForm(prev => ({ ...prev, packagePrice: parseCurrencyVND(e.target.value) }))}
                                placeholder="VD: 5.000.000"
                                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100 font-bold outline-none focus:border-[#df8653]"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                                Thực trả (Tính vào doanh thu) (đ):
                              </label>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={bookingForm.paidAmount ? formatCurrencyVND(bookingForm.paidAmount) : ''}
                                onChange={e => setBookingForm(prev => ({ ...prev, paidAmount: parseCurrencyVND(e.target.value) }))}
                                placeholder="VD: 5.000.000"
                                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold outline-none focus:border-emerald-500"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">Tiền cọc (đ):</label>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={bookingForm.depositAmount ? formatCurrencyVND(bookingForm.depositAmount) : ''}
                                onChange={e => setBookingForm(prev => ({ ...prev, depositAmount: parseCurrencyVND(e.target.value) }))}
                                placeholder="VD: 2.000.000"
                                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-mono text-zinc-600 dark:text-zinc-300 outline-none focus:border-zinc-400"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">Ngày chụp:</label>
                              <input
                                type="date"
                                value={bookingForm.eventDate}
                                onChange={e => setBookingForm(prev => ({ ...prev, eventDate: e.target.value }))}
                                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-200 outline-none focus:border-[#df8653]"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                            <button
                              type="button"
                              onClick={() => setEditingBookingId(null)}
                              className="px-3 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold"
                            >
                              Hủy
                            </button>
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={() => handleSaveBooking(booking.id)}
                              className="px-4 py-1.5 rounded-xl bg-[#df8653] hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/20 disabled:opacity-50 cursor-pointer"
                            >
                              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              <span>Lưu Buổi Chụp</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* GIAO DIỆN HIỂN THỊ THẺ BUỔI CHỤP THƯỜNG */
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                                  {booking.sessionTitle || (booking as any).session_title || booking.package_type || `Gói ${booking.sessionType}`}
                                </span>
                                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-orange-500/10 text-[#df8653] dark:text-orange-400 border border-orange-500/20">
                                  {booking.sessionType}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                                <span className="flex items-center gap-1 text-[#df8653] font-medium">
                                  <Calendar className="w-3 h-3" />
                                  {booking.eventDate}
                                </span>
                                {booking.startTime && (
                                  <>
                                    <span className="text-zinc-300 dark:text-zinc-600">•</span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-zinc-400" />
                                      {booking.startTime} - {booking.endTime}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Badge trạng thái, Nút Sửa & Nút Xóa Lịch Chụp */}
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusConf.badgeBg} ${statusConf.textColor} ${statusConf.borderColor}`}
                              >
                                {statusConf.label}
                              </span>

                              {/* Nút sửa buổi chụp */}
                              <button
                                type="button"
                                onClick={() => handleStartEditBooking(booking)}
                                className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-orange-50 dark:hover:bg-zinc-700 text-zinc-600 hover:text-[#df8653] dark:text-zinc-300 dark:hover:text-orange-400 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
                                title="Chỉnh sửa gói chụp và giá tiền"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>

                              {/* NÚT XÓA BUỔI CHỤP (ĐẶC BIỆT LỊCH CHƯA CHỐT) */}
                              <button
                                type="button"
                                onClick={() => setDeletingBooking(booking)}
                                className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
                                title="Xóa lịch chụp này (vẫn giữ thông tin khách hàng)"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Chi tiết tài chính buổi chụp */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-700/60 font-mono text-[11px]">
                            <div className="space-x-3">
                              <span className="text-zinc-500 dark:text-zinc-400">
                                Giá gói: <strong className="text-zinc-800 dark:text-zinc-200 font-bold">{price.toLocaleString('vi-VN')} đ</strong>
                              </span>
                              <span className="text-emerald-600 dark:text-emerald-400">
                                Đã thu: <strong>{paid.toLocaleString('vi-VN')} đ</strong>
                              </span>
                            </div>

                            <div>
                              {remaining > 0 ? (
                                <span className="text-rose-500 font-bold">
                                  Còn nợ: {remaining.toLocaleString('vi-VN')} đ
                                </span>
                              ) : (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Đã tất toán</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Link xem thư báo giá nếu có */}
                          {booking.quoteToken && (
                            <div className="pt-0.5 flex justify-end">
                              <a
                                href={`/quote/${booking.quoteToken}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-[#df8653] hover:text-orange-600 underline font-medium"
                              >
                                <span>Xem thư báo giá</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Drawer Sticky Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-500 dark:bg-rose-950/40 dark:hover:bg-rose-600 border border-rose-200 dark:border-rose-800 text-rose-600 hover:text-white dark:text-rose-300 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
            title="Xóa hoàn toàn hồ sơ khách hàng khỏi danh bạ CRM"
          >
            <Trash2 className="w-4 h-4" />
            <span>Xóa Toàn Bộ Hồ Sơ</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs transition-colors cursor-pointer"
          >
            Đóng Hồ Sơ
          </button>
        </div>

        {/* Modal Xác Nhận Xóa 1 Buổi Chụp Đơn Lẻ (Giữ Nguyên Thông Tin Khách) */}
        {deletingBooking && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1.5">
                <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Xóa Lịch Chụp Này?</h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Bạn có chắc muốn xóa lịch chụp <strong className="text-zinc-900 dark:text-zinc-100">{deletingBooking.sessionTitle || `Gói ${deletingBooking.sessionType}`}</strong> ({deletingBooking.eventDate})?
                </p>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-left mt-2">
                  <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Thông tin khách hàng vẫn được giữ an toàn</span>
                  </p>
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Hồ sơ, tên, số điện thoại, email của khách {currentClient.name} vẫn tiếp tục được lưu trong CRM để bạn chăm sóc tiếp.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingBooking(null)}
                  disabled={isDeletingBooking}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteBooking}
                  disabled={isDeletingBooking}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-rose-900/20"
                >
                  {isDeletingBooking ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang xóa...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xác Nhận Xóa</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Xác Nhận Xóa Toàn Bộ Hồ Sơ Khách Hàng */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1.5">
                <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Xóa Toàn Bộ Hồ Sơ Khách?</h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Bạn có chắc chắn muốn xóa hồ sơ của <strong className="text-zinc-900 dark:text-zinc-100">{currentClient?.name}</strong> khỏi CRM?
                </p>
                {currentClient?.bookings && currentClient.bookings.length > 0 && (
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl p-2.5 mt-2 text-left">
                    Lưu ý: Khách hàng này có {currentClient.bookings.length} lịch chụp. Lịch chụp vẫn được giữ lại để bảo toàn doanh thu và lịch sử studio.
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeletingClient}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteClient}
                  disabled={isDeletingClient}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-rose-900/20"
                >
                  {isDeletingClient ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang xóa...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xác Nhận Xóa</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
