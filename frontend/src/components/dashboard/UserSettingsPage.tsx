import React from 'react';
import { SettingsPage } from './SettingsPage';

/**
 * UserSettingsPage:
 * Alias đại diện cho trang Cài Đặt Hồ Sơ Người Dùng (SettingsPage).
 * Giúp tương thích liền mạch với các cấu hình router và component gọi theo tên UserSettingsPage.
 */
export const UserSettingsPage: React.FC = () => {
  return <SettingsPage />;
};

export default UserSettingsPage;
export { SettingsPage };
