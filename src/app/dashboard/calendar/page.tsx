import Calendar from "@/components/calendar/Calendar";
export default function CalendarPage() {
  return (
    <main className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Content Calendar</h1>
        <a className="rounded-xl border px-4 py-2 hover:bg-gray-50" href="/composer">Create Post</a>
      </div>
      <Calendar />
    </main>
  );
}
