import { Activity, RoomInfo, RoomStatus, FloorData } from '@/app/types';

// Room configuration from room.txt
export const ROOM_CONFIG = {
  0: [
    { name: 'Stark', type: 'room' as const },
    { name: 'Pru\'ha', type: 'room' as const },
    { name: 'Mei Hatsume', type: 'room' as const },
    { name: 'Eliot Alderson', type: 'office' as const },
    { name: 'Bulma', type: 'office' as const },
  ],
  1: [
    { name: 'Microtech', type: 'room' as const },
    { name: 'Kanojedo', type: 'room' as const },
    { name: 'Arrakis', type: 'room' as const },
    { name: 'Pandora', type: 'room' as const },
    { name: 'Kaer Morhen', type: 'room' as const },
    { name: 'Krikkit', type: 'room' as const },
    { name: 'La Matrice', type: 'room' as const },
    { name: 'Gallifrey', type: 'office' as const },
    { name: 'Le Continental', type: 'office' as const },
    { name: 'Poudlar', type: 'office' as const },
  ],
  2: [
    { name: 'Denis', type: 'room' as const },
    { name: 'MacAlistair', type: 'room' as const },
    { name: 'Ritchie', type: 'room' as const },
    { name: 'Ada Lovelace', type: 'room' as const },
    { name: 'Al Jazari', type: 'room' as const },
    { name: 'Roland Moreno', type: 'room' as const },
    { name: 'Gwen', type: 'room' as const },
    { name: 'Barzey', type: 'room' as const },
    { name: 'Hedy Lamarr', type: 'office' as const },
  ],
};

/**
 * Calculate the status of a room based on its reservations and current time
 */
export function calculateRoomStatus(
  reservations: Activity[],
  currentTime: Date = new Date()
): RoomStatus {
  if (reservations.length === 0) {
    return 'free';
  }

  // Check if there's an active reservation
  for (const reservation of reservations) {
    const startDate = new Date(reservation.start_date);
    const endDate = new Date(reservation.end_date);

    if (currentTime >= startDate && currentTime < endDate) {
      return 'occupied';
    }
  }

  // Check if there's a reservation within the next hour
  const oneHourFromNow = new Date(currentTime.getTime() + 60 * 60 * 1000);
  for (const reservation of reservations) {
    const startDate = new Date(reservation.start_date);

    if (startDate > currentTime && startDate <= oneHourFromNow) {
      return 'soon';
    }
  }

  return 'free';
}

/**
 * Get the next upcoming reservation for a room
 */
export function getNextReservation(
  reservations: Activity[],
  currentTime: Date = new Date()
): Activity | undefined {
  const upcomingReservations = reservations
    .filter((r) => new Date(r.start_date) > currentTime)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

  return upcomingReservations[0];
}

/**
 * Process activities and organize them by room and floor
 */
export function processActivities(activities: Activity[]): FloorData[] {
  const roomReservations = new Map<string, Activity[]>();

  // Group activities by room name
  activities.forEach((activity) => {
    if (activity.room && activity.room.length > 0) {
      const roomName = activity.room[0].name;
      if (!roomReservations.has(roomName)) {
        roomReservations.set(roomName, []);
      }
      roomReservations.get(roomName)!.push(activity);
    }
  });

  // Sort reservations by start time for each room
  roomReservations.forEach((reservations) => {
    reservations.sort(
      (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );
  });

  // Build floor data
  const floors: FloorData[] = [];
  const currentTime = new Date();

  for (const [floor, rooms] of Object.entries(ROOM_CONFIG)) {
    const floorNumber = parseInt(floor);
    const floorRooms: RoomInfo[] = rooms.map((room) => {
      const reservations = roomReservations.get(room.name) || [];
      const status = calculateRoomStatus(reservations, currentTime);
      const nextReservation = getNextReservation(reservations, currentTime);

      return {
        name: room.name,
        type: room.type,
        floor: floorNumber,
        status,
        reservations,
        nextReservation,
      };
    });

    floors.push({
      floor: floorNumber,
      rooms: floorRooms,
    });
  }

  return floors;
}

/**
 * Get status color class for Tailwind
 */
export function getStatusColor(status: RoomStatus): string {
  switch (status) {
    case 'free':
      return 'bg-status-free';
    case 'soon':
      return 'bg-status-soon';
    case 'occupied':
      return 'bg-status-occupied';
  }
}

/**
 * Get status text
 */
export function getStatusText(status: RoomStatus): string {
  switch (status) {
    case 'free':
      return 'Available';
    case 'soon':
      return 'Soon occupied';
    case 'occupied':
      return 'Occupied';
  }
}

/**
 * Format date and time for display
 */
export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
