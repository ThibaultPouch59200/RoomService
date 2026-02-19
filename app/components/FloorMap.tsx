'use client';

import { RoomInfo } from '@/app/types';
import { getStatusColor, getStatusText } from '@/app/lib/roomUtils';

interface FloorMapProps {
  floor: number;
  rooms: RoomInfo[];
  onRoomClick: (room: RoomInfo) => void;
}

// Per-floor SVG viewBox dimensions
const SVG_DIMS: Record<number, { w: number; h: number }> = {
  0: { w: 1137, h: 627 },
  1: { w: 1290, h: 764 },
  2: { w: 1255, h: 764 },
  3: { w: 750,  h: 432 },
};

// Bounding boxes extracted from SVG group <rect>/<path> elements.
// x, y = top-left as % of SVG viewBox. w, h = size as % of SVG viewBox.
// Keys must match room.name exactly as defined in ROOM_CONFIG.
const roomRects: Record<string, { x: number; y: number; w: number; h: number }> = {
  // Floor 0 (1137×627)
  'Bulma':          { x: 19.21, y:  0.56, w: 16.58, h: 16.51 },
  'Eliot Alderson': { x:  0.53, y:  0.56, w:  8.36, h: 24.40 },
  'Stark':          { x: 19.26, y: 25.28, w: 16.49, h: 18.74 },
  "Pru'ha":         { x:  0.53, y: 61.73, w: 35.27, h: 37.55 },
  'Mei Hatsume':    { x: 36.06, y: 67.15, w: 14.95, h: 32.13 },

  // Floor 1 (1290×764)
  'Microtech':      { x:  0.16, y: 18.52, w: 16.20, h: 19.96 },
  'Pandora':        { x:  0.31, y: 80.37, w: 31.16, h: 19.11 },
  'Poudlar':        { x: 71.76, y: 22.52, w: 20.66, h: 19.29 },
  'Gallifrey':      { x: 31.78, y: 80.37, w: 12.79, h: 19.11 },
  'Le Continental': { x: 44.88, y: 80.37, w:  7.91, h: 19.11 },
  'Kaer Morhen':    { x: 53.10, y: 80.37, w: 12.25, h: 19.10 },
  'La Matrice':     { x: 84.29, y: 60.80, w: 12.06, h: 19.50 },
  'Krikkit':        { x: 84.19, y: 47.07, w: 10.12, h: 20.43 },

  // Floor 2 (1255×764)
  'Denis':          { x:  0.16, y: 18.46, w: 16.65, h: 20.03 },
  'MacAlistair':    { x:  0.32, y: 39.01, w: 16.41, h: 34.03 },
  'Ritchie':        { x: 17.05, y: 38.74, w: 15.02, h: 34.29 },
  'Ada Lovelace':   { x:  0.32, y: 80.37, w: 27.01, h: 19.11 },
  'Hedy Lamarr':    { x: 40.72, y: 80.37, w: 17.93, h: 19.11 },
  'Al Jazari':      { x: 58.96, y: 80.37, w:  8.29, h: 19.11 },
  'Roland Moreno':  { x: 69.89, y: 14.22, w:  6.77, h: 41.10 },
  'Gwen':           { x: 77.92, y: 12.12, w: 11.94, h: 39.32 },
  'Barzey':         { x: 83.06, y: 44.91, w: 15.88, h: 35.33 },
};

export default function FloorMap({ floor, rooms, onRoomClick }: FloorMapProps) {
  const svgPath = `/svg/Z${floor}-Floor.svg`;
  const { w: svgW, h: svgH } = SVG_DIMS[floor] ?? { w: 1137, h: 627 };

  return (
    <div className="w-full h-full flex items-center justify-center">
      {/* Aspect-ratio container that fills available space */}
      <div
        className="relative overflow-hidden rounded-xl"
        style={{
          width: '100%',
          maxHeight: '100%',
          aspectRatio: `${svgW} / ${svgH}`,
        }}
      >
        {/* Floor Plan SVG */}
        <img
          src={svgPath}
          alt={`Floor ${floor} plan`}
          className="absolute inset-0 w-full h-full"
        />

        {/* Room overlays */}
        {rooms.map((room) => {
          const rect = roomRects[room.name];
          if (!rect) return null;

          const statusColor = room.type === 'office'
            ? 'bg-gray-400 dark:bg-gray-600'
            : getStatusColor(room.status);
          const isOffice = room.type === 'office';

          return (
            <button
              key={room.name}
              onClick={() => !isOffice && onRoomClick(room)}
              disabled={isOffice}
              style={{
                position: 'absolute',
                left:   `${rect.x}%`,
                top:    `${rect.y}%`,
                width:  `${rect.w}%`,
                height: `${rect.h}%`,
              }}
              className={`
                ${statusColor} opacity-80
                flex flex-col items-center justify-center text-center
                transition-all duration-300 ease-in-out overflow-hidden
                ${isOffice ? 'cursor-default' : 'hover:opacity-100 hover:shadow-xl cursor-pointer hover:z-10'}
                focus:outline-none
              `}
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
              <div className="relative z-10 px-1">
                <p className="text-[9px] sm:text-[11px] font-bold text-white leading-tight line-clamp-2">
                  {room.name}
                </p>
                {!isOffice && (
                  <p className="text-[7px] sm:text-[9px] text-white/80 mt-0.5 font-medium">
                    {getStatusText(room.status)}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
