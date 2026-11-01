import React, { useEffect } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';

interface SuperAdminRouteProps {
  children?: React.ReactElement;
  redirectTo?: string;
}

/**
 * SuperAdminRoute: Lớp bảo vệ định tuyến cấp cao (Super Admin URL Protection Guard)
 * Ngăn chặn tuyệt đối mọi tài khoản không phải Super Admin (kể cả studio_admin, studio_member, freelancer)
 * truy cập vào phân hệ /dashboard/super-admin.
 * Nếu vi phạm, đá ngay về /dashboard kèm Toast thông báo "Từ chối truy cập (Access Denied)".
 */
export const SuperAdminRoute: React.FC<SuperAdminRouteProps> = ({
  children,
  redirectTo = '/dashboard',
}) => {
  const { user, loading: authLoading } = useAuth();
  const { accountType, isLoading: workspaceLoading } = useWorkspace();
  const location = useLocation();

  // ĐIỀU KIỆN TUYỆT ĐỐI: Chỉ duy nhất super_admin hoặc email master johnnyho1705@gmail.com
  const isSuperAdmin = Boolean(
    (user as any)?.account_type === 'super_admin' ||
    user?.user_metadata?.account_type === 'super_admin' ||
    (accountType as string) === 'super_admin' ||
    user?.email === 'johnnyho1705@gmail.com'
  );

  useEffect(() => {
    if (!authLoading && !workspaceLoading && user && !isSuperAdmin) {
      console.warn(
        `[Security Alert - Access Denied] Chặn truy cập trái phép vào ${location.pathname} từ tài khoản: ${user.email} (Role: ${accountType}).`
      );

      // Kích hoạt Toast thông báo lỗi tới hệ thống
      const errorPayload = {
        type: 'error',
        text: 'Từ chối truy cập (Access Denied): Bạn không có quyền quản trị cấp cao Super Admin.',
      };

      try {
        sessionStorage.setItem('lensy_toast', JSON.stringify(errorPayload));
      } catch (_) {}

      window.dispatchEvent(
        new CustomEvent('lensy:toast', {
          detail: errorPayload,
        })
      );
    }
  }, [authLoading, workspaceLoading, user, isSuperAdmin, location.pathname, accountType]);

  if (authLoading || workspaceLoading) {
    return (
      <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-mono">Đang kiểm tra quyền hạn Super Admin...</p>
      </div>
    );
  }

  // 1. Nếu chưa đăng nhập -> Chuyển về /login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Nếu không phải Super Admin -> Lập tức đá về /dashboard với flash error state
  if (!isSuperAdmin) {
    return (
      <Navigate
        to={redirectTo}
        state={{
          error: 'Từ chối truy cập (Access Denied): Bạn không có quyền quản trị cấp cao Super Admin.',
        }}
        replace
      />
    );
  }

  return children ? children : <Outlet />;
};

export default SuperAdminRoute;
