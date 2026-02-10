'use client';

import { RoomInfo, Activity } from '@/app/types';
import { formatTime } from '@/app/lib/roomUtils';
import { useEffect } from 'react';

interface RoomDetailProps {
  room: RoomInfo | null;
  onClose: () => void;
}

export default function RoomDetail({ room, onClose }: RoomDetailProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!room) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">{room.name}</h2>
              <p className="text-blue-100 text-sm">
                {room.type === 'office' ? 'Bureau' : 'Room'} • Floor {room.floor}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-2 transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-120px)]">
          {room.reservations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Reservations</h3>
              <p className="text-gray-600">This room is free all day!</p>
            </div>
          ) : (
            <div className="p-6 space-y-3">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Reservations Today ({room.reservations.length})
              </h3>
              {room.reservations.map((reservation) => (
                <ReservationCard key={reservation.id} reservation={reservation} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ReservationCardProps {
  reservation: Activity;
}

function ReservationCard({ reservation }: ReservationCardProps) {
  const now = new Date();
  const start = new Date(reservation.start_date);
  const end = new Date(reservation.end_date);
  const isActive = now >= start && now < end;
  const isPast = now >= end;

  return (
    <div
      className={`
        rounded-xl border-2 p-4 transition-all
        ${isActive ? 'border-red-400 bg-red-50' : isPast ? 'border-gray-200 bg-gray-50 opacity-60' : 'border-blue-200 bg-blue-50'}
      `}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className="font-semibold text-gray-900 flex-1">
          {reservation.title}
        </h4>
        {isActive && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white">
            Active Now
          </span>
        )}
        {!isActive && !isPast && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white">
            Upcoming
          </span>
        )}
        {isPast && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-400 text-white">
            Past
          </span>
        )}
      </div>

      {reservation.second_title && (
        <p className="text-sm text-gray-600 mb-2">{reservation.second_title}</p>
      )}

      <div className="flex flex-wrap items-center gap-3 text-sm">
        {/* Time */}
        <div className="flex items-center text-gray-700">
          <svg
            className="w-4 h-4 mr-1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          {formatTime(reservation.start_date)} - {formatTime(reservation.end_date)}
        </div>

        {/* Service Manager Badge */}
        <span
          className={`
            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${reservation.service_manager === 'intra' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'}
          `}
        >
          {reservation.service_manager === 'intra' ? 'Intra' : 'MyEpitech'}
        </span>

        {/* Unit Name */}
        {reservation.unit_name && (
          <span className="text-gray-600">
            {reservation.unit_name}
          </span>
        )}
      </div>
    </div>
  );
}
