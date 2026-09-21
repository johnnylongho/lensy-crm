import React, { useState, useEffect } from 'react';
import { Gear, Booking, DebtReminder, WorkflowStage } from '@lensflow/shared';
import { DashboardStats } from './components/DashboardStats';
import { QuoteBuilder } from './components/QuoteBuilder';
import { KanbanBoard } from './components/KanbanBoard';
import { DebtCollectorModal } from './components/DebtCollectorModal';
import { ClientQuoteView } from './components/ClientQuoteView';
import { 
  Camera, 
  LayoutDashboard, 
  PlusCircle, 
  Kanban, 
  MessageSquare, 
  Eye,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'quote' | 'kanban' | 'debt' | 'client-preview'>('dashboard');
  const [gears, setGears] = useState<Gear[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [debtReminders, setDebtReminders] = useState<DebtReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBookingForPreview, setSelectedBookingForPreview] = useState<Booking | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [gearsRes, bookingsRes, debtRes] = await Promise.all([
        fetch('/api/gears').then(r => r.json()),
        fetch('/api/bookings').then(r => r.json()),
        fetch('/api/debt-collector/pending').then(r => r.json())
      ]);

      if (gearsRes.success) setGears(gearsRes.data);
      if (bookingsRes.success) {
        setBookings(bookingsRes.data);
        if (bookingsRes.data.length > 0 && !selectedBookingForPreview) {
          setSelectedBookingForPreview(bookingsRes.data[0]);
        }
      }
      if (debtRes.success) setDebtReminders(debtRes.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleQuoteCreated = (newBooking: Booking) => {
    setBookings(prev => [newBooking, ...prev]);
    setSelectedBookingForPreview(newBooking);
    fetchData();
  };

  const handleStageChange = async (bookingId: string, newStage: WorkflowStage) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowStage: newStage })
      });
      const json = await res.json();
      if (json.success) {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, workflowStage: newStage } : b));
        fetchData();
      }
    } catch (err) {
      console.error('Failed to update stage:', err);
    }
  };

  const handleDepositConfirmed = async (bookingId: string) => {
    try {
      await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowStage: 'booked',
          paymentStatus: 'deposit_paid',
          paidAmount: 3000000
        })
      });
      fetchData();
    } catch (err) {
      console.error('Failed to update deposit:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Mobile-first Navigation Bar */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  LensFlow
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-extrabold uppercase bg-indigo-900/80 text-indigo-300 border border-indigo-500/30 rounded-full">
                  PoC
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">Trợ lý số cho Freelance Photographer</p>
            </div>
          </div>

          {/* Desktop/Tablet Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-2xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Tổng quan
            </button>
            <button
              onClick={() => setActiveTab('quote')}
              className={`px-3 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'quote' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <PlusCircle className="w-4 h-4" /> Tạo Báo Giá & Quét Máy
            </button>
            <button
              onClick={() => setActiveTab('kanban')}
              className={`px-3 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'kanban' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Kanban className="w-4 h-4" /> Kanban Job
            </button>
            <button
              onClick={() => setActiveTab('debt')}
              className={`px-3 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'debt' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" /> Nhắc Nợ Zalo ({debtReminders.length})
            </button>
            <button
              onClick={() => setActiveTab('client-preview')}
              className={`px-3 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'client-preview' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-4 h-4" /> View Khách Hàng
            </button>
          </nav>

          <button
            onClick={fetchData}
            title="Làm mới dữ liệu"
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden items-center justify-between gap-1 mt-3 pt-2 border-t border-slate-900 overflow-x-auto text-[11px]">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap ${
              activeTab === 'dashboard' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'
            }`}
          >
            Tổng quan
          </button>
          <button
            onClick={() => setActiveTab('quote')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap ${
              activeTab === 'quote' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'
            }`}
          >
            Báo giá & Quét
          </button>
          <button
            onClick={() => setActiveTab('kanban')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap ${
              activeTab === 'kanban' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'
            }`}
          >
            Kanban
          </button>
          <button
            onClick={() => setActiveTab('debt')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap ${
              activeTab === 'debt' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400'
            }`}
          >
            Nhắc Nợ ({debtReminders.length})
          </button>
          <button
            onClick={() => setActiveTab('client-preview')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap ${
              activeTab === 'client-preview' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'
            }`}
          >
            View Khách
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 space-y-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Hero Welcome */}
            <div className="bg-gradient-to-r from-indigo-950/70 via-purple-950/40 to-slate-900 p-6 rounded-3xl border border-indigo-500/20 relative overflow-hidden">
              <div className="relative z-10 max-w-xl space-y-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400">
                  <Sparkles className="w-3.5 h-3.5" /> PoC Validation Mode
                </span>
                <h2 className="text-xl md:text-2xl font-extrabold text-white">
                  Chào mừng Nhiếp Ảnh Gia đến với LensFlow
                </h2>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                  Trợ lý đắc lực giúp bạn chấm dứt nỗi lo trùng máy ảnh, quản lý luồng ảnh chụp và thu hồi 100% công nợ sau khi trả link Google Drive.
                </p>
              </div>
            </div>

            {/* Metrics */}
            <DashboardStats
              bookings={bookings}
              gears={gears}
              onNavigateTab={tab => setActiveTab(tab as any)}
            />

            {/* Quick Kanban Section Preview */}
            <div className="pt-2">
              <KanbanBoard
                bookings={bookings}
                onStageChange={handleStageChange}
                onOpenDebtModal={() => setActiveTab('debt')}
              />
            </div>
          </div>
        )}

        {activeTab === 'quote' && (
          <QuoteBuilder
            gears={gears}
            onQuoteCreated={handleQuoteCreated}
          />
        )}

        {activeTab === 'kanban' && (
          <KanbanBoard
            bookings={bookings}
            onStageChange={handleStageChange}
            onOpenDebtModal={() => setActiveTab('debt')}
          />
        )}

        {activeTab === 'debt' && (
          <div className="max-w-3xl mx-auto">
            <DebtCollectorModal reminders={debtReminders} />
          </div>
        )}

        {activeTab === 'client-preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between max-w-xl mx-auto bg-slate-900/60 p-3 rounded-2xl border border-slate-800 text-xs">
              <span className="text-slate-400">Đang xem trước Quote của:</span>
              <select
                value={selectedBookingForPreview?.id || ''}
                onChange={e => {
                  const b = bookings.find(item => item.id === e.target.value);
                  if (b) setSelectedBookingForPreview(b);
                }}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white font-medium"
              >
                {bookings.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.clientName} ({b.eventDate})
                  </option>
                ))}
              </select>
            </div>

            {selectedBookingForPreview ? (
              <ClientQuoteView
                booking={selectedBookingForPreview}
                onDepositConfirmed={handleDepositConfirmed}
              />
            ) : (
              <div className="text-center py-10 text-slate-500">
                Chưa có booking nào để xem trước.
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 text-center text-xs text-slate-500">
        LensFlow PoC • React.js + Node.js + Supabase Architecture • Designed for Freelance Photographers
      </footer>
    </div>
  );
}
export default App;
