'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';

interface CalendarEvent {
  id: string;
  date: string;
  workOrderId: string;
  equipmentPlaca: string;
  type: string;
  technician: string | null;
}

interface CalendarViewProps {
  month?: Date;
  technicianId?: string;
  region?: string;
}

export default function CalendarView({ month = new Date(), technicianId, region }: CalendarViewProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(month);

  useEffect(() => {
    fetchEvents();
  }, [currentMonth, technicianId, region]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const start = startOfMonth(currentMonth).toISOString().split('T')[0];
      const end = endOfMonth(currentMonth).toISOString().split('T')[0];

      const params = new URLSearchParams({
        start_date: start,
        end_date: end,
      });

      if (technicianId) {
        params.append('technician_id', technicianId);
      }

      const response = await fetch(`/api/work-orders?${params}`);
      const result = await response.json();

      if (response.ok) {
        const calendarEvents: CalendarEvent[] = (result.data || []).map((wo: any) => ({
          id: wo.id,
          date: wo.scheduled_date || wo.created_at,
          workOrderId: wo.id,
          equipmentPlaca: wo.equipment?.placa || '-',
          type: wo.type,
          technician: wo.technician?.name || null,
        }));

        setEvents(calendarEvents);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(new Date(event.date), day));
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  if (loading) {
    return <div className="p-4">Cargando calendario...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={previousMonth}
          className="px-4 py-2 border rounded hover:bg-gray-50"
        >
          ←
        </button>
        <h2 className="text-2xl font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button
          onClick={nextMonth}
          className="px-4 py-2 border rounded hover:bg-gray-50"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={idx}
              className={`min-h-[100px] p-2 border rounded ${
                isCurrentMonth ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'
              } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className={`text-sm mb-1 ${isCurrentMonth ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="text-xs p-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded truncate"
                    title={`${event.type}: ${event.equipmentPlaca}`}
                  >
                    {event.equipmentPlaca}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{dayEvents.length - 3} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

