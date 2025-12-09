
'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

import { auth, db } from '@/lib/firebase';
import type { Chat } from '@/lib/message-schemas';
import { cn } from '@/lib/utils';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { MessagesSquare } from 'lucide-react';
import { NewChatDialog } from './new-chat-dialog';
import { FCMProvider } from './fcm-provider';

interface ChatListProps {
  onChatSelect: (chat: Chat) => void;
  initialChatId?: string | null;
}

export function ChatList({ onChatSelect, initialChatId }: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(initialChatId || null);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setLoading(true);
      setCurrentUser(user);
      if (!user) {
        setChats([]);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (initialChatId) {
      setSelectedChatId(initialChatId);
    }
  }, [initialChatId]);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid)
    );

    const unsubscribeChats = onSnapshot(q, (snapshot) => {
      const chatsData = snapshot.docs.map(doc => {
        const data = doc.data();
        const updatedAt = (data.updatedAt as Timestamp)?.toDate ? (data.updatedAt as Timestamp).toDate().toISOString() : new Date().toISOString();
        return { id: doc.id, ...data, updatedAt } as Chat;
      });
      
      // Sort on the client to avoid needing a composite index
      chatsData.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      
      setChats(chatsData);
      
      if (initialChatId && !selectedChatId && chatsData.length > 0) {
        const foundChat = chatsData.find(c => c.id === initialChatId);
        if (foundChat) {
            onChatSelect(foundChat);
            setSelectedChatId(foundChat.id);
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching chats:", error);
      setLoading(false);
    });

    return () => unsubscribeChats();
  }, [currentUser, initialChatId, onChatSelect, selectedChatId]);


  const handleSelectChat = (chat: Chat) => {
    setSelectedChatId(chat.id);
    onChatSelect(chat);
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-4 w-[100px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <FCMProvider>
        <Card className="h-full flex flex-col">
        <CardHeader>
            <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-grow overflow-hidden">
            <ScrollArea className="h-full">
            {chats.length > 0 ? (
                <div className="p-2 space-y-1">
                {chats.map((chat) => {
                    if (!currentUser) return null;
                    const otherParticipantId = chat.participants.find(p => p !== currentUser.uid);
                    if (!otherParticipantId) return null;

                    const otherParticipantInfo = chat.participantInfo[otherParticipantId];
                    if (!otherParticipantInfo) return null;

                    const unreadCount = chat.unreadCount?.[currentUser.uid] || 0;
                    
                    const updatedAtDate = chat.updatedAt ? new Date(chat.updatedAt) : null;

                    return (
                    <div
                        key={chat.id}
                        onClick={() => handleSelectChat(chat)}
                        className={cn(
                        'grid grid-cols-[auto_1fr_auto] items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted',
                        selectedChatId === chat.id && 'bg-muted'
                        )}
                    >
                        <Image
                        src={otherParticipantInfo.profilePictureUrl || 'https://placehold.co/48x48.png'}
                        alt={otherParticipantInfo.name}
                        width={48}
                        height={48}
                        className="rounded-full object-cover shrink-0"
                        data-ai-hint="profile avatar"
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex justify-between items-center">
                            <p className={`font-semibold text-base truncate ${unreadCount > 0 ? 'text-primary' : ''}`}>{otherParticipantInfo.name}</p>
                            {updatedAtDate && !isNaN(updatedAtDate.getTime()) && (
                            <p className="text-xs text-muted-foreground shrink-0 ml-2">
                                {formatDistanceToNow(updatedAtDate, { addSuffix: true })}
                            </p>
                            )}
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground truncate">{chat.lastMessage?.text}</p>
                            {unreadCount > 0 && (
                            <div className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center shrink-0 ml-2">
                                {unreadCount}
                            </div>
                            )}
                        </div>
                        </div>
                    </div>
                    );
                })}
                </div>
            ) : (
                <div className="p-6 text-center text-muted-foreground h-full flex flex-col justify-center items-center">
                <MessagesSquare className="h-10 w-10 mx-auto mb-4" />
                <h3 className="font-semibold">No Conversations</h3>
                <p className="text-sm">You haven't started any conversations yet.</p>
                </div>
            )}
            </ScrollArea>
        </CardContent>
        <CardFooter className="p-2 border-t">
            <NewChatDialog onChatSelect={handleSelectChat}/>
        </CardFooter>
        </Card>
    </FCMProvider>
  );
}
