'use client';

import { useState, useEffect } from 'react';
import { ApiResponse, RoomInfo, FloorData } from '@/app/types';
import { processActivities, getTodayDate } from '@/app/lib/roomUtils';
import RoomCard from '@/app/components/RoomCard';
import RoomDetail from '@/app/components/RoomDetail';
import ThemeToggle from '@/app/components/ThemeToggle';

export default function Home() {
  const [floors, setFloors] = useState<FloorData[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<RoomInfo | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());
  const [showLegend, setShowLegend] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchRoomData = async (date?: string) => {
    try {
      const fetchDate = date || selectedDate;
      const response = await fetch(
        `/api/rooms?startDate=${fetchDate}&endDate=${fetchDate}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch room data');
      }

      const data = await response.json();
      const apiResponse = data as ApiResponse;
      const processedFloors = processActivities(apiResponse.activities);
      setFloors(processedFloors);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Initial load and refetch when date changes
  useEffect(() => {
    fetchRoomData();
  }, [selectedDate]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRoomData();
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [selectedDate]);

  // Update room statuses every 30 seconds without re-fetching
  useEffect(() => {
    if (floors.length === 0) return;

    const interval = setInterval(() => {
      setFloors((prevFloors) => {
        return prevFloors.map((floor) => ({
          ...floor,
          rooms: floor.rooms.map((room) => ({
            ...room,
            status: require('@/app/lib/roomUtils').calculateRoomStatus(room.reservations),
            nextReservation: require('@/app/lib/roomUtils').getNextReservation(room.reservations),
          })),
        }));
      });
    }, 30 * 1000);

    return () => clearInterval(interval);
  }, [floors.length]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
          <p className="text-xl text-gray-700 dark:text-gray-300 font-medium">Loading rooms...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              fetchRoomData();
            }}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">EpiRoom</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Epitech Lille Room Availability</p>
            </div>
            <div className="text-right flex items-center gap-2">
              <button
                onClick={() => setShowDatePicker(true)}
                className="inline-flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                aria-label="Select date"
                title="Select date"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </button>
              <button
                onClick={() => setShowLegend(true)}
                className="inline-flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-lg transition-colors"
                aria-label="Show legend"
                title="Show legend"
              >
                ?
              </button>
              <div>
                <button
                  onClick={() => fetchRoomData()}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                  aria-label="Refresh"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  Refresh
                </button>
                {lastUpdate && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Updated {lastUpdate.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Date Display */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Viewing date</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <button
            onClick={() => setShowDatePicker(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
          >
            Change Date
          </button>
        </div>

        {/* Floor Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-2 mb-6">
          <div className="flex gap-2">
            {floors.map((floor) => (
              <button
                key={floor.floor}
                onClick={() => setSelectedFloor(floor.floor)}
                className={`
                  flex-1 py-3 px-4 rounded-lg font-semibold transition-all
                  ${selectedFloor === floor.floor
                    ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                `}
              >
                Floor {floor.floor}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Floor */}
        <div className="space-y-8">
          {floors
            .filter((floor) => floor.floor === selectedFloor)
            .map((floor) => (
              <section key={floor.floor} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 border-b dark:border-gray-700 pb-3">
                  Floor {floor.floor}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {floor.rooms.map((room) => (
                    <RoomCard
                      key={room.name}
                      room={room}
                      onClick={() => {
                        if (room.type !== 'office') {
                          setSelectedRoom(room);
                        }
                      }}
                    />
                  ))}
                </div>
              </section>
            ))}
        </div>
      </div>

      {/* Room Detail Modal */}
      {selectedRoom && (
        <RoomDetail room={selectedRoom} onClose={() => setSelectedRoom(null)} />
      )}

      {/* Legend Modal */}
      {showLegend && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowLegend(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 px-6 py-5 text-white rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Status Legend</h2>
                  <p className="text-blue-100 dark:text-blue-200 text-sm">Room availability indicators</p>
                </div>
                <button
                  onClick={() => setShowLegend(false)}
                  className="text-white/80 hover:text-white hover:bg-white/10 dark:hover:bg-white/20 rounded-full p-2 transition-colors"
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
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-status-free rounded-lg flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Available</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">No reservations for this room</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-status-soon rounded-lg flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Soon Occupied</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Reserved within 1 hour or less</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-status-occupied rounded-lg flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Occupied</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Currently reserved and in use</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-400 dark:bg-gray-600 rounded-lg flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Office/Bureau</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Staff offices (not bookable)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Picker Modal */}
      {showDatePicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowDatePicker(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 px-6 py-5 text-white rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Select Date</h2>
                  <p className="text-blue-100 dark:text-blue-200 text-sm">Choose a date to view room availability</p>
                </div>
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="text-white/80 hover:text-white hover:bg-white/10 dark:hover:bg-white/20 rounded-full p-2 transition-colors"
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
            <div className="p-6 space-y-4">
              {/* Current Date Display */}
              <div className="text-center pb-4 border-b dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Currently viewing</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              {/* Quick Select Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const today = getTodayDate();
                    setSelectedDate(today);
                    setShowDatePicker(false);
                  }}
                  className="w-full py-3 px-4 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium rounded-lg transition-colors text-left flex items-center justify-between"
                >
                  <span>Today</span>
                  <span className="text-sm text-blue-600 dark:text-blue-400">
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </button>

                <button
                  onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const tomorrowStr = tomorrow.toISOString().split('T')[0];
                    setSelectedDate(tomorrowStr);
                    setShowDatePicker(false);
                  }}
                  className="w-full py-3 px-4 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium rounded-lg transition-colors text-left flex items-center justify-between"
                >
                  <span>Tomorrow</span>
                  <span className="text-sm text-blue-600 dark:text-blue-400">
                    {(() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      return tomorrow.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    })()}
                  </span>
                </button>
              </div>

              {/* Custom Date Picker */}
              <div className="pt-4 border-t dark:border-gray-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Or choose a specific date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setShowDatePicker(false);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-12">
        <div className="flex items-center justify-center gap-4">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p>EpiRoom - Real-time room availability for Epitech Lille</p>
            <p className="mt-1">Updates automatically every 2 minutes</p>
          </div>
          <ThemeToggle />
        </div>
      </footer>
    </main>
  );
}
