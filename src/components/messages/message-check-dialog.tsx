
'use client';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import type { Message } from '@/lib/message-schemas';
import { format } from 'date-fns';

interface MessageCheckDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  message: Message | null;
}

export function MessageCheckDialog({ isOpen, setIsOpen, message }: MessageCheckDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Message Database Check</AlertDialogTitle>
          <AlertDialogDescription>
            This is the last message fetched from the database after you sent it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="mt-4 bg-muted p-4 rounded-md">
            {message ? (
                <div className="space-y-1">
                    <p className="font-mono text-sm"><strong>ID:</strong> {message.id}</p>
                    <p className="font-mono text-sm"><strong>Text:</strong> "{message.text}"</p>
                    <p className="font-mono text-sm"><strong>Sender:</strong> {message.senderId}</p>
                    <p className="font-mono text-sm"><strong>Timestamp:</strong> {message.createdAt ? format(new Date(message.createdAt), 'PPP p') : 'N/A'}</p>
                </div>
            ) : (
                <p className="text-destructive font-semibold">Could not fetch the last message from the database.</p>
            )}
        </div>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => setIsOpen(false)}>
            Close
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
