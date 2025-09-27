// src/components/composer/CaptionEditor.tsx
"use client";

import { useState } from "react";

interface CaptionEditorProps {
  caption: string;
  onCaptionChange: (caption: string) => void;
}

export default function CaptionEditor({ caption, onCaptionChange }: CaptionEditorProps) {
  const [charCount, setCharCount] = useState(caption.length);
  const maxChars = 2200; // Instagram's limit

  const handleCaptionChange = (value: string) => {
    onCaptionChange(value);
    setCharCount(value.length);
  };

  const getCharCountColor = () => {
    if (charCount > maxChars) return '#ff6b6b';
    if (charCount > maxChars * 0.9) return '#ffa726';
    return 'rgba(255,255,255,0.6)';
  };

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label 
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#FFFFFF',
            textShadow: '0 1px 2px rgba(0,0,0,0.6)',
          }}
        >
          Caption
        </label>
        
        <div 
          style={{
            fontSize: '14px',
            color: getCharCountColor(),
            fontWeight: 600,
            fontFamily: 'ui-monospace, monospace',
          }}
        >
          {charCount.toLocaleString()}/{maxChars.toLocaleString()}
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <textarea
          placeholder="Write your caption here... Use emojis, hashtags, and @mentions"
          value={caption}
          onChange={(e) => handleCaptionChange(e.target.value)}
          style={{
            width: '100%',
            minHeight: '120px',
            padding: '16px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            color: '#FFFFFF',
            fontSize: '16px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            outline: 'none',
            resize: 'vertical',
            lineHeight: '1.5',
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

        {/* Quick Actions */}
        <div 
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            display: 'flex',
            gap: '8px',
          }}
        >
          <button
            type="button"
            onClick={() => handleCaptionChange(caption + ' 🚀')}
            style={{
              padding: '6px 8px',
              backgroundColor: 'rgba(0,0,0,0.4)',
              border: 'none',
              borderRadius: '4px',
              color: '#FFFFFF',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
            title="Add rocket emoji"
          >
            🚀
          </button>
          <button
            type="button"
            onClick={() => handleCaptionChange(caption + ' #')}
            style={{
              padding: '6px 8px',
              backgroundColor: 'rgba(0,0,0,0.4)',
              border: 'none',
              borderRadius: '4px',
              color: '#FFFFFF',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
            title="Add hashtag"
          >
            #
          </button>
          <button
            type="button"
            onClick={() => handleCaptionChange(caption + ' @')}
            style={{
              padding: '6px 8px',
              backgroundColor: 'rgba(0,0,0,0.4)',
              border: 'none',
              borderRadius: '4px',
              color: '#FFFFFF',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
            title="Add mention"
          >
            @
          </button>
        </div>
      </div>

      {/* Caption Tips */}
      <div 
        style={{
          padding: '12px 16px',
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderRadius: '6px',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div 
          style={{
            fontSize: '12px',
            color: 'rgba(255,255,255,0.7)',
            fontWeight: 600,
            marginBottom: '6px',
          }}
        >
          💡 Caption Tips:
        </div>
        <div 
          style={{
            fontSize: '12px',
            color: 'rgba(255,255,255,0.6)',
            lineHeight: '1.4',
          }}
        >
          • Use relevant hashtags (#socialmedia #automation)
          • Tag collaborators (@username)
          • Keep it engaging and authentic
          • Consider your audience and platform
        </div>
      </div>
    </div>
  );
}