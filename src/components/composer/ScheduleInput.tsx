// src/components/composer/ScheduleInput.tsx
"use client";

interface ScheduleInputProps {
  when: string;
  onWhenChange: (when: string) => void;
}

export default function ScheduleInput({ when, onWhenChange }: ScheduleInputProps) {
  // Quick preset functions
  const setQuickTime = (minutes: number) => {
    const d = new Date(Date.now() + minutes * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
    onWhenChange(formatted);
  };

  const formatDisplayTime = () => {
    try {
      const date = new Date(when);
      return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      <label 
        style={{
          fontSize: '18px',
          fontWeight: 700,
          color: '#FFFFFF',
          textShadow: '0 1px 2px rgba(0,0,0,0.6)',
        }}
      >
        Schedule Time
      </label>

      {/* Main datetime input */}
      <div style={{ display: 'grid', gap: '12px' }}>
        <input
          type="datetime-local"
          value={when}
          onChange={(e) => onWhenChange(e.target.value)}
          style={{
            padding: '14px 16px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            color: '#FFFFFF',
            fontSize: '16px',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", monospace',
            outline: 'none',
            width: '100%',
            maxWidth: '280px',
          }}
          onFocus={(e) => {
            e.target.style.backgroundColor = 'rgba(255,255,255,0.15)';
            e.target.style.borderColor = 'rgba(255,255,255,0.4)';
          }}
          onBlur={(e) => {
            e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
            e.target.style.borderColor = 'rgba(255,255,255,0.2)';
          }}
        />

        {/* Display formatted time */}
        <div 
          style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.8)',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12,6 12,12 16,14"/>
          </svg>
          Scheduled for: <strong>{formatDisplayTime()}</strong>
        </div>
      </div>

      {/* Quick preset buttons */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <span 
          style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.7)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            marginRight: '8px',
          }}
        >
          Quick:
        </span>
        
        {[
          { label: '5 min', minutes: 5 },
          { label: '1 hour', minutes: 60 },
          { label: '4 hours', minutes: 240 },
          { label: 'Tomorrow 9AM', minutes: (() => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(9, 0, 0, 0);
            return Math.floor((tomorrow.getTime() - Date.now()) / (1000 * 60));
          })() },
        ].map(({ label, minutes }) => (
          <button
            key={label}
            type="button"
            onClick={() => setQuickTime(minutes)}
            style={{
              padding: '6px 12px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '4px',
              color: '#FFFFFF',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Timezone info */}
      <div 
        style={{
          padding: '12px 16px',
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderRadius: '6px',
          border: '1px solid rgba(255,255,255,0.1)',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.6)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 2a10 10 0 1 0 10 10"/>
        </svg>
        Time is automatically converted to UTC for storage. Your local timezone is detected.
      </div>
    </div>
  );
}