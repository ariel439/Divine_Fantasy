import { create } from 'zustand';

interface Room {
  id: string;
  name: string;
  rented: boolean;
  rentCost: number; // per night
  energyRestored: number; // per hour
}

interface RoomState {
  rooms: Record<string, Room>;
  // Actions
  rentRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  rooms: {},
  rentRoom: (roomId) => {
    set((state) => ({
      rooms: {
        ...state.rooms,
        [roomId]: {
          ...state.rooms[roomId],
          rented: true,
        },
      },
    }));
  },
  leaveRoom: (roomId) => {
    set((state) => ({
      rooms: {
        ...state.rooms,
        [roomId]: {
          ...state.rooms[roomId],
          rented: false,
        },
      },
    }));
  },
}));
