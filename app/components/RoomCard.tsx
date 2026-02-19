'use client';

import { RoomInfo } from '@/app/types';
import { getStatusColor, getStatusText, formatTime } from '@/app/lib/roomUtils';

interface RoomCardProps {
  room: RoomInfo;
  onClick: () => void;
}

export default function RoomCard({ room, onClick }: RoomCardProps) {
  const statusColor = room.type === 'office' ? 'bg-gray-400 dark:bg-gray-600' : getStatusColor(room.status);
  const statusText = getStatusText(room.status);
  const isOffice = room.type === 'office';

  return (
    <button
      onClick={onClick}
      disabled={isOffice}
      className={`
        ${statusColor}
        relative overflow-hidden rounded-xl p-4 text-left
        transition-all duration-300 ease-in-out
        ${isOffice ? 'cursor-default' : 'hover:brightness-110 hover:shadow-xl cursor-pointer'}
        focus:outline-none focus:ring-4 focus:ring-white/50
        w-full
      `}
    >
      <div className="relative z-10">
        {/* Room Name */}
        <h3 className="text-lg font-bold text-white mb-1">
          {room.name}
        </h3>

        {/* Room Type Badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block bg-white/20 dark:bg-white/30 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs text-white font-medium">
            {room.type === 'office' ? 'Bureau' : 'Room'}
          </span>
          {!isOffice && (
            <span className="inline-block bg-white/30 dark:bg-white/40 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs text-white font-semibold">
              {statusText}
            </span>
          )}
        </div>

        {/* Next Reservation Info */}
        {!isOffice && room.status === 'soon' && room.nextReservation && (
          <div className="mt-2 text-sm text-white/90">
            <p className="font-medium">Next at {formatTime(room.nextReservation.start_date)}</p>
          </div>
        )}

        {!isOffice && room.status === 'occupied' && room.reservations.length > 0 && (
          <div className="mt-2 text-sm text-white/90">
            {(() => {
              const now = new Date();
              const currentReservation = room.reservations.find((r) => {
                const start = new Date(r.start_date);
                const end = new Date(r.end_date);
                return now >= start && now < end;
              });
              if (currentReservation) {
                return (
                  <p className="font-medium">
                    Until {formatTime(currentReservation.end_date)}
                  </p>
                );
              }
              return null;
            })()}
          </div>
        )}

        {/* Reservation Count */}
        {!isOffice && room.reservations.length > 0 && (
          <div className="mt-3 text-xs text-white/80">
            {room.reservations.length} reservation{room.reservations.length > 1 ? 's' : ''} today
          </div>
        )}
      </div>

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
    </button>
  );
}
