'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AddCollegeForm } from '@/components/admin/add-college-form';
import { PlusCircle } from 'lucide-react';

export function AddCollegeDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-4 w-4" />
          Add New College
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New College</DialogTitle>
          <DialogDescription>
            Fill in the details for the new college and its representative.
          </DialogDescription>
        </DialogHeader>
        <AddCollegeForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
