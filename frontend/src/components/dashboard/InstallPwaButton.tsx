import React, { useState, useEffect } from 'react';
import { Download, CheckCircle2, Smartphone, Monitor, X, Sparkles } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// Global variable để bắt sự kiện beforeinstallprompt ngay cả khi component chưa kịp mount
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    console.log('[PWA] Sự kiện beforeinstallprompt đã được ghi nhận trên window!');
  });
}

export const InstallPwaButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    globalDeferredPrompt
  );
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  useEffect(() => {
    // 1. Kiểm tra trạng thái Standalone (đã chạy dưới dạng App cài đặt)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(Boolean(isStandaloneMode));
    };

    checkStandalone();

    // Đồng bộ prompt nếu đã được bắt toàn cục trước đó
    if (globalDeferredPrompt && !deferredPrompt) {
      setDeferredPrompt(globalDeferredPrompt);
    }

    // 2. Lắng nghe sự kiện beforeinstallprompt trên window
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      globalDeferredPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
      console.log('[PWA] beforeinstallprompt được lưu trữ vào state thành công.');
    };

    // 3. Lắng nghe sự kiện appinstalled khi người dùng cài đặt hoàn tất
    const handleAppInstalled = () => {
      console.log('[PWA] Ứng dụng Lensy đã được cài đặt thành công!');
      setIsInstalled(true);
      setDeferredPrompt(null);
      globalDeferredPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Xử lý khi bấm nút "Cài đặt Lensy"
  const handleInstallClick = async () => {
    const activePrompt = deferredPrompt || globalDeferredPrompt;

    if (activePrompt) {
      console.log('[PWA] Đang kích hoạt hộp thoại cài đặt native...');
      activePrompt.prompt();
      const choiceResult = await activePrompt.userChoice;
      console.log('[PWA] Quyết định của người dùng:', choiceResult.outcome);

      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      globalDeferredPrompt = null;
    } else {
      // Khi trình duyệt chưa bắn prompt (Safari, Firefox hoặc đã dismiss), mở bảng hướng dẫn
      console.log('[PWA] Chưa có beforeinstallprompt, mở bảng hướng dẫn cài đặt thủ công.');
      setShowGuideModal(true);
    }
  };

  // Trạng thái: Đã cài đặt và đang chạy ở chế độ App
  if (isStandalone || isInstalled) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-sm">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>Lensy App Đã Cài Đặt</span>
      </div>
    );
  }

  return (
    <>
      {/* Nút Cài đặt Lensy (Install App) */}
      <button
        type="button"
        onClick={handleInstallClick}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/25 transition-all hover:scale-[1.03] active:scale-[0.98]"
        title="Cài đặt Lensy thành ứng dụng máy tính hoặc điện thoại"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Cài đặt Lensy (Install App)</span>
        {deferredPrompt && (
          <span className="w-2 h-2 rounded-full bg-emerald-700 animate-ping" />
        )}
      </button>

      {/* Modal hướng dẫn cài đặt khi trình duyệt không kích hoạt prompt tự động */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 p-6 space-y-4 shadow-2xl text-slate-100">
            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-base text-white">Cài đặt Ứng Dụng Lensy</h4>
                <p className="text-xs text-slate-400">Trải nghiệm như ứng dụng native không qua App Store</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
              <div className="space-y-1">
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5" /> Trên Máy tính (Chrome / Edge):
                </span>
                <p className="text-slate-400 leading-relaxed pl-5">
                  1. Nhìn vào thanh địa chỉ web (URL) ở góc trên bên phải.<br />
                  2. Bấm vào biểu tượng <strong>"Cài đặt Lensy"</strong> (hình máy tính có mũi tên xuống).<br />
                  3. Hoặc bấm vào menu <strong>⋮ (3 chấm)</strong> ➜ chọn <strong>"Cài đặt Lensy..."</strong>.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-1">
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" /> Trên iPhone / iPad (Safari):
                </span>
                <p className="text-slate-400 leading-relaxed pl-5">
                  1. Nhấn nút <strong>Chia sẻ (Share)</strong> ở thanh dưới cùng.<br />
                  2. Cuộn xuống và chọn <strong>"Thêm vào Màn hình chính" (Add to Home Screen)</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
};
