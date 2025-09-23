"use client";
import FullCalendar from "@fullcalendar/react";
import dayGrid from "@fullcalendar/daygrid";
import timeGrid from "@fullcalendar/timegrid";
import interaction from "@fullcalendar/interaction";

export default function Calendar({ events = [], onDateClick }: { events?: any[]; onDateClick?: (dateStr: string)=>void; }) {
  return (
    <div className="rounded-2xl border p-4">
      <FullCalendar
        plugins={[dayGrid, timeGrid, interaction]}
        initialView="dayGridMonth"
        events={events}
        dateClick={(i) => onDateClick?.(i.dateStr)}
        height="auto"
      />
    </div>
  );
}
