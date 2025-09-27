// src/components/composer/ImageUpload.tsx
"use client";

interface ImageUploadProps {
  imageUrl: string;
  onImageUrlChange: (url: string) => void;
  onUpload: (file: File) => void;
  uploading: boolean;
}

export default function ImageUpload({ 
  imageUrl, 
  onImageUrlChange, 
  onUpload, 
  uploading 
}: ImageUploadProps) {
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
        Media Content
      </label>
      
      {/* Upload Section */}
      <div 
        style={{
          padding: '20px',
          backgroundColor: 'rgba(0,0,0,0.3)',
          borderRadius: '8px',
          border: '2px dashed rgba(255,255,255,0.3)',
          display: 'grid',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <label 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              backgroundColor: uploading ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
              color: '#FFFFFF',
              borderRadius: '6px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              border: '1px solid rgba(255,255,255,0.2)',
              transition: 'all 0.2s ease',
              opacity: uploading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!uploading) {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)';
              }
            }}
            onMouseLeave={(e) => {
              if (!uploading) {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
              }
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17,8 12,3 7,8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            {uploading ? 'Uploading...' : 'Upload Image'}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>
          
          <span 
            style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 500,
            }}
          >
            or paste URL below
          </span>
        </div>

        <input
          type="url"
          placeholder="https://example.com/image.jpg"
          value={imageUrl}
          onChange={(e) => onImageUrlChange(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '6px',
            color: '#FFFFFF',
            fontSize: '14px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            outline: 'none',
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
      </div>

      {/* Image Preview */}
      {imageUrl && (
        <div 
          style={{
            position: 'relative',
            maxWidth: '400px',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <img
            src={imageUrl}
            alt="Preview"
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '300px',
              objectFit: 'cover',
              display: 'block',
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              padding: '6px 12px',
              backgroundColor: 'rgba(0,0,0,0.7)',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#FFFFFF',
              fontWeight: 600,
            }}
          >
            Preview
          </div>
        </div>
      )}
    </div>
  );
}