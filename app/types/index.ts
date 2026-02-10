export interface Room {
  id: number;
  name: string;
}

export interface Activity {
  id: string;
  title: string;
  second_title: string;
  unit_name: string;
  start_date: string; // ISO 8601 format with Z timezone
  end_date: string; // ISO 8601 format with Z timezone
  room?: Room[];
  service_manager: 'intra' | 'my';
}

export interface ApiResponse {
  activities: Activity[];
}

export type RoomStatus = 'free' | 'soon' | 'occupied';

export interface RoomInfo {
  name: string;
  type: 'room' | 'office';
  floor: number;
  status: RoomStatus;
  reservations: Activity[];
  nextReservation?: Activity;
}

export interface FloorData {
  floor: number;
  rooms: RoomInfo[];
}
