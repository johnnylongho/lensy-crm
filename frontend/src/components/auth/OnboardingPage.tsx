import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { ThemeToggle } from '../common/ThemeToggle';
import {
  Camera,
  Crown,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  MapPin,
  Globe,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Check,
  Info,
} from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const { user } = useAuth();
  const { refreshWorkspace, switchAccountType } = useWorkspace();
  const navigate = useNavigate();

  // 1 trong 3 mô hình hoạt động loại trừ lẫn nhau (Mutually Exclusive)
  const [selectedRole, setSelectedRole] = useState<'freelancer' | 'manager' | 'member' | null>('freelancer');

  // Dynamic Form inputs cho Chủ Studio / Quản lý
  const [studioName, setStudioName] = useState('');
  const [studioAddress, setStudioAddress] = useState('');
  const [studioSocialLink, setStudioSocialLink] = useState('');

  // Dynamic Form inputs cho Thành viên Studio (Ekip)
  const [inviteCode, setInviteCode] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 1. Xử lý Hạng mục 1: Freelancer (Thợ ảnh tự do)
  const handleSelectFreelancer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

      setSuccessMessage('Đã thiết lập tài khoản Freelancer thành công! Đang chuyển hướng...');
      if (switchAccountType) {
        switchAccountType('freelancer');
      }
      await refreshWorkspace();
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 500);
    } catch (err: any) {
      console.error('Lỗi khi thiết lập Freelancer:', err);
      setErrorMessage(err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Xử lý Hạng mục 2: Chủ Studio / Quản lý
  const handleCreateStudio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studioName.trim()) {
      setErrorMessage('Vui lòng nhập Tên Studio của bạn.');
      return;
    }
    if (!studioAddress.trim()) {
      setErrorMessage('Vui lòng nhập Địa chỉ Studio.');
      return;
    }
    if (!studioSocialLink.trim()) {
      setErrorMessage('Vui lòng nhập Fanpage / Link Website / Instagram của Studio.');
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
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        // Cập nhật user_metadata
        await supabase.auth.updateUser({
          data: {
            role: 'manager',
            account_type: 'studio_admin',
            studio_name: studioName.trim(),
            studio_address: studioAddress.trim(),
            studio_social_link: studioSocialLink.trim(),
            studio_id: newStudio.id,
          },
        });
      }

      setSuccessMessage(`Đã khởi tạo Studio "${studioName.trim()}" thành công! Đang chuyển hướng...`);
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

  // 3. Xử lý Hạng mục 3: Thành viên Studio (Ekip)
  const handleJoinStudio = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = inviteCode.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMessage('Vui lòng nhập Mã mời Ekip (Invite Code) do Chủ Studio cung cấp.');
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

        // Bổ sung vào bảng studio_members với trạng thái pending chờ phê duyệt
        await supabase
          .from('studio_members')
          .upsert({
            studio_id: targetStudioId,
            user_id: user.id,
            role: 'photographer',
            status: 'pending',
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

      setSuccessMessage(`Đã gửi yêu cầu gia nhập Studio "${targetStudioName}"! Đang chuyển hướng...`);
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
    <div className="min-h-screen bg-[#faf7f5] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-white transition-colors duration-300 relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-[-15%] left-[20%] w-[500px] h-[500px] bg-gradient-to-br from-amber-500/15 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[10%] w-[450px] h-[450px] bg-gradient-to-tl from-orange-500/10 to-transparent rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-amber-500/20">
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
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8 z-10 flex-1 flex flex-col justify-center">
        {/* Title & Introduction */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10 space-y-2.5">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 inline-block">
            Bước khởi tạo vai trò
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Bạn sử dụng Lensy với vai trò nào?
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Chọn 1 trong 3 mô hình hoạt động để giao diện và tính năng được cá nhân hóa tối ưu nhất cho bạn.
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

        {/* =================================================================== */}
        {/* 1. QUY TẮC CHỌN 1 TRONG 3 HẠNG MỤC (MUTUALLY EXCLUSIVE CARDS)        */}
        {/* =================================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* HẠNG MỤC 1: Freelancer (Thợ ảnh tự do) */}
          <div
            onClick={() => {
              setSelectedRole('freelancer');
              setErrorMessage(null);
            }}
            className={`group relative p-6 rounded-3xl backdrop-blur-xl border transition-all duration-300 flex flex-col justify-between cursor-pointer active:scale-[0.99] ${
              selectedRole === 'freelancer'
                ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500 shadow-xl shadow-amber-500/10 ring-2 ring-amber-500/30'
                : 'bg-white/70 dark:bg-zinc-900/60 hover:bg-white dark:hover:bg-zinc-900/90 border-slate-200/80 dark:border-white/10 hover:border-amber-500/40 shadow-sm'
            }`}
          >
            {/* Selection Radio / Check Indicator */}
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-500 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
                <Camera className="w-6 h-6 text-slate-950" />
              </div>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                  selectedRole === 'freelancer'
                    ? 'bg-amber-500 border-amber-500 text-slate-950'
                    : 'border-slate-300 dark:border-zinc-700 bg-transparent'
                }`}
              >
                {selectedRole === 'freelancer' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Hạng mục 1
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Freelancer (Thợ ảnh tự do)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Nhiếp ảnh gia hoạt động solo. Toàn quyền quản lý lịch chụp, danh bạ khách hàng và dòng tiền cá nhân.
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-[11px] font-bold text-amber-600 dark:text-amber-400">
              <span>Độc lập • Tự do</span>
              <span className="text-[10px] font-mono text-slate-400">Không cần Studio</span>
            </div>
          </div>

          {/* HẠNG MỤC 2: Chủ Studio / Quản lý */}
          <div
            onClick={() => {
              setSelectedRole('manager');
              setErrorMessage(null);
            }}
            className={`group relative p-6 rounded-3xl backdrop-blur-xl border transition-all duration-300 flex flex-col justify-between cursor-pointer active:scale-[0.99] ${
              selectedRole === 'manager'
                ? 'bg-orange-500/10 dark:bg-orange-500/15 border-orange-500 shadow-xl shadow-orange-500/10 ring-2 ring-orange-500/30'
                : 'bg-white/70 dark:bg-zinc-900/60 hover:bg-white dark:hover:bg-zinc-900/90 border-slate-200/80 dark:border-white/10 hover:border-orange-500/40 shadow-sm'
            }`}
          >
            {/* Tag Phổ biến */}
            <div className="absolute -top-3 right-5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[9px] font-black uppercase tracking-wider shadow-sm">
              Doanh Nghiệp
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                <Crown className="w-6 h-6" />
              </div>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                  selectedRole === 'manager'
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'border-slate-300 dark:border-zinc-700 bg-transparent'
                }`}
              >
                {selectedRole === 'manager' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                Hạng mục 2
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Chủ Studio / Quản lý
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Xây dựng thương hiệu Studio, phân công ekip, cấp mã mời và theo dõi toàn diện doanh thu tài chính.
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-[11px] font-bold text-orange-600 dark:text-orange-400">
              <span>Quản trị toàn diện</span>
              <span className="text-[10px] font-mono text-slate-400">Xác thực Studio</span>
            </div>
          </div>

          {/* HẠNG MỤC 3: Thành viên Studio (Ekip) */}
          <div
            onClick={() => {
              setSelectedRole('member');
              setErrorMessage(null);
            }}
            className={`group relative p-6 rounded-3xl backdrop-blur-xl border transition-all duration-300 flex flex-col justify-between cursor-pointer active:scale-[0.99] ${
              selectedRole === 'member'
                ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/30'
                : 'bg-white/70 dark:bg-zinc-900/60 hover:bg-white dark:hover:bg-zinc-900/90 border-slate-200/80 dark:border-white/10 hover:border-emerald-500/40 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <Users className="w-6 h-6" />
              </div>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                  selectedRole === 'member'
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-slate-300 dark:border-zinc-700 bg-transparent'
                }`}
              >
                {selectedRole === 'member' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Hạng mục 3
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Thành viên Studio (Ekip)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Thợ ảnh, makeup, trợ lý hoặc retoucher thuộc một studio. Nhập mã mời để nhận ca chụp và thù lao.
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <span>Gia nhập Ekip</span>
              <span className="text-[10px] font-mono text-slate-400">Có mã mời</span>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 2. LUỒNG FORM ĐỘNG DƯỚI LỰA CHỌN (DYNAMIC SUB-FORMS)                */}
        {/* =================================================================== */}
        <div className="mt-8">
          <AnimatePresence mode="wait">
            {/* SUB-FORM 1: FREELANCER */}
            {selectedRole === 'freelancer' && (
              <motion.div
                key="subform-freelancer"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="max-w-2xl mx-auto w-full p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-amber-500/30 shadow-xl space-y-5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      Xác Nhận Vai Trò: Freelancer (Thợ ảnh tự do)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Khởi tạo ngay mà không cần cấu hình phức tạp
                    </p>
                  </div>
                </div>

                {/* Thông tin tóm tắt theo quy tắc nghiệp vụ */}
                <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/20 text-slate-800 dark:text-zinc-200 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-300 leading-relaxed">
                      Bạn hoạt động độc lập, toàn quyền quản lý lịch chụp và dòng tiền cá nhân.
                    </p>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 pl-6 leading-relaxed">
                    Hệ thống sẽ tự động cấu hình giao diện Lensy Command Center theo chế độ Solo. Bạn không cần nhập mã mời hay thông tin Studio, và có thể kết nối với Studio bất kỳ lúc nào trong phần Cài đặt.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSelectFreelancer}
                  disabled={isLoading}
                  className="w-full py-3.5 min-h-[44px] rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang thiết lập...</span>
                    </>
                  ) : (
                    <>
                      <span>Bắt Đầu Với Vai Trò Freelancer</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {/* SUB-FORM 2: CHỦ STUDIO / QUẢN LÝ */}
            {selectedRole === 'manager' && (
              <motion.div
                key="subform-manager"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="max-w-2xl mx-auto w-full p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-orange-500/30 shadow-xl space-y-6"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      Thông Tin Xác Thực Studio
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Thiết lập hồ sơ thương hiệu và tạo workspace cho đội ngũ
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCreateStudio} className="space-y-4">
                  {/* Ô 1: Tên Studio * */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-orange-500" />
                      <span>Tên Studio *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={studioName}
                      onChange={e => setStudioName(e.target.value)}
                      placeholder="VD: MIRMIA STUDIO & ACADEMY"
                      className="w-full px-4 py-3 min-h-[44px] rounded-2xl bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-zinc-800 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder-slate-400"
                    />
                  </div>

                  {/* Ô 2: Địa chỉ Studio * */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-orange-500" />
                      <span>Địa chỉ Studio *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={studioAddress}
                      onChange={e => setStudioAddress(e.target.value)}
                      placeholder="VD: 123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh"
                      className="w-full px-4 py-3 min-h-[44px] rounded-2xl bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-zinc-800 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder-slate-400"
                    />
                  </div>

                  {/* Ô 3: Fanpage / Link Website / Instagram * */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-orange-500" />
                      <span>Fanpage / Link Website / Instagram *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={studioSocialLink}
                      onChange={e => setStudioSocialLink(e.target.value)}
                      placeholder="VD: https://facebook.com/mirmiastudio hoặc https://mirmia.vn"
                      className="w-full px-4 py-3 min-h-[44px] rounded-2xl bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-zinc-800 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder-slate-400"
                    />
                  </div>

                  {/* Thông báo nhỏ theo yêu cầu nghiệp vụ */}
                  <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300 text-xs flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-orange-500" />
                    <span className="leading-relaxed">
                      Thông tin này dùng để xác thực doanh nghiệp, giúp hệ thống cấp mã mời ekip và hiển thị chuẩn nhận diện thương hiệu.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 min-h-[44px] rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-orange-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
            )}

            {/* SUB-FORM 3: THÀNH VIÊN STUDIO (EKIP) */}
            {selectedRole === 'member' && (
              <motion.div
                key="subform-member"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="max-w-2xl mx-auto w-full p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-emerald-500/30 shadow-xl space-y-6"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      Gia Nhập Studio Đã Có Sẵn
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Kết nối vào Studio để nhận lịch chụp và quyết toán thù lao
                    </p>
                  </div>
                </div>

                <form onSubmit={handleJoinStudio} className="space-y-4">
                  {/* Ô nhập Mã mời Ekip (Invite Code) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Mã mời Ekip (Invite Code) *</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={inviteCode}
                        onChange={e => setInviteCode(e.target.value.toUpperCase())}
                        placeholder="VD: MIRMIA-VIP88"
                        className="w-full px-4 py-3 min-h-[44px] rounded-2xl bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-zinc-800 font-mono text-xs sm:text-sm text-slate-900 dark:text-white uppercase outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all tracking-wider placeholder-slate-400"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Mẹo: Nhập mã mời do Chủ Studio cung cấp (hoặc thử mã demo: <code className="text-emerald-500 font-bold">MIRMIA-VIP88</code>).
                    </p>
                  </div>

                  {/* Thông báo nhỏ theo yêu cầu nghiệp vụ */}
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2.5">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                    <span className="leading-relaxed">
                      Tài khoản của bạn sẽ cần được Chủ Studio phê duyệt (Xác thực) trước khi có thể nhận lịch phân công.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 min-h-[44px] rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang kiểm tra mã mời...</span>
                      </>
                    ) : (
                      <>
                        <span>Gia Nhập Studio & Tiếp Tục</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-6 text-xs text-slate-400 dark:text-slate-500">
        Lensy CRM • Hệ Thống Phân Quyền Đa Khách Hàng (Multi-Tenant RBAC)
      </footer>
    </div>
  );
};

export default OnboardingPage;
