// src/components/composer/PreviewPerPlatform.tsx
"use client";

import { Platform } from "./Composer";

interface PreviewPerPlatformProps {
  platforms: Platform[];
  imageUrl: string;
  caption: string;
  isVisible?: boolean;
}

const platformPreviews = {
  INSTAGRAM: {
    name: 'Instagram',
    color: '#E4405F',
    aspectRatio: '1:1',
    maxCaptionLength: 2200,
    features: ['Image', 'Caption', 'Hashtags', '@mentions'],
  }
};

export default function PreviewPerPlatform({ 
  platforms, 
  imageUrl, 
  caption, 
  isVisible = true 
}: PreviewPerPlatformProps) {
  if (!isVisible || platforms.length === 0) return null;

  const formatCaption = (text: string, platform: Platform) => {
    const maxLength = platformPreviews[platform].maxCaptionLength;
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  };

  const getHashtags = (text: string) => {
    const hashtags = text.match(/#[\w]+/g) || [];
    return hashtags.slice(0, 5); // Limit display to 5 hashtags
  };

  const getMentions = (text: string) => {
    const mentions = text.match(/@[\w]+/g) || [];
    return mentions.slice(0, 3); // Limit display to 3 mentions
  };

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#FFFFFF',
            textShadow: '0 1px 2px rgba(0,0,0,0.6)',
            margin: 0,
          }}
        >
          Platform Previews
        </h3>
        
        <div
          style={{
            fontSize: '12px',
            color: 'rgba(255,255,255,0.6)',
            fontWeight: 500,
          }}
        >
          {platforms.length} preview{platforms.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div 
        style={{ 
          display: 'grid', 
          gap: '20px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
        }}
      >
        {platforms.map((platform) => {
          const config = platformPreviews[platform];
          const hashtags = getHashtags(caption);
          const mentions = getMentions(caption);
          const formattedCaption = formatCaption(caption, platform);

          return (
            <div
              key={platform}
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderRadius: '12px',
                overflow: 'hidden',
                border: `2px solid ${config.color}40`,
                boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
              }}
            >
              {/* Platform Header */}
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: `${config.color}20`,
                  borderBottom: `1px solid ${config.color}30`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: config.color,
                  }}
                />
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#FFFFFF',
                  }}
                >
                  {config.name} Preview
                </span>
              </div>

              {/* Mock Post Content */}
              <div style={{ padding: '16px' }}>
                {/* Mock Profile Section */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: config.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#FFFFFF',
                    }}
                  >
                    H
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#FFFFFF',
                      }}
                    >
                      humanity_founders
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'rgba(255,255,255,0.6)',
                      }}
                    >
                      Verified
                    </div>
                  </div>
                </div>

                {/* Image Preview */}
                {imageUrl && (
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: config.aspectRatio,
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      marginBottom: '12px',
                      position: 'relative',
                    }}
                  >
                    <img
                      src={imageUrl}
                      alt="Post preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        padding: '4px 8px',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        borderRadius: '4px',
                        fontSize: '10px',
                        color: '#FFFFFF',
                        fontWeight: 600,
                      }}
                    >
                      {config.aspectRatio}
                    </div>
                  </div>
                )}

                {/* Caption Preview */}
                {formattedCaption && (
                  <div
                    style={{
                      marginBottom: '12px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '14px',
                        color: '#FFFFFF',
                        lineHeight: '1.4',
                        marginBottom: '8px',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>humanity_founders</span>{' '}
                      {formattedCaption}
                    </div>
                  </div>
                )}

                {/* Hashtags & Mentions */}
                {(hashtags.length > 0 || mentions.length > 0) && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      marginBottom: '12px',
                    }}
                  >
                    {hashtags.map((hashtag, index) => (
                      <span
                        key={`hashtag-${index}`}
                        style={{
                          fontSize: '12px',
                          color: config.color,
                          fontWeight: 600,
                          backgroundColor: `${config.color}15`,
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {hashtag}
                      </span>
                    ))}
                    {mentions.map((mention, index) => (
                      <span
                        key={`mention-${index}`}
                        style={{
                          fontSize: '12px',
                          color: '#64b5f6',
                          fontWeight: 600,
                          backgroundColor: 'rgba(33, 150, 243, 0.15)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {mention}
                      </span>
                    ))}
                  </div>
                )}

                {/* Mock Engagement */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={config.color} stroke={config.color}>
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                      <span
                        style={{
                          fontSize: '12px',
                          color: 'rgba(255,255,255,0.7)',
                          fontWeight: 500,
                        }}
                      >
                        0
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                      <span
                        style={{
                          fontSize: '12px',
                          color: 'rgba(255,255,255,0.7)',
                          fontWeight: 500,
                        }}
                      >
                        0
                      </span>
                    </div>
                  </div>
                  
                  <div
                    style={{
                      fontSize: '10px',
                      color: 'rgba(255,255,255,0.5)',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Scheduled
                  </div>
                </div>

                {/* Platform Features */}
                <div
                  style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'rgba(255,255,255,0.6)',
                      fontWeight: 600,
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Features Used:
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                    }}
                  >
                    {config.features.map((feature) => (
                      <span
                        key={feature}
                        style={{
                          fontSize: '10px',
                          color: 'rgba(255,255,255,0.8)',
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontWeight: 500,
                        }}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div
        style={{
          padding: '16px',
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '16px',
            textAlign: 'center',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: '#FFFFFF',
                marginBottom: '4px',
              }}
            >
              {caption.length}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'rgba(255,255,255,0.6)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Characters
            </div>
          </div>
          
          <div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: '#FFFFFF',
                marginBottom: '4px',
              }}
            >
              {getHashtags(caption).length}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'rgba(255,255,255,0.6)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Hashtags
            </div>
          </div>
          
          <div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: '#FFFFFF',
                marginBottom: '4px',
              }}
            >
              {getMentions(caption).length}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'rgba(255,255,255,0.6)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Mentions
            </div>
          </div>
          
          <div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: '#FFFFFF',
                marginBottom: '4px',
              }}
            >
              {platforms.length}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'rgba(255,255,255,0.6)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Platforms
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}