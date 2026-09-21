import React, { useState } from 'react';
import { QuoteView } from './components/quote/QuoteView';
import { PhotographerDashboard } from './components/dashboard/PhotographerDashboard';
import { MOCK_QUOTE, MOCK_CALENDAR_EVENTS } from './data/mockData';
import { CalendarEvent, QuoteData } from './types';
import { Calendar, FileText, Sparkles, Smartphone, Monitor } from 'lucide-react';

export function App() {
  const [activeMode, setActiveMode] = useState<'quote' | 'dashboard'>('quote');
  const [quote, setQuote] = useState<QuoteData>(MOCK_QUOTE);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(MOCK_CALENDAR_EVENTS);

  // When client confirms deposit on the Quote Link, update calendar status too!
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

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col">
      {/* Top Demo Mode Switcher Bar */}
      <nav className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-red-500/30 bg-black shadow-md flex-shrink-0">
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
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex items-center bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveMode('quote')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl font-bold transition-all ${
                activeMode === 'quote'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Link Báo Giá Khách Hàng (Quote Link)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('dashboard')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl font-bold transition-all ${
                activeMode === 'dashboard'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Lịch Chụp Thợ Ảnh (Calendar View)</span>
            </button>
          </div>
        </div>
      </nav>

      {/* View Content */}
      <main className="flex-1">
        {activeMode === 'quote' ? (
          <QuoteView
            initialQuote={quote}
            onQuoteStatusChange={handleQuoteStatusChange}
          />
        ) : (
          <PhotographerDashboard
            events={calendarEvents}
            onViewQuote={() => setActiveMode('quote')}
          />
        )}
      </main>
    </div>
  );
}

export default App;
