
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EditCollegeForm } from '@/components/admin/edit-college-form';
import type { College } from '@/lib/college-schemas';

interface EditCollegeDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    college: College;
    onSuccess: () => void;
}

export function EditCollegeDialog({ isOpen, setIsOpen, college, onSuccess }: EditCollegeDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit College: {college.name}</DialogTitle>
          <DialogDescription>
            Update the details for this college.
          </DialogDescription>
        </DialogHeader>
        <EditCollegeForm
          college={college}
          onSuccess={() => {
            onSuccess();
            setIsOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
