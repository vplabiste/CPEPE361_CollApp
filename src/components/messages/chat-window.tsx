
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { sendMessage, markMessagesAsRead } from '@/app/actions/messages';
import type { Chat, Message } from '@/lib/message-schemas';
import { MessageCheckDialog } from './message-check-dialog';

interface ChatWindowProps {
  chat: Chat;
}

export function ChatWindow({ chat }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const currentUser = auth.currentUser;

  // State for the message check dialog
  const [isCheckDialogOpen, setIsCheckDialogOpen] = useState(false);
  const [lastSavedMessage, setLastSavedMessage] = useState<Message | null>(null);
  
  const otherParticipantId = chat.participants.find(p => p !== currentUser?.uid);
  const otherParticipantInfo = otherParticipantId ? chat.participantInfo[otherParticipantId] : null;
  
  useEffect(() => {
    if (!currentUser || !chat?.id) {
        setLoading(false);
        return;
    }
    
    setLoading(true);
    const messagesRef = collection(db, 'chats', chat.id, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => {
          const data = doc.data();
          const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString();
          return { id: doc.id, ...data, createdAt } as Message;
      });
      setMessages(msgs);
      setLoading(false);
      
      setTimeout(() => {
        const viewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
           viewport.scrollTop = viewport.scrollHeight;
        }
      }, 100);
    }, (error) => {
        console.error("Error fetching messages:", error);
        setLoading(false);
    });
    
    markMessagesAsRead(chat.id, currentUser.uid);

    return () => unsubscribe();
  }, [chat.id, currentUser]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser || isSending) return;
    
    setIsSending(true);
    try {
        const result = await sendMessage(chat.id, currentUser.uid, newMessage, chat.participantInfo);
        
        if (result.success && result.data) {
            setLastSavedMessage(result.data);
            setIsCheckDialogOpen(true);
            setNewMessage('');
        } else {
            console.error("Failed to send message:", result.message);
            // Optionally, show an error toast to the user
        }
    } catch (error) {
        console.error("An error occurred while sending the message:", error);
    } finally {
        setIsSending(false);
    }
  };
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="flex flex-row items-center gap-4 border-b">
          {otherParticipantInfo ? (
              <>
                  <Image
                  src={otherParticipantInfo.profilePictureUrl || 'https://placehold.co/40x40.png'}
                  alt={otherParticipantInfo.name}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                  data-ai-hint="profile avatar"
                  />
                  <CardTitle>{otherParticipantInfo.name}</CardTitle>
              </>
          ) : (
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-6 w-32" />
            </div>
          )}
        </CardHeader>
        <CardContent className="flex-grow p-0 overflow-hidden">
          <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-3/5" />
                <Skeleton className="h-10 w-3/5 ml-auto" />
                <Skeleton className="h-10 w-2/5" />
              </div>
            ) : (
              messages.map((msg, index) => {
                if (msg.senderId === 'system') {
                    return (
                        <div key={`system-${index}`} className="text-center text-xs text-muted-foreground my-4">
                            {msg.text}
                        </div>
                    )
                }
                const isCurrentUser = msg.senderId === currentUser?.uid;
                return (
                  <div
                      key={msg.id || `msg-${index}`}
                      className={cn(
                      "flex mb-4",
                      isCurrentUser ? "justify-end" : "justify-start"
                      )}
                  >
                      <div
                          className={cn(
                              "rounded-lg px-4 py-2 max-w-sm",
                              isCurrentUser
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                      >
                          {msg.text}
                      </div>
                  </div>
                )
              })
            )}
          </ScrollArea>
        </CardContent>
        <CardFooter className="p-4 border-t">
          <div className="flex w-full items-center space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              disabled={isSending || !otherParticipantInfo}
            />
            <Button type="button" onClick={handleSendMessage} disabled={!newMessage.trim() || isSending || !otherParticipantInfo}>
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </CardFooter>
      </Card>
      <MessageCheckDialog 
        isOpen={isCheckDialogOpen}
        setIsOpen={setIsCheckDialogOpen}
        message={lastSavedMessage}
      />
    </>
  );
}
