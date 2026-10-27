import React from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { ClayStudioDashboard } from './ClayStudioDashboard';
import { MemberDashboard } from './MemberDashboard';

/**
 * Component Dashboard.jsx - Trang chủ Dashboard thông minh theo RBAC
 * - Manager & Freelancer: Xem được các thẻ Biểu đồ Doanh thu (Revenue Metric Cards & Charts).
 * - Member: Render component <MemberDashboard /> riêng biệt, thay thế biểu đồ doanh thu bằng
 *   "Nhiệm vụ hôm nay" và "Thông báo từ quản lý".
 */
export const Dashboard = (props) => {
  const { role, isMember, accountType } = useWorkspace();

  // Kiểm tra vai trò của người dùng (Đảm bảo studio_admin / manager KHÔNG BAO GIỜ bị nhận diện nhầm thành member)
  const isMemberRole = accountType !== 'studio_admin' && role !== 'manager' && (role === 'member' || accountType === 'studio_member' || isMember);

  if (isMemberRole) {
    return (
      <MemberDashboard
        events={props.events || []}
        onOpenDetailModal={props.onOpenDetailModal}
        onRefreshData={props.onRefreshData}
      />
    );
  }

  return <ClayStudioDashboard {...props} />;
};

export default Dashboard;
