import React, { useState } from 'react';
import { parseISO } from 'date-fns';
import { DashboardHeader } from './DashboardHeader';
import { CalendarView } from './CalendarView';
import { DayShootsModal } from './DayShootsModal';
import { UpcomingShootsList } from './UpcomingShootsList';
import { CalendarEvent } from '../../types';

interface Props {
  events: CalendarEvent[];
  onViewQuote: (eventId: string) => void;
}

export const PhotographerDashboard: React.FC<Props> = ({ events, onViewQuote }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date('2026-09-25'));

  const handleSelectEventDate = (dateStr: string) => {
    setSelectedDate(parseISO(dateStr));
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header & Key Metrics */}
      <DashboardHeader events={events} />

      {/* Main Grid: Calendar on Left, Selected Day details on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <CalendarView
            events={events}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />

          <UpcomingShootsList
            events={events}
            onSelectEventDate={handleSelectEventDate}
          />
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <DayShootsModal
              selectedDate={selectedDate}
              events={events}
              onViewQuote={onViewQuote}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
