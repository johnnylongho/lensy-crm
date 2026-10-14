import React, { useState, useEffect } from 'react';
import { WifiOff, Download, X, Smartphone, Check } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Bắt sự kiện beforeinstallprompt (Chrome / Android / Desktop)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Chỉ hiển thị nếu chưa cài đặt và chưa đóng trong session này
      if (!sessionStorage.getItem('lensy_pwa_dismissed')) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Lắng nghe khi app đã cài đặt xong
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShowInstallPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismissInstall = () => {
    setShowInstallPrompt(false);
    sessionStorage.setItem('lensy_pwa_dismissed', 'true');
  };

  return (
    <>
      {/* 1. Offline Mode Sticky Banner */}
      {isOffline && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-600 to-rose-600 text-white px-4 py-2.5 shadow-lg flex items-center justify-between text-xs animate-fadeIn"
        >
          <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
            <WifiOff className="w-4 h-4 flex-shrink-0 animate-pulse text-amber-200" />
            <div className="flex-1 font-medium">
              <span className="font-bold">Đang ngoại tuyến:</span> Bạn đang mất kết nối Internet.
              Lensy đang kích hoạt chế độ xem dự phòng (Offline Read-only) từ dữ liệu đã lưu trong máy.
            </div>
          </div>
        </aside>
      )}

      {/* 2. PWA Install Prompt Banner (Mobile & Desktop) */}
      {showInstallPrompt && !isOffline && (
        <aside
          role="region"
          aria-label="Cài đặt ứng dụng"
          className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-50 bg-slate-900/95 dark:bg-zinc-900/95 backdrop-blur-md border border-amber-500/40 rounded-2xl p-4 shadow-2xl text-xs text-white animate-slideUp flex flex-col gap-2.5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center p-1.5 flex-shrink-0">
                <img src="/lensy-logo.png" alt="Lensy Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Cài đặt Lensy App</h4>
                <p className="text-[11px] text-slate-400">
                  Trải nghiệm mượt mà toàn màn hình, mở nhanh không cần gõ web
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismissInstall}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              aria-label="Bỏ qua"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
            <button
              type="button"
              onClick={handleDismissInstall}
              className="flex-1 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors cursor-pointer text-center"
            >
              Để sau
            </button>
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Cài Đặt Ngay</span>
            </button>
          </div>
        </aside>
      )}
    </>
  );
};
