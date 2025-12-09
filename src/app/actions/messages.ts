
'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import type { Chat, Message } from '@/lib/message-schemas';

export async function sendMessage(
  chatId: string,
  senderId: string,
  text: string,
  participantInfo: Chat['participantInfo']
): Promise<{ success: boolean; message: string; data?: Message }> {
  if (!text.trim()) {
    return { success: false, message: 'Message cannot be empty.' };
  }

  try {
    const chatRef = adminDb.collection('chats').doc(chatId);
    const messagesRef = chatRef.collection('messages');
    
    const participants = chatId.split('_');
    const receiverId = participants.find(p => p !== senderId);

    if (!receiverId) {
        return { success: false, message: 'Receiver not found.' };
    }

    const timestamp = FieldValue.serverTimestamp();
    
    const newMessageData = {
      text,
      senderId,
      createdAt: timestamp,
      isRead: false,
    };
    
    const messageDocRef = await messagesRef.add(newMessageData);

    const unreadCountUpdateKey = `unreadCount.${receiverId}`;
    
    // Atomically create/update the chat document.
    // This ensures the chat exists before we try to add messages to it.
    await chatRef.set({
        participants,
        participantInfo,
        lastMessage: {
          text,
          senderId,
          createdAt: timestamp,
        },
        updatedAt: timestamp,
        [unreadCountUpdateKey]: FieldValue.increment(1),
    }, { merge: true });
    
    // The message has been saved. We can now return it to the client for verification.
    // The `createdAt` will be null locally, but the listener will get the real server time.
    const finalMessage: Message = {
      id: messageDocRef.id,
      text: newMessageData.text,
      senderId: newMessageData.senderId,
      isRead: newMessageData.isRead,
      createdAt: new Date().toISOString(), // Use client-time for the immediate return object.
    };

    return { success: true, message: 'Message sent.', data: finalMessage };
  } catch (error: any) {
    console.error('Error sending message:', error);
    return { success: false, message: `Failed to send message: ${error.message}` };
  }
}

export async function markMessagesAsRead(chatId: string, userId: string): Promise<void> {
  if (!chatId || !userId) return;
  try {
    const chatRef = adminDb.collection('chats').doc(chatId);
    await chatRef.set({ unreadCount: { [userId]: 0 } }, { merge: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
}

export async function saveFCMToken(userId: string, token: string): Promise<{success: boolean}> {
    if (!userId || !token) {
        return { success: false };
    }
    try {
        const userDocRef = adminDb.collection('users').doc(userId);
        await userDocRef.update({ fcmToken: token });
        return { success: true };
    } catch (error) {
        console.error("Error saving FCM token:", error);
        return { success: false };
    }
}
