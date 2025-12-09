
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { getChatUsers } from '@/app/actions/admin';
import type { User } from '@/lib/auth-constants';
import type { Chat } from '@/lib/message-schemas';
import { Frown, Loader2, PlusCircle, Search } from 'lucide-react';
import { getChatId } from '@/lib/utils';
import { getUserProfile } from '@/app/actions/student';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface NewChatDialogProps {
  onChatSelect: (chat: Chat) => void;
}

export function NewChatDialog({ onChatSelect }: NewChatDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    if (!open) return;

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setLoading(true);
        try {
          const profile = await getUserProfile(authUser.uid);
          setCurrentUser(profile);
          if (profile) {
            const chatUsers = await getChatUsers(authUser.uid, profile.role);
            setUsers(chatUsers);
          }
        } catch (error) {
          console.error("Failed to fetch data:", error);
          setUsers([]);
        } finally {
          setLoading(false);
        }
      } else {
        // Not authenticated
        setCurrentUser(null);
        setUsers([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [open]);

  const filteredUsers = users.filter(user =>
    `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectUser = (user: User) => {
    if (!currentUser) return;

    const chatId = getChatId(currentUser.uid, user.uid);
    
    const newChat: Chat = {
      id: chatId,
      participants: [currentUser.uid, user.uid],
      participantInfo: {
        [currentUser.uid]: {
          name: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`,
          profilePictureUrl: currentUser.profilePictureUrl || '',
          role: currentUser.role,
        },
        [user.uid]: {
          name: `${user.firstName || ''} ${user.lastName || ''}`,
          profilePictureUrl: user.profilePictureUrl || '',
          role: user.role,
        },
      },
      lastMessage: {
        text: `You are starting a conversation with ${user.firstName || 'a user'}.`,
        senderId: 'system',
        createdAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };
    
    onChatSelect(newChat);
    setOpen(false);
    setSearchTerm('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <PlusCircle className="mr-2 h-4 w-4" /> New Message
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start a New Conversation</DialogTitle>
          <DialogDescription>
            Search for a user to start a new chat.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Search by name or email..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <ScrollArea className="h-[300px] mt-4">
            {loading ? (
                 <div className="space-y-4 p-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-3 w-[100px]" />
                        </div>
                    </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-1 p-2">
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map(user => (
                            <div key={user.uid} onClick={() => handleSelectUser(user)} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer">
                                <Image
                                    src={user.profilePictureUrl || `https://placehold.co/40x40.png`}
                                    alt="User avatar"
                                    width={40}
                                    height={40}
                                    className="rounded-full aspect-square object-cover"
                                    data-ai-hint="profile avatar"
                                />
                                <div>
                                    <div className="font-medium">{`${user.firstName || ''} ${user.lastName || ''}`.trim()}</div>
                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <Frown className="mx-auto h-8 w-8 mb-2"/>
                            <p>No users found.</p>
                        </div>
                    )}
                </div>
            )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
