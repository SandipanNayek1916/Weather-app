import React, { useState, useEffect } from 'react';
import { Map, Overlay } from 'pigeon-maps';

export default function MapOverlay({ lat, lon, name }) {
  const [center, setCenter] = useState([lat, lon]);
  const [zoom, setZoom] = useState(10);

  useEffect(() => {
    setCenter([lat, lon]);
    setZoom(10); // Reset zoom to a safe city-level view when location changes
  }, [lat, lon]);

  if (!lat || !lon) return null;

  return (
    <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', marginTop: '32px' }}>
      <style>{`
        .pulsing-marker-core {
          position: absolute;
          inset: 0;
          background: var(--accent-2, #7cf2d6);
          border-radius: 50%;
          border: 2px solid #fff;
          box-shadow: 0 0 15px var(--accent-2, #7cf2d6);
          z-index: 2;
        }
        .pulsing-marker-ring {
          position: absolute;
          inset: -10px;
          border-radius: 50%;
          background: var(--accent-2, #7cf2d6);
          animation: map-pulse 1.5s ease-out infinite;
          z-index: 1;
        }
        @keyframes map-pulse {
          0% { transform: scale(0.4); opacity: 0.9; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .pigeon-tooltip {
          position: absolute;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          background: #0d1d31;
          color: white;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 8px 12px;
          font-size: 13px;
          white-space: nowrap;
          z-index: 20;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s;
        }
        .marker-container:hover .pigeon-tooltip {
          opacity: 1;
        }
        /* Specifically target ONLY the map tiles to apply the Dark Mode inversion */
        .base-map-container img {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
      `}</style>

      <h3 style={{ color: 'var(--text-faint, #8b96a5)', marginBottom: '16px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
        Geographic Map View
      </h3>
      
      <div style={{ position: 'relative', height: '400px', width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
        
        {/* Base Map */}
        <div className="base-map-container" style={{ width: '100%', height: '100%' }}>
          <Map 
            center={center} 
            zoom={zoom} 
            onBoundsChanged={({ center, zoom }) => { setCenter(center); setZoom(zoom); }} 
            provider={(x, y, z) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`}
          >
            <Overlay anchor={[lat, lon]}>
              <div className="marker-container" style={{ position: 'relative', width: 22, height: 22, left: -11, top: -11, cursor: 'pointer' }}>
                <div className="pulsing-marker-ring"></div>
                <div className="pulsing-marker-core"></div>
                <div className="pigeon-tooltip">
                  <strong style={{ color: 'var(--accent-2)' }}>{name}</strong><br/>
                  <span style={{ color: 'var(--text-soft)' }}>Lat: {Number(lat).toFixed(4)}, Lon: {Number(lon).toFixed(4)}</span>
                </div>
              </div>
            </Overlay>
          </Map>
        </div>
        
      </div>
    </div>
  );
}
