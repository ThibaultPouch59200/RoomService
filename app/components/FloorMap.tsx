'use client';

import { RoomInfo } from '@/app/types';
import { getStatusColor, getStatusText } from '@/app/lib/roomUtils';

interface FloorMapProps {
  floor: number;
  rooms: RoomInfo[];
  onRoomClick: (room: RoomInfo) => void;
}

// Room positions extracted from SVG files (center coordinates)
// SVG viewBox is 1137 x 627 for all floors
const roomPositions: Record<string, { x: number; y: number }> = {
  // Floor 0
  'B-01-Bulma': { x: 313, y: 55 },
  'B-02-Elliot-Alderson': { x: 54, y: 80 },
  'S-01-Stark': { x: 313, y: 217 },
  'S-02-Pru-Ha': { x: 313, y: 406 },
  'S-03-Mei-Hatsume': { x: 495, y: 522 },

  // Floor 1
  'S-11-Microtech': { x: 107, y: 218 },
  'S-12-Pandora': { x: 205, y: 687 },
  'S-14-Poudlard': { x: 1059, y: 246 },
  'B-11-Gallifrey': { x: 493, y: 687 },
  'B-12-Le-Continental': { x: 630, y: 687 },
  'B-13-Kaer-Morhen': { x: 792, y: 687 },
  'B-14-La-Matrice': { x: 929, y: 687 },
  'B-15-Krikkit': { x: 309, y: 355 },

  // Floor 2
  'S-21a-Denis': { x: 107, y: 218 },
  'S-21b-MacAlistair': { x: 107, y: 428 },
  'S-21c-Ritchie': { x: 308, y: 427 },
  'S-22-Ada-Lovelace': { x: 174, y: 687 },
  'S-23a-Hedy-Lamarr': { x: 708, y: 718 },
  'S-23b-Al-Jazari': { x: 792, y: 687 },
  'S-24-Roland-Moreno': { x: 920, y: 266 },
  'S-25a-Gwen': { x: 1029, y: 303 },
  'S-25b-Barzey': { x: 1029, y: 513 },

  // Floor 3
  'B-31-TensorFlow': { x: 378, y: 150 },
  'S-33a-Deep': { x: 107, y: 218 },
  'S-33b-Blue': { x: 107, y: 428 },
  'S-33c-Brain': { x: 308, y: 427 },
};

const SVG_WIDTH = 1137;
const SVG_HEIGHT = 627;

export default function FloorMap({ floor, rooms, onRoomClick }: FloorMapProps) {
  const svgPath = `/svg/Z${floor}-Floor.svg`;

  return (
    <div className="relative w-full bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
      {/* Container with aspect ratio */}
      <div className="relative w-full" style={{ paddingBottom: `${(SVG_HEIGHT / SVG_WIDTH) * 100}%` }}>
        {/* Floor Plan SVG */}
        <img
          src={svgPath}
          alt={`Floor ${floor} plan`}
          className="absolute inset-0 w-full h-full object-contain"
        />

        {/* Room boxes overlaid on the floor plan */}
        <div className="absolute inset-0">
          {rooms.map((room) => {
            const position = roomPositions[room.name];
            if (!position) return null;

            const statusColor = room.type === 'office'
              ? 'bg-gray-400/90 dark:bg-gray-600/90'
              : getStatusColor(room.status);
            const isOffice = room.type === 'office';

            // Convert absolute SVG coordinates to percentages
            const leftPercent = (position.x / SVG_WIDTH) * 100;
            const topPercent = (position.y / SVG_HEIGHT) * 100;

            return (
              <button
                key={room.name}
                onClick={() => !isOffice && onRoomClick(room)}
                disabled={isOffice}
                style={{
                  left: `${leftPercent}%`,
                  top: `${topPercent}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className={`
                  ${statusColor}
                  absolute rounded-lg px-2 py-1.5 text-center
                  transition-all duration-300 ease-in-out
                  ${isOffice ? 'cursor-default opacity-80' : 'hover:scale-110 hover:shadow-xl cursor-pointer hover:z-10'}
                  focus:outline-none focus:ring-2 focus:ring-white/50
                  min-w-[60px] sm:min-w-[80px]
                `}
              >
                <div className="relative z-10">
                  <p className="text-[10px] sm:text-xs font-bold text-white whitespace-nowrap">
                    {room.name}
                  </p>
                  {!isOffice && (
                    <p className="text-[8px] sm:text-[10px] text-white/90 mt-0.5">
                      {getStatusText(room.status)}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
