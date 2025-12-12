
'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChatList } from '@/components/messages/chat-list';
import { ChatWindow } from '@/components/messages/chat-window';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquareText } from 'lucide-react';
import type { Chat } from '@/lib/message-schemas';

export default function MessagesPage() {
    const searchParams = useSearchParams();
    const initialChatId = searchParams.get('chatId');
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

    const handleChatSelect = (chat: Chat) => {
        setSelectedChat(chat);
    };

    return (
        <div className="min-h-[calc(100vh-theme(spacing.28))] flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 flex-grow">
                <div className="md:col-span-1 lg:col-span-1 h-full">
                    <ChatList onChatSelect={handleChatSelect} initialChatId={initialChatId}/>
                </div>
                <div className="md:col-span-2 lg:col-span-3 h-full">
                {selectedChat ? (
                        <ChatWindow key={selectedChat.id} chat={selectedChat} />
                    ) : (
                        <Card className="h-full flex flex-col items-center justify-center">
                            <CardContent className="text-center text-muted-foreground">
                                <MessageSquareText className="h-16 w-16 mx-auto mb-4" />
                                <h2 className="text-xl font-semibold">Select a Conversation</h2>
                                <p>Choose a chat from the left to start messaging.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
