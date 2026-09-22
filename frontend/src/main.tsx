import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Tự động đăng ký Service Worker ngay khi ứng dụng khởi chạy
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('[PWA] Có bản cập nhật mới. Đang nạp...');
    updateSW(true);
  },
  onOfflineReady() {
    console.log('[PWA] Lensy đã sẵn sàng hoạt động ngoại tuyến (Offline Ready)!');
  },
  immediate: true,
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
