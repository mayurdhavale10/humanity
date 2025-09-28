'use client';

import Link from 'next/link';
import Image from 'next/image';
import Calendar from '@/components/calendar/Calendar';

export default function CalendarPage() {
  return (
    <main className="min-h-screen bg-[#8B6B7A]">
      {/* Sticky navbar */}
      <header className="sticky top-0 z-40 bg-[#8B6B7A]/85 backdrop-blur-md border-b border-white/10">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image
                src="/Humanity_founderslogo.webp"
                alt="Humanity"
                width={160}
                height={44}
                priority
                className="h-11 w-auto rounded-md object-contain"
              />
            </Link>
          </div>

          {/* Nav buttons */}
          <nav className="flex flex-wrap items-center gap-2">
            <NavButton href="/dashboard">Dashboard</NavButton>
            <NavButton href="/composer">Composer</NavButton>
            <NavButton href="/dashboard/queue">Queue</NavButton>
            <NavButton href="/dashboard/calendar" active>
              Calendar
            </NavButton>
          </nav>
        </div>
      </header>

      {/* Page container */}
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6">
        {/* Page header */}
        <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]">
            Content Calendar
          </h1>

          <Link
            href="/composer"
            className="inline-flex items-center rounded-xl border border-white/30 bg-white/15 px-4 py-2 font-extrabold text-white shadow-[0_6px_20px_rgba(0,0,0,0.18)] backdrop-blur-md transition
                       hover:translate-y-[-1px] hover:shadow-[0_10px_26px_rgba(0,0,0,0.26)] focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            Create Post
          </Link>
        </div>

        {/* Glass card containing the calendar */}
        <section
          className="rounded-xl border border-white/20 bg-[#B5979A] shadow-[0_10px_30px_rgba(0,0,0,0.25),0_2px_6px_rgba(0,0,0,0.15)]
                     p-3 sm:p-4 md:p-5"
        >
          {/* Optional subheader controls (pure UI; hook into your Calendar if you have handlers) */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Chip>Month</Chip>
              <Chip variant="ghost">Week</Chip>
              <Chip variant="ghost">Day</Chip>
            </div>
            <div className="flex items-center gap-2">
              <MiniBtn>&larr; Prev</MiniBtn>
              <MiniBtn>Today</MiniBtn>
              <MiniBtn>Next &rarr;</MiniBtn>
            </div>
          </div>

          {/* Calendar body */}
          <div
            className="rounded-lg border border-white/15 bg-white/8 p-2 backdrop-blur-[2px]"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.05))' }}
          >
            <Calendar />
          </div>
        </section>
      </div>
    </main>
  );
}

/* =================== UI bits =================== */

function NavButton({
  href,
  children,
  active = false,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        'inline-flex items-center justify-center rounded-xl px-3.5 py-2 text-sm font-extrabold transition',
        'border backdrop-blur-md shadow-[0_6px_20px_rgba(0,0,0,0.18)]',
        active
          ? 'border-white/35 bg-white/25 text-white'
          : 'border-white/25 bg-white/15 text-white hover:bg-white/25 hover:border-white/35',
      ].join(' ')}
    >
      {children}
    </Link>
  );
}

function Chip({
  children,
  variant = 'solid',
}: {
  children: React.ReactNode;
  variant?: 'solid' | 'ghost';
}) {
  const base =
    'rounded-lg px-3 py-1.5 text-xs font-extrabold tracking-wide transition';
  const styles =
    variant === 'solid'
      ? 'bg-white/25 text-white border border-white/30 shadow-sm'
      : 'bg-transparent text-white/90 border border-white/25 hover:bg-white/10';
  return <span className={`${base} ${styles}`}>{children}</span>;
}

function MiniBtn({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="rounded-lg border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-extrabold text-white shadow-sm backdrop-blur-md transition
                 hover:bg-white/25 hover:border-white/35 focus:outline-none focus:ring-2 focus:ring-white/30"
    >
      {children}
    </button>
  );
}
