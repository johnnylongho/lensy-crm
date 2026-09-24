import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { PrivateRoute } from './components/auth/PrivateRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { PublicLayout } from './layouts/PublicLayout';
import { LandingPage } from './components/home/LandingPage';
import { LoginPage } from './components/auth/LoginPage';
import { QuoteView } from './components/quote/QuoteView';
import { PhotographerDashboard } from './components/dashboard/PhotographerDashboard';
import { SettingsPage } from './components/dashboard/SettingsPage';
import { GearsManagementPage } from './components/dashboard/GearsManagementPage';
import { ClientsManagementPage } from './components/clients/ClientsManagementPage';
import { MOCK_QUOTE, MOCK_CALENDAR_EVENTS } from './data/mockData';
import { CalendarEvent, QuoteData } from './types';

export function App() {
  const [quote, setQuote] = useState<QuoteData>(MOCK_QUOTE);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(MOCK_CALENDAR_EVENTS);

  // Khi khách chốt cọc trên Quote Link, cập nhật trạng thái
  const handleQuoteStatusChange = (newStatus: QuoteData['status']) => {
    setQuote(prev => ({ ...prev, status: newStatus }));
    setCalendarEvents(prev =>
      prev.map(ev =>
        ev.clientName.includes('Minh & Thảo')
          ? { ...ev, status: newStatus, depositAmount: quote.depositAmount }
          : ev
      )
    );
  };

  // Khi khách hàng gửi yêu cầu đặt lịch mới
  const handleNewBooking = (newBooking: any) => {
    const newEvent: CalendarEvent = {
      id: newBooking.id || `ev-${Date.now()}`,
      clientName: newBooking.client_name || newBooking.clientName,
      sessionType: newBooking.session_type || newBooking.sessionType || 'wedding',
      eventDate: newBooking.event_date || newBooking.eventDate,
      startTime: (newBooking.start_time || newBooking.startTime || '08:00').substring(0, 5),
      endTime: (newBooking.end_time || newBooking.endTime || '12:00').substring(0, 5),
      location: newBooking.location || 'Tại Studio',
      status: (newBooking.status as any) || 'lead',
      packagePrice: Number(newBooking.package_price || newBooking.packagePrice || 18000000),
      depositAmount: Number(newBooking.deposit_amount || newBooking.depositAmount || 5400000),
    };
    setCalendarEvents(prev => [newEvent, ...prev]);
  };

  return (
    <ThemeProvider>
      <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ==================================================================== */}
          {/* 1. PUBLIC LAYOUT: KHÔNG CÓ MENU QUẢN TRỊ (Dành cho Khách Hàng & Public) */}
          {/* ==================================================================== */}
          <Route element={<PublicLayout />}>
            {/* Trang chủ: Tự động redirect về /dashboard nếu đã login, hoặc hiện Landing Page nếu chưa login */}
            <Route path="/" element={<LandingPage />} />

            {/* Trang đăng nhập / đăng ký */}
            <Route path="/login" element={<LoginPage />} />

            {/* Trang đặt lịch công khai cá nhân hóa của Thợ ảnh (Public Client Booking Link) */}
            <Route
              path="/book/:username"
              element={
                <QuoteView
                  initialQuote={quote}
                  onQuoteStatusChange={handleQuoteStatusChange}
                  onBookingSubmit={handleNewBooking}
                />
              }
            />

            {/* Trang xem báo giá qua mã chia sẻ (Quote Link Token) */}
            <Route
              path="/quote/:token"
              element={
                <QuoteView
                  initialQuote={quote}
                  onQuoteStatusChange={handleQuoteStatusChange}
                  onBookingSubmit={handleNewBooking}
                />
              }
            />

            {/* Thư báo giá mẫu demo */}
            <Route
              path="/quote"
              element={
                <QuoteView
                  initialQuote={quote}
                  onQuoteStatusChange={handleQuoteStatusChange}
                  onBookingSubmit={handleNewBooking}
                />
              }
            />
          </Route>

          {/* ==================================================================== */}
          {/* 2. DASHBOARD LAYOUT: CÓ MENU QUẢN TRỊ & BẢO VỆ BỞI PRIVATE ROUTE       */}
          {/* ==================================================================== */}
          <Route
            element={
              <PrivateRoute>
                <DashboardLayout />
              </PrivateRoute>
            }
          >
            {/* Trang Lịch Chụp / Dashboard Chính */}
            <Route
              path="/dashboard"
              element={
                <PhotographerDashboard
                  events={calendarEvents}
                  onViewQuote={() => {
                    window.open('/quote', '_blank');
                  }}
                />
              }
            />

            {/* Trang Quản Lý Hồ Sơ Khách Hàng (Client CRM & LTV) */}
            <Route path="/dashboard/clients" element={<ClientsManagementPage />} />

            {/* Trang Quản Lý Thiết Bị Studio */}
            <Route path="/dashboard/gears" element={<GearsManagementPage />} />

            {/* Trang Cài Đặt Hồ Sơ & Tài Khoản Ngân Hàng */}
            <Route path="/dashboard/settings" element={<SettingsPage />} />
          </Route>

          {/* ==================================================================== */}
          {/* 3. ALIAS & FALLBACK ROUTES                                           */}
          {/* ==================================================================== */}
          <Route path="/clients" element={<Navigate to="/dashboard/clients" replace />} />
          <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />
          <Route path="/gears" element={<Navigate to="/dashboard/gears" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
  );
}

export default App;
