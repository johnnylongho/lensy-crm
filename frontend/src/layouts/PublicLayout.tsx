import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * PublicLayout:
 * Dành riêng cho các route công khai (khách hàng, khách vãng lai, trang báo giá, đăng nhập).
 * Tuyệt đối KHÔNG chứa thanh Menu quản trị của thợ ảnh.
 * Light Mode mặc định cao cấp cho khách xem và duyệt hợp đồng/báo giá.
 */
export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 text-slate-800 font-sans selection:bg-orange-500/20 flex flex-col transition-colors duration-200">
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};
