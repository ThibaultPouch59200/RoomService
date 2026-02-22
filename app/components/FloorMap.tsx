'use client';

import { RoomInfo } from '@/app/types';
import { getStatusText } from '@/app/lib/roomUtils';
import floor0Data from '@/map/floor-0.json';
import floor1Data from '@/map/floor-1.json';
import floor2Data from '@/map/floor-2.json';

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
};

type Point = { x: number; y: number };

interface RoomMapEntry {
  floor: number;
  points: Point[];
  x: number;
  y: number;
  w: number;
  h: number;
}

// Merge all floor JSON files into a single lookup
const ALL_ROOM_DATA = {
  ...floor0Data,
  ...floor1Data,
  ...floor2Data,
} as Record<string, RoomMapEntry>;

function getStatusFill(status: string, isOffice: boolean): string {
  if (isOffice) return '#9ca3af';
  switch (status) {
    case 'free':     return '#10b981';
    case 'soon':     return '#f59e0b';
    case 'occupied': return '#ef4444';
    default:         return '#9ca3af';
  }
}

function getCentroid(points: Point[]): { cx: number; cy: number } {
  const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
  const cy = points.reduce((s, p) => s + p.y, 0) / points.length;
  return { cx, cy };
}

function toSVGPoints(points: Point[]): string {
  return points.map((p) => `${p.x},${p.y}`).join(' ');
}

export default function FloorMap({ floor, rooms, onRoomClick }: FloorMapProps) {
  const { w: vbW, h: vbH } = SVG_VIEWBOX[floor] ?? { w: 1137, h: 627 };
  const svgPath = `/svg/Z${floor}-Floor.svg`;

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        className="w-full h-full"
        style={{ maxHeight: '100%' }}
      >
        {/* Floor plan background */}
        <image
          href={svgPath}
          x="0"
          y="0"
          width={vbW}
          height={vbH}
          preserveAspectRatio="none"
        />

        {/* Room overlays using polygon points from JSON */}
        {rooms.map((room) => {
          const data = ALL_ROOM_DATA[room.name];
          if (!data) return null;

          const isOffice = room.type === 'office';
          const fill = getStatusFill(room.status, isOffice);
          const { cx, cy } = getCentroid(data.points);
          const pointsStr = toSVGPoints(data.points);
          const words = room.name.split(' ');
          const lineH = 12;
          const totalLines = words.length + (isOffice ? 0 : 1);
          const startY = cy - ((totalLines - 1) * lineH) / 2;

          return (
            <g
              key={room.name}
              onClick={() => !isOffice && onRoomClick(room)}
              style={{ cursor: isOffice ? 'default' : 'pointer' }}
            >
              <polygon points={pointsStr} fill={fill} />
              {words.map((word, i) => (
                <text
                  key={i}
                  x={cx}
                  y={startY + i * lineH}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="11"
                  fontWeight="bold"
                  fill="white"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {word}
                </text>
              ))}
              {!isOffice && (
                <text
                  x={cx}
                  y={startY + words.length * lineH}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="9"
                  fill="rgba(255,255,255,0.85)"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {getStatusText(room.status)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
