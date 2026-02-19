'use client';

import { RoomInfo } from '@/app/types';
import { getStatusColor, getStatusText } from '@/app/lib/roomUtils';

interface FloorMapProps {
  floor: number;
  rooms: RoomInfo[];
  onRoomClick: (room: RoomInfo) => void;
}

// Per-floor SVG viewBox dimensions
const SVG_VIEWBOX: Record<number, { w: number; h: number }> = {
  0: { w: 1137, h: 627 },
  1: { w: 1290, h: 764 },
  2: { w: 1255, h: 764 },
  3: { w: 750,  h: 432 },
};

// Bounding boxes in absolute SVG coordinate space (same coordinate system as viewBox).
// Extracted directly from <rect> elements inside each room's <g id="..."> group.
// Keys must match room.name exactly as defined in ROOM_CONFIG.
const roomRects: Record<string, { x: number; y: number; w: number; h: number }> = {
  // Floor 0 (viewBox 1137×627)
  'Bulma':          { x: 218.5, y:   3.5, w: 188.5, h: 103.5 },
  'Eliot Alderson': { x:   6.0, y:   3.5, w:  95.0, h: 153.0 },
  'Stark':          { x: 219.0, y: 158.5, w: 187.5, h: 117.5 },
  "Pru'ha":         { x:   6.0, y: 387.0, w: 401.0, h: 235.4 },
  'Mei Hatsume':    { x: 410.0, y: 421.0, w: 170.0, h: 201.5 },

  // Floor 1 (viewBox 1290×764)
  'Microtech':      { x:   2.0, y: 141.5, w: 209.0, h: 152.5 },
  'Pandora':        { x:   4.0, y: 614.0, w: 402.0, h: 146.0 },
  'Poudlar':        { x: 925.7, y: 172.1, w: 266.5, h: 147.3 },
  'Gallifrey':      { x: 410.0, y: 614.0, w: 165.0, h: 146.0 },
  'Le Continental': { x: 579.0, y: 614.0, w: 102.0, h: 146.0 },
  'Kaer Morhen':    { x: 685.0, y: 614.1, w: 158.0, h: 145.9 },
  // Rotated bounding boxes (paths with rotate transform)
  'La Matrice':     { x: 1087.3, y: 464.5, w: 155.6, h: 149.0 },
  'Krikkit':        { x: 1086.0, y: 359.6, w: 130.5, h: 156.1 },

  // Floor 2 (viewBox 1255×764)
  'Denis':          { x:   2.0, y: 141.0, w: 209.0, h: 153.0 },
  'MacAlistair':    { x:   4.0, y: 298.0, w: 206.0, h: 260.0 },
  'Ritchie':        { x: 214.0, y: 296.0, w: 188.5, h: 262.0 },
  'Ada Lovelace':   { x:   4.0, y: 614.0, w: 339.0, h: 146.0 },
  'Hedy Lamarr':    { x: 511.0, y: 614.0, w: 225.0, h: 146.0 },
  'Al Jazari':      { x: 740.0, y: 614.0, w: 104.0, h: 146.0 },
  'Roland Moreno':  { x: 877.1, y: 108.7, w:  84.9, h: 314.0 },
  'Gwen':           { x: 977.9, y:  92.6, w: 149.9, h: 300.4 },
  // Rotated bounding box
  'Barzey':         { x: 1042.4, y: 343.1, w: 199.3, h: 269.9 },

  // Floor 3 (viewBox 750×432) — rooms defined as paths
  'TensorFlow':     { x: 215.0, y: 123.0, w: 186.5, h: 140.0 },
};

export default function FloorMap({ floor, rooms, onRoomClick }: FloorMapProps) {
  const { w: vbW, h: vbH } = SVG_VIEWBOX[floor] ?? { w: 1137, h: 627 };
  const svgPath = `/svg/Z${floor}-Floor.svg`;

  return (
    <div className="w-full h-full flex items-center justify-center">
      {/*
        Use an inline <svg> with the exact viewBox so all overlays are positioned
        in the same coordinate system as the floor plan drawing.
        preserveAspectRatio="xMidYMid meet" keeps the image undistorted.
      */}
      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        className="w-full h-full"
        style={{ maxHeight: '100%' }}
      >
        {/* Floor plan as background image, stretched to fill the viewBox exactly */}
        <image
          href={svgPath}
          x="0"
          y="0"
          width={vbW}
          height={vbH}
          preserveAspectRatio="none"
        />

        {/* Room overlays using exact SVG coordinates */}
        {rooms.map((room) => {
          const rect = roomRects[room.name];
          if (!rect) return null;

          const isOffice = room.type === 'office';
          const statusColor = isOffice
            ? 'bg-gray-400 dark:bg-gray-600'
            : getStatusColor(room.status);

          return (
            <foreignObject
              key={room.name}
              x={rect.x}
              y={rect.y}
              width={rect.w}
              height={rect.h}
            >
              <button
                // @ts-ignore — xmlns required for SVG foreignObject
                xmlns="http://www.w3.org/1999/xhtml"
                onClick={() => !isOffice && onRoomClick(room)}
                disabled={isOffice}
                className={`
                  ${statusColor} opacity-75
                  w-full h-full flex flex-col items-center justify-center
                  text-center overflow-hidden
                  transition-opacity duration-200
                  ${isOffice ? 'cursor-default' : 'hover:opacity-95 cursor-pointer'}
                  focus:outline-none
                `}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                <span className="relative z-10 text-[9px] sm:text-[11px] font-bold text-white leading-tight px-1 line-clamp-2 text-center">
                  {room.name}
                </span>
                {!isOffice && (
                  <span className="relative z-10 text-[7px] sm:text-[9px] text-white/80 mt-0.5 font-medium">
                    {getStatusText(room.status)}
                  </span>
                )}
              </button>
            </foreignObject>
          );
        })}
      </svg>
    </div>
  );
}

