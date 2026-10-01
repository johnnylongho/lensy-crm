import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface Props {
  children?: React.ReactElement;
}

export const PrivateRoute: React.FC<Props> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-mono">Đang kiểm tra bảo mật Lensy...</p>
      </div>
    );
  }

  if (!user) {
    // Chuyển hướng về trang Login nếu chưa đăng nhập, kèm theo đường dẫn ban đầu để redirect ngược lại sau khi login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
};

