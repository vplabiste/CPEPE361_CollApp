
'use client';

import { useMemo, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { applicationProgramsSchema, fileSchema, ACCEPTED_DOC_TYPES } from '@/lib/student-schemas';
import { submitApplication } from '@/app/actions/student';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface ApplyFormProps {
    collegeId: string;
    userId: string;
    requirements: { id: string; label: string }[];
    programs: string[];
    onSuccess: () => void;
}

// Dynamically generate the full schema
const generateSchema = (requirements: { id: string; label: string }[]) => {
    const requirementSchemas = Object.fromEntries(
        requirements.map(req => [
            req.id,
            fileSchema(ACCEPTED_DOC_TYPES, true)
        ])
    );
    return applicationProgramsSchema.extend(requirementSchemas);
};

export function ApplyForm({ collegeId, userId, requirements, programs, onSuccess }: ApplyFormProps) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    // Memoize the dynamically generated schema to avoid re-creating it on every render
    const applicationSchema = useMemo(() => generateSchema(requirements), [requirements]);

    // Infer the form's input type from the dynamic schema
    type ApplicationInputs = z.infer<typeof applicationSchema>;

    const form = useForm<ApplicationInputs>({
        resolver: zodResolver(applicationSchema),
        mode: 'onChange', // This ensures the form is validated on every change
        defaultValues: {
            firstChoiceProgram: '',
            secondChoiceProgram: '',
            ...Object.fromEntries(requirements.map(req => [req.id, undefined]))
        },
    });

    const firstChoice = form.watch('firstChoiceProgram');
    const { isValid } = form.formState; // Get the validity state from the form

    const onSubmit = (data: ApplicationInputs) => {
        const formData = new FormData();
        const submissionData: Record<string, any> = { ...data };

        if (submissionData.secondChoiceProgram === '_none_') {
            submissionData.secondChoiceProgram = '';
        }

        Object.entries(submissionData).forEach(([key, value]) => {
            if (value instanceof File) {
                formData.append(`requirement-${key}`, value);
            } else if (key === 'secondChoiceProgram') {
                 formData.append(key, String(value || ''));
            } else if (value) {
                formData.append(key, String(value));
            }
        });
        
        startTransition(async () => {
            const result = await submitApplication(formData, userId, collegeId);
            if (result.success) {
                onSuccess();
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Submission Failed',
                    description: result.message,
                });
            }
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[60vh] overflow-y-auto p-1 pr-4">
                 <div className="space-y-4">
                    <h4 className="font-medium">Program Choices</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="firstChoiceProgram" render={({ field }) => (
                            <FormItem>
                                <FormLabel>1st Choice Program</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select your first choice" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {programs.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="secondChoiceProgram" render={({ field }) => (
                            <FormItem>
                                <FormLabel>2nd Choice Program (Optional)</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select your second choice" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="_none_">None</SelectItem>
                                        {programs.filter(p => p !== firstChoice).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}/>
                    </div>
                </div>

                <Separator />
                
                <div>
                    <h4 className="font-medium mb-4">Document Requirements</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {requirements.map(req => (
                            <FormField
                                key={req.id}
                                control={form.control}
                                name={req.id as keyof ApplicationInputs}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{req.label}</FormLabel>
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
                        ))}
                    </div>
                </div>

                 <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isPending || !isValid}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Application
                    </Button>
                </div>
            </form>
        </Form>
    );
}
