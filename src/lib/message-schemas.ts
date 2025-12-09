
import type { UserRole } from './auth-constants';

export interface Message {
  id?: string;
  text: string;
  senderId: string;
  createdAt: any; // Can be Date, ISO string, or Firestore Timestamp
  isRead: boolean;
}

export interface Chat {
  id: string;
  participants: string[];
  participantInfo: {
    [uid: string]: {
      name: string;
      profilePictureUrl: string;
      role: UserRole;
    }
  },
  lastMessage: {
    text: string;
    senderId: string;
    createdAt: any; // Can be Date, ISO string, or Firestore Timestamp
  };
  updatedAt: any; // Can be Date, ISO string, or Firestore Timestamp
  unreadCount?: {
    [uid: string]: number;
  }
}
