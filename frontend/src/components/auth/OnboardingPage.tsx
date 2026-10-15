import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { ThemeToggle } from '../common/ThemeToggle';
import {
  Camera,
  Building2,
  Users,
  Crown,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const { user } = useAuth();
  const { refreshWorkspace, switchAccountType } = useWorkspace();
  const navigate = useNavigate();

  // Selected Option: null | 'freelancer' | 'manager' | 'member'
  const [selectedRole, setSelectedRole] = useState<'freelancer' | 'manager' | 'member' | null>(null);

  // Form inputs
  const [studioName, setStudioName] = useState('');
  const [studioPhone, setStudioPhone] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 1. Xử lý Thẻ 1: Freelancer
  const handleSelectFreelancer = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      if (isSupabaseConfigured && user) {
        // Cập nhật bảng users
        await supabase
          .from('users')
          .update({
            role: 'freelancer',
            studio_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        // Cập nhật metadata
        await supabase.auth.updateUser({
          data: {
            role: 'freelancer',
            account_type: 'freelancer',
          },
        });
      }

      if (switchAccountType) {
        switchAccountType('freelancer');
      }
      await refreshWorkspace();
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('Lỗi khi thiết lập Freelancer:', err);
      setErrorMessage(err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Xử lý Thẻ 2: Chủ Studio / Quản lý
  const handleCreateStudio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studioName.trim()) {
      setErrorMessage('Vui lòng nhập Tên Studio của bạn.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const generatedInviteCode = `MIRMIA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      if (isSupabaseConfigured && user) {
        // Tạo studio mới
        const { data: newStudio, error: studioError } = await supabase
          .from('studios')
          .insert({
            name: studioName.trim(),
            owner_id: user.id,
            invite_code: generatedInviteCode,
            tier: 'standard',
            verified_status: false,
          })
          .select()
          .single();

        if (studioError) throw studioError;

        // Cập nhật vai trò manager & studio_id cho user
        await supabase
          .from('users')
          .update({
            role: 'manager',
            studio_id: newStudio.id,
            studio_name: studioName.trim(),
            phone: studioPhone.trim() || undefined,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        // Cập nhật user_metadata
        await supabase.auth.updateUser({
          data: {
            role: 'manager',
            account_type: 'studio_admin',
            studio_name: studioName.trim(),
            studio_id: newStudio.id,
          },
        });
      }

      setSuccessMessage(`Đã tạo Studio "${studioName.trim()}" thành công!`);
      if (switchAccountType) {
        switchAccountType('manager');
      }
      await refreshWorkspace();
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 700);
    } catch (err: any) {
      console.error('Lỗi tạo Studio:', err);
      setErrorMessage(err.message || 'Không thể tạo Studio. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Xử lý Thẻ 3: Thành viên Studio (Nhập mã mời)
  const handleJoinStudio = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = inviteCode.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMessage('Vui lòng nhập Mã tham gia Studio do Quản lý cung cấp.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      let targetStudioId: string | null = null;
      let targetStudioName = 'Studio Đối Tác';

      if (isSupabaseConfigured && user) {
        // Tra cứu studio theo invite_code
        const { data: studio, error: findError } = await supabase
          .from('studios')
          .select('id, name')
          .eq('invite_code', cleanCode)
          .maybeSingle();

        if (findError) throw findError;

        if (!studio) {
          throw new Error(`Mã mời "${cleanCode}" không tồn tại hoặc đã hết hạn. Vui lòng kiểm tra lại.`);
        }

        targetStudioId = studio.id;
        targetStudioName = studio.name;

        // Gán studio_id và role = 'member' cho user
        await supabase
          .from('users')
          .update({
            role: 'member',
            studio_id: targetStudioId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        // Bổ sung vào bảng studio_members
        await supabase
          .from('studio_members')
          .upsert({
            studio_id: targetStudioId,
            user_id: user.id,
            role: 'photographer',
            status: 'approved',
          });

        // Cập nhật metadata
        await supabase.auth.updateUser({
          data: {
            role: 'member',
            account_type: 'studio_member',
            studio_id: targetStudioId,
            studio_name: targetStudioName,
          },
        });
      }

      setSuccessMessage(`Đã gia nhập thành công Studio "${targetStudioName}"!`);
      if (switchAccountType) {
        switchAccountType('member');
      }
      await refreshWorkspace();
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 700);
    } catch (err: any) {
      console.error('Lỗi tham gia Studio:', err);
      setErrorMessage(err.message || 'Mã tham gia không hợp lệ.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf7f5] dark:bg-[#080c14] text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-[#df8653] selection:text-white transition-colors duration-300 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-15%] left-[20%] w-[500px] h-[500px] bg-gradient-to-br from-[#df8653]/15 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[10%] w-[450px] h-[450px] bg-gradient-to-tl from-amber-500/10 to-transparent rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#df8653] to-amber-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-500/20">
            L
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Lensy CRM
            </span>
            <span className="block text-[10px] text-slate-400 font-mono tracking-widest uppercase">
              Onboarding Experience
            </span>
          </div>
        </div>

        <ThemeToggle size="sm" />
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 z-10 flex-1 flex flex-col justify-center">
        {/* Title & Introduction */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2.5">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/10 text-[#df8653] dark:text-orange-400 border border-orange-500/20 inline-block">
            Bước khởi tạo vai trò
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Bạn sử dụng Lensy với vai trò nào?
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Chọn mô hình hoạt động để giao diện và tính năng được cá nhân hóa tối ưu nhất cho bạn.
          </p>
        </div>

        {/* Thông báo Lỗi / Thành công */}
        {errorMessage && (
          <div className="max-w-xl mx-auto mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2.5 shadow-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="max-w-xl mx-auto mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2.5 shadow-sm">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* GIAO DIỆN CHÍNH: 3 THẺ LỰA CHỌN HOẶC FORM TƯƠNG ỨNG */}
        <AnimatePresence mode="wait">
          {!selectedRole ? (
            /* =============================================================== */
            /* 3 THẺ (CARDS) LỚN THEO YÊU CẦU                                   */
            /* =============================================================== */
            <motion.div
              key="cards-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* THẺ 1: Thợ ảnh Tự do (Freelancer) */}
              <div
                onClick={handleSelectFreelancer}
                className="group relative p-7 rounded-3xl bg-white/70 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 hover:border-amber-500/50 dark:hover:border-amber-500/50 shadow-lg shadow-black/5 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 flex flex-col justify-between cursor-pointer active:scale-[0.98]"
              >
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-500 flex items-center justify-center text-white shadow-md shadow-amber-500/30 group-hover:scale-110 transition-transform">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Cá nhân độc lập
                    </span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                      Thợ ảnh Tự do (Freelancer)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Dành cho nhiếp ảnh gia hoạt động solo. Quản lý lịch chụp cá nhân, danh bạ khách hàng, thiết bị và doanh thu riêng mà không cần kết nối studio.
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    Bắt đầu ngay <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">1-Click</span>
                </div>
              </div>

              {/* THẺ 2: Chủ Studio / Quản lý (Manager) */}
              <div
                onClick={() => setSelectedRole('manager')}
                className="group relative p-7 rounded-3xl bg-white/70 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 hover:border-orange-500/50 dark:hover:border-orange-500/50 shadow-lg shadow-black/5 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300 flex flex-col justify-between cursor-pointer active:scale-[0.98]"
              >
                <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                  Phổ Biến Nhất
                </div>
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-[#df8653] flex items-center justify-center text-white shadow-md shadow-orange-500/30 group-hover:scale-110 transition-transform">
                    <Crown className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#df8653] dark:text-orange-400">
                      Doanh nghiệp & Ekip
                    </span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                      Chủ Studio / Quản lý
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Xây dựng thương hiệu Studio, toàn quyền quản trị (CRUD), quản lý phân công ekip thợ, theo dõi toàn diện doanh thu tài chính và bảng giá.
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#df8653] dark:text-orange-400 flex items-center gap-1">
                    Nhập tên Studio <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Quản trị toàn diện</span>
                </div>
              </div>

              {/* THẺ 3: Thành viên Studio (Member) */}
              <div
                onClick={() => setSelectedRole('member')}
                className="group relative p-7 rounded-3xl bg-white/70 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-lg shadow-black/5 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 flex flex-col justify-between cursor-pointer active:scale-[0.98]"
              >
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                    <Users className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Thành viên Ekip
                    </span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                      Thành viên Studio
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Dành cho thợ ảnh, thợ makeup, trợ lý hoặc retoucher thuộc một studio. Nhập mã tham gia để xem ca chụp phân công và thu nhập cá nhân.
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    Nhập mã tham gia <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Gia nhập Studio</span>
                </div>
              </div>
            </motion.div>
          ) : selectedRole === 'manager' ? (
            /* =============================================================== */
            /* FORM NHẬP TÊN STUDIO (CHO ROLE MANAGER)                         */
            /* =============================================================== */
            <motion.div
              key="form-manager"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md mx-auto w-full p-8 rounded-3xl bg-white/80 dark:bg-[#121824]/90 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 shadow-2xl space-y-6"
            >
              <button
                type="button"
                onClick={() => setSelectedRole(null)}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Chọn vai trò khác
              </button>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-bold mb-2">
                  <Crown className="w-4 h-4" /> Chủ Studio / Quản Lý
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Thiết Lập Studio Của Bạn
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Nhập thông tin cơ bản để tạo workspace và mã mời cho đội ngũ của bạn.
                </p>
              </div>

              <form onSubmit={handleCreateStudio} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tên Studio / Thương Hiệu *
                  </label>
                  <input
                    type="text"
                    required
                    value={studioName}
                    onChange={e => setStudioName(e.target.value)}
                    placeholder="VD: Mirmia Studio & Academy"
                    className="w-full px-4 py-3 min-h-[44px] rounded-2xl bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-[#df8653] focus:ring-2 focus:ring-[#df8653]/20 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Số Điện Thoại / Hotline Studio
                  </label>
                  <input
                    type="tel"
                    value={studioPhone}
                    onChange={e => setStudioPhone(e.target.value)}
                    placeholder="VD: 0901234567"
                    className="w-full px-4 py-3 min-h-[44px] rounded-2xl bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-[#df8653] focus:ring-2 focus:ring-[#df8653]/20 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 min-h-[44px] rounded-2xl bg-gradient-to-r from-orange-500 via-[#df8653] to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang khởi tạo Studio...</span>
                    </>
                  ) : (
                    <>
                      <span>Khởi Tạo Studio & Bắt Đầu</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            /* =============================================================== */
            /* FORM NHẬP MÃ THAM GIA STUDIO (CHO ROLE MEMBER)                  */
            /* =============================================================== */
            <motion.div
              key="form-member"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md mx-auto w-full p-8 rounded-3xl bg-white/80 dark:bg-[#121824]/90 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 shadow-2xl space-y-6"
            >
              <button
                type="button"
                onClick={() => setSelectedRole(null)}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Chọn vai trò khác
              </button>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-2">
                  <Users className="w-4 h-4" /> Thành Viên Studio
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Gia Nhập Studio Của Bạn
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Nhập Mã mời (Invite Code) do Chủ Studio hoặc Quản lý cấp để đồng bộ lịch chụp và nhận phân công.
                </p>
              </div>

              <form onSubmit={handleJoinStudio} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Mã Tham Gia Studio (Invite Code) *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={inviteCode}
                      onChange={e => setInviteCode(e.target.value.toUpperCase())}
                      placeholder="VD: MIRMIA-VIP88"
                      className="w-full pl-11 pr-4 py-3 min-h-[44px] rounded-2xl bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/10 font-mono text-xs sm:text-sm text-slate-900 dark:text-white uppercase outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all tracking-wider"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Mẹo demo: Bạn có thể nhập mã <code>MIRMIA-VIP88</code> hoặc mã mời studio của bạn.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 min-h-[44px] rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang kiểm tra mã mời...</span>
                    </>
                  ) : (
                    <>
                      <span>Xác Nhận Tham Gia</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-6 text-xs text-slate-400 dark:text-slate-500">
        Lensy CRM • Hệ Thống Phân Quyền Đa Khách Hàng (Multi-Tenant RBAC)
      </footer>
    </div>
  );
};
