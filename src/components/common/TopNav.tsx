'use client';

interface TopNavProps {
  isLoaded: boolean;
}

export default function TopNav({ isLoaded }: TopNavProps) {
  return (
    /* Top Navigation Bar - Centered */
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '12px',
        zIndex: 1000,
        opacity: isLoaded ? 1 : 0,
        transition: 'all 1s ease-out',
        transitionDelay: '0.8s',
      }}
    >
      {/* Home Button */}
      <button
        onClick={() => window.location.href = '/dashboard'}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '25px',
          padding: '8px 20px',
          color: '#FFFFFF',
          fontSize: '14px',
          fontWeight: 500,
          letterSpacing: '0.05em',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
        onMouseEnter={(e) => {
          const target = e.target as HTMLButtonElement;
          target.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
          target.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          const target = e.target as HTMLButtonElement;
          target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
          target.style.transform = 'translateY(0px)';
        }}
      >
        Home
      </button>

      {/* Services Button */}
      <button
        onClick={() => window.location.href = '/composer'}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '25px',
          padding: '8px 20px',
          color: '#FFFFFF',
          fontSize: '14px',
          fontWeight: 500,
          letterSpacing: '0.05em',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
        onMouseEnter={(e) => {
          const target = e.target as HTMLButtonElement;
          target.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
          target.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          const target = e.target as HTMLButtonElement;
          target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
          target.style.transform = 'translateY(0px)';
        }}
      >
        Services
      </button>

      {/* Contact Us Button */}
      <button
        onClick={() => window.location.href = '/contact'}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '25px',
          padding: '8px 20px',
          color: '#FFFFFF',
          fontSize: '14px',
          fontWeight: 500,
          letterSpacing: '0.05em',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
        onMouseEnter={(e) => {
          const target = e.target as HTMLButtonElement;
          target.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
          target.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          const target = e.target as HTMLButtonElement;
          target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
          target.style.transform = 'translateY(0px)';
        }}
      >
        Contact Us
      </button>
    </div>
  );
}