import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * PublicLayout:
 * Dành riêng cho các route công khai (khách hàng, khách vãng lai, trang báo giá, đăng nhập).
 * Tuyệt đối KHÔNG chứa thanh Menu quản trị của thợ ảnh.
 */
export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col">
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};
