'use client';

import { useState, useEffect } from 'react';
import { ApiResponse, RoomInfo, FloorData } from '@/app/types';
import { processActivities, getTodayDate } from '@/app/lib/roomUtils';
import RoomCard from '@/app/components/RoomCard';
import RoomDetail from '@/app/components/RoomDetail';

export default function Home() {
  const [floors, setFloors] = useState<FloorData[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<RoomInfo | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchRoomData = async () => {
    try {
      const date = getTodayDate();
      const response = await fetch(
        `/api/rooms?startDate=${date}&endDate=${date}`
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

  // Initial load
  useEffect(() => {
    fetchRoomData();
  }, []);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRoomData();
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
          <p className="text-xl text-gray-700 font-medium">Loading rooms...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-red-600"
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              fetchRoomData();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">EpiRoom</h1>
              <p className="text-sm text-gray-600 mt-1">Epitech Lille Room Availability</p>
            </div>
            <div className="text-right">
              <button
                onClick={fetchRoomData}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
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
                <p className="text-xs text-gray-500 mt-1">
                  Updated {lastUpdate.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Legend */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Status Legend</h2>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-status-free rounded mr-2"></div>
              <span className="text-sm text-gray-700">Available</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-status-soon rounded mr-2"></div>
              <span className="text-sm text-gray-700">Soon Occupied (≤1h)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-status-occupied rounded mr-2"></div>
              <span className="text-sm text-gray-700">Occupied</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-400 rounded mr-2"></div>
              <span className="text-sm text-gray-700">Office/Bureau</span>
            </div>
          </div>
        </div>

        {/* Floor Selector */}
        <div className="bg-white rounded-xl shadow-sm p-2 mb-6">
          <div className="flex gap-2">
            {floors.map((floor) => (
              <button
                key={floor.floor}
                onClick={() => setSelectedFloor(floor.floor)}
                className={`
                  flex-1 py-3 px-4 rounded-lg font-semibold transition-all
                  ${selectedFloor === floor.floor
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
              <section key={floor.floor} className="bg-white rounded-2xl shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-3">
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

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-12">
        <div className="text-center text-sm text-gray-600">
          <p>EpiRoom - Real-time room availability for Epitech Lille</p>
          <p className="mt-1">Updates automatically every 2 minutes</p>
        </div>
      </footer>
    </main>
  );
}
