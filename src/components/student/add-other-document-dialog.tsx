'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import { resubmissionSchema, type ResubmissionInputs } from '@/lib/student-schemas';
import type { Application } from '@/lib/college-schemas';
import { addOtherDocument } from '@/app/actions/student';

interface AddOtherDocumentDialogProps {
    application: Application;
    onSuccess: () => void;
}

export function AddOtherDocumentDialog({ application, onSuccess }: AddOtherDocumentDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const form = useForm<ResubmissionInputs>({
        resolver: zodResolver(resubmissionSchema),
        defaultValues: { documentFile: undefined },
    });

    const onSubmit = (data: ResubmissionInputs) => {
        const formData = new FormData();
        formData.append('documentFile', data.documentFile);

        startTransition(async () => {
            // We'll implement the addOtherDocument action
            const result = await addOtherDocument(formData, application.id);
            if (result.success) {
                toast({ title: 'Success', description: result.message });
                setOpen(false);
                onSuccess();
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Upload className="mr-2 h-4 w-4" /> Add Other File
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Other Document</DialogTitle>
                    <DialogDescription>
                        Upload an additional document for your application to {application.collegeName}.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="documentFile"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Document File</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)}
                                            className="file:text-primary"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end">
                            <Button type="submit" disabled={isPending}>
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                Upload Document
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
