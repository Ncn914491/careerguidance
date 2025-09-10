import { ImageResponse } from 'next/og'
 
// Route segment config
export const runtime = 'edge'
 
// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'
 
// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1F2937 0%, #374151 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Career ladder steps */}
        <div
          style={{
            position: 'absolute',
            width: '28px',
            height: '2px',
            background: 'linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)',
            top: '8px',
            opacity: 0.8,
            borderRadius: '1px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '28px',
            height: '2px',
            background: 'linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)',
            top: '13px',
            opacity: 0.9,
            borderRadius: '1px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '28px',
            height: '2px',
            background: 'linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)',
            top: '18px',
            borderRadius: '1px',
          }}
        />
        
        {/* Central briefcase */}
        <div
          style={{
            position: 'absolute',
            width: '12px',
            height: '10px',
            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
            borderRadius: '2px',
            border: '1px solid #F3F4F6',
            top: '14px',
            left: '10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Handle */}
          <div
            style={{
              position: 'absolute',
              width: '6px',
              height: '3px',
              background: '#1F2937',
              borderRadius: '1px',
              top: '-3px',
            }}
          />
          {/* Document lines */}
          <div
            style={{
              width: '8px',
              height: '1px',
              background: '#F3F4F6',
              marginBottom: '1px',
              opacity: 0.8,
              borderRadius: '0.5px',
            }}
          />
          <div
            style={{
              width: '8px',
              height: '1px',
              background: '#F3F4F6',
              marginBottom: '1px',
              opacity: 0.6,
              borderRadius: '0.5px',
            }}
          />
          <div
            style={{
              width: '5px',
              height: '1px',
              background: '#F3F4F6',
              opacity: 0.4,
              borderRadius: '0.5px',
            }}
          />
        </div>
        
        {/* Growth arrows */}
        <div
          style={{
            position: 'absolute',
            left: '4px',
            top: '20px',
            width: '0px',
            height: '0px',
            borderLeft: '3px solid #10B981',
            borderTop: '2px solid transparent',
            borderBottom: '2px solid transparent',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: '4px',
            top: '8px',
            width: '0px',
            height: '0px',
            borderRight: '3px solid #10B981',
            borderTop: '2px solid transparent',
            borderBottom: '2px solid transparent',
          }}
        />
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  )
}
