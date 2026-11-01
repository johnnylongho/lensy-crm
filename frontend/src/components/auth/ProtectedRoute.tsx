import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth, AccountType } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';

interface ProtectedRouteProps {
  children?: React.ReactElement;
  disallowFreelancer?: boolean;
  allowedAccountTypes?: AccountType[];
  redirectTo?: string;
}

/**
 * ProtectedRoute: Lớp bảo vệ định tuyến nghiêm ngặt (Strict RBAC Routing)
 * Ngăn chặn hoàn toàn việc tài khoản Freelancer cố tình truy cập vào các phân hệ Quản lý Studio
 * (/dashboard/packages, /dashboard/payroll, /dashboard/gears, /dashboard/studio-settings)
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  disallowFreelancer = true,
  allowedAccountTypes,
  redirectTo = '/dashboard',
}) => {
  const { user, loading: authLoading } = useAuth();
  const { accountType, isFreelancer, isLoading: workspaceLoading } = useWorkspace();
  const location = useLocation();

  if (authLoading || workspaceLoading) {
    return (
      <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-mono">Đang kiểm tra bảo mật & quyền phân hệ Lensy...</p>
      </div>
    );
  }

  // 1. Kiểm tra xác thực (Authentication)
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Kiểm tra phân quyền dựa trên account_type thực tế
  const actualAccountType = accountType || (user.user_metadata?.account_type as AccountType) || 'freelancer';

  // Nếu route cấm Freelancer và tài khoản hiện tại là Freelancer -> Chuyển hướng ngay về Dashboard Solo
  if (disallowFreelancer && (actualAccountType === 'freelancer' || isFreelancer)) {
    console.warn(`[Strict RBAC] Chặn truy cập trái phép vào ${location.pathname} từ tài khoản Freelancer (${user.email}). Redirecting to /dashboard.`);
    return <Navigate to={redirectTo} replace />;
  }

  // Nếu có danh sách các account_type cụ thể được phép
  if (allowedAccountTypes && allowedAccountTypes.length > 0 && !allowedAccountTypes.includes(actualAccountType)) {
    console.warn(`[Strict RBAC] Quyền truy cập không hợp lệ vào ${location.pathname}. Yêu cầu: ${allowedAccountTypes.join(', ')}. Thực tế: ${actualAccountType}.`);
    return <Navigate to={redirectTo} replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
