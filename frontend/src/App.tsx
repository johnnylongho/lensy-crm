import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PrivateRoute } from './components/auth/PrivateRoute';
import { LoginPage } from './components/auth/LoginPage';
import { QuoteView } from './components/quote/QuoteView';
import { PhotographerDashboard } from './components/dashboard/PhotographerDashboard';
import { MOCK_QUOTE, MOCK_CALENDAR_EVENTS } from './data/mockData';
import { CalendarEvent, QuoteData } from './types';
import { Calendar, Smartphone, LogIn, LogOut, User as UserIcon } from 'lucide-react';

function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const location = useLocation();

  // Ẩn thanh top nav nếu đang ở trang login
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col">
      {!isLoginPage && (
        <nav className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
            {/* Logo Brand */}
            <div className="flex items-center gap-2.5">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl overflow-hidden border border-red-500/30 bg-black shadow-md flex-shrink-0 group-hover:border-amber-400 transition-colors">
                  <img
                    src="/mirmia-logo.png"
                    alt="Mirmia Studio & Academy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-white tracking-tight">
                      Lensy
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                      by Mirmia Studio
                    </span>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-red-950/70 text-red-300 border border-red-500/30">
                      MIRMIA
                    </span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs">
              <Link
                to="/"
                className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl font-bold transition-all ${
                  location.pathname === '/' || location.pathname.startsWith('/quote')
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Link Báo Giá Khách Hàng (Public)</span>
              </Link>

              <Link
                to="/dashboard"
                className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl font-bold transition-all ${
                  location.pathname === '/dashboard'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Lịch Chụp Thợ Ảnh (Dashboard)</span>
              </Link>
            </div>

            {/* Right User Status */}
            <div className="flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-2">
                  <div className="hidden md:flex flex-col text-right text-[11px]">
                    <span className="text-white font-bold truncate max-w-[140px]">
                      {user.user_metadata?.full_name || 'Thợ ảnh'}
                    </span>
                    <span className="text-slate-400 text-[10px] truncate max-w-[140px] font-mono">
                      {user.email}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/80 border border-slate-800 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5"
                    title="Đăng xuất khỏi Lensy"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Đăng xuất</span>
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02]"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Đăng Nhập Thợ Ảnh</span>
                </Link>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* Main View Area */}
      <main className="flex-1">{children}</main>
    </div>
  );
}

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
      status: (newBooking.status as any) || 'cho_coc',
      packagePrice: Number(newBooking.package_price || newBooking.packagePrice || 18000000),
      depositAmount: Number(newBooking.deposit_amount || newBooking.depositAmount || 5400000),
    };
    setCalendarEvents(prev => [newEvent, ...prev]);
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            {/* 1. Trang Báo Giá (Quote Link) - Hoàn toàn PUBLIC cho khách hàng */}
            <Route
              path="/"
              element={
                <QuoteView
                  initialQuote={quote}
                  onQuoteStatusChange={handleQuoteStatusChange}
                  onBookingSubmit={handleNewBooking}
                />
              }
            />
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

            {/* 2. Trang Đăng Nhập / Đăng Ký */}
            <Route path="/login" element={<LoginPage />} />

            {/* 3. Trang Dashboard - BẢO VỆ CHẶT CHẼ (Private Route cho Thợ Ảnh) */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <PhotographerDashboard
                    events={calendarEvents}
                    onViewQuote={() => {
                      window.location.href = '/';
                    }}
                  />
                </PrivateRoute>
              }
            />

            {/* Fallback điều hướng về trang chủ */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
