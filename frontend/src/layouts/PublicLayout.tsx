import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * PublicLayout:
 * Dành riêng cho các route công khai (khách hàng, khách vãng lai, trang báo giá, đăng nhập).
 * Tuyệt đối KHÔNG chứa thanh Menu quản trị của thợ ảnh.
 */
export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#090a0f] dark:text-zinc-100 flex flex-col transition-colors duration-200">
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};
