import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { EventInput, EventContentArg } from '@fullcalendar/core';
import EventModal from '../components/EventModal';
import QuickEventAdd from '../components/QuickEventAdd';
import GenerateRecurringButton from '../components/GenerateRecurringButton';

interface Event {
  id: string;
  title: string;
  start: string;
  end: string;
  user_id: string;
  category?: string;
  color?: string;
}

export default function Agenda() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [events, setEvents] = useState<EventInput[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    start: string;
    end: string;
  } | null>(null);

  const fetchEvents = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id);

    if (!error && data) {
      setEvents(
        data.map((e: Event) => ({
          id: e.id,
          title: e.title,
          start: e.start,
          end: e.end,
          backgroundColor: e.color || '#7C3AED',
          borderColor: e.color || '#6D28D9',
          textColor: '#FFFFFF',
        }))
      );
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchEvents();
    }
  }, [user]);

  const handleDateSelect = (selectInfo: any) => {
    setSelectedTimeSlot({
      start: selectInfo.startStr,
      end: selectInfo.endStr
    });
    setIsModalOpen(true);
  };

  const handleCreateEvent = async (title: string) => {
    if (!user?.id || !selectedTimeSlot) return;

    const { error } = await supabase
      .from('events')
      .insert({
        title,
        start: selectedTimeSlot.start,
        end: selectedTimeSlot.end,
        user_id: user.id,
      });

    if (!error) {
      await fetchEvents();
    }
  };

  const handleEventDrop = async (dropInfo: any) => {
    const { event } = dropInfo;
    await supabase
      .from('events')
      .update({
        start: event.startStr,
        end: event.endStr
      })
      .eq('id', event.id);
    
    await fetchEvents();
  };

  const handleEventResize = async (info: any) => {
    const { id, startStr, endStr } = info.event;
    await supabase.from('events').update({
      start: startStr,
      end: endStr
    }).eq('id', id);
    fetchEvents();
  };

  const handleEventClick = async (clickInfo: any) => {
    if (confirm(t('agenda.deleteEventConfirm'))) {
      await supabase
        .from('events')
        .delete()
        .eq('id', clickInfo.event.id);
      
      await fetchEvents();
    }
  };

  const renderEventContent = (eventInfo: EventContentArg) => {
    return (
      <div className="rounded-lg px-2 py-1 text-sm">
        <div className="font-medium">{eventInfo.timeText}</div>
        <div className="truncate">{eventInfo.event.title}</div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('nav.agenda')}</h1>
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-4">
        <div className="lg:col-span-1 space-y-4">
          <QuickEventAdd onAdded={fetchEvents} />
          <GenerateRecurringButton onGenerated={fetchEvents} />
        </div>

        <div className="lg:col-span-3 bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="calendar-container">
            <FullCalendar
              plugins={[timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              events={events}
              selectable={true}
              editable={true}
              select={handleDateSelect}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              eventClick={handleEventClick}
              eventContent={renderEventContent}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'timeGridWeek,timeGridDay'
              }}
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
              allDaySlot={false}
              height="auto"
              locale="fr"
              buttonText={{
                today: t('agenda.today'),
                week: t('agenda.week'),
                day: t('agenda.day')
              }}
              eventDisplay="block"
              slotEventOverlap={false}
              eventMinHeight={40}
              eventShortHeight={40}
            />
          </div>
        </div>
      </div>

      {selectedTimeSlot && (
        <EventModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTimeSlot(null);
          }}
          onSubmit={handleCreateEvent}
          startTime={selectedTimeSlot.start}
          endTime={selectedTimeSlot.end}
        />
      )}
    </div>
  );
}