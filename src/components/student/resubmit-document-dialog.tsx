
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
import { resubmitDocument } from '@/app/actions/student';
import { resubmissionSchema, type ResubmissionInputs } from '@/lib/student-schemas';
import type { SubmittedDocument } from '@/lib/college-schemas';

interface ResubmitDocumentDialogProps {
    applicationId: string;
    document: SubmittedDocument;
    onSuccess: () => void;
}

export function ResubmitDocumentDialog({ applicationId, document, onSuccess }: ResubmitDocumentDialogProps) {
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
            const result = await resubmitDocument(formData, applicationId, document.id);
            if (result.success) {
                toast({ title: 'Success', description: result.message });
                setOpen(false);
                onSuccess(); // To refresh the parent component's data
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">Resubmit Document</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Resubmit: {document.label}</DialogTitle>
                    <DialogDescription>
                        Upload a new version of this document. This will replace the previously submitted file.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="documentFile"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Document File</FormLabel>
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
                                Upload and Submit
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
