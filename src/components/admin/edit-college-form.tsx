
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { updateCollege } from '@/app/actions/colleges';
import { editCollegeSchema, type College, type EditCollegeFormInputs } from '@/lib/college-schemas';
import { useToast } from '@/hooks/use-toast';
import { useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

interface EditCollegeFormProps {
  college: College;
  onSuccess?: () => void;
}

export function EditCollegeForm({ college, onSuccess }: EditCollegeFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<EditCollegeFormInputs>({
    resolver: zodResolver(editCollegeSchema),
    defaultValues: {
      name: college.name || '',
      description: college.description || '',
      url: college.url || '',
      logo: undefined,
      isPublished: college.isPublished || false,
    },
  });

  const onSubmit = (data: EditCollegeFormInputs) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value);
      } else if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });

    startTransition(async () => {
      const result = await updateCollege(formData, college.id);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
        onSuccess?.();
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message, duration: 5000 });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>College Name</FormLabel><FormControl><Input {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={form.control} name="url" render={({ field }) => (
            <FormItem><FormLabel>Website URL</FormLabel><FormControl><Input {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>
        )}/>
         <FormField control={form.control} name="isPublished" render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                    <FormLabel>Publish Profile</FormLabel>
                </div>
                 <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isPending} />
                </FormControl>
            </FormItem>
        )}/>
        <FormItem>
            <FormLabel>Current Logo</FormLabel>
            <div className="mt-2">
                <Image src={college.logoUrl} alt="Current Logo" width={80} height={80} className="rounded-md object-contain border p-1" />
            </div>
        </FormItem>
        <FormField control={form.control} name="logo" render={({ field: { onChange, value, ...rest } }) => (
            <FormItem><FormLabel>Upload New Logo (Optional)</FormLabel><FormControl><Input type="file" accept="image/*" onChange={(e) => onChange(e.target.files?.[0])} {...rest} disabled={isPending} className="file:text-primary"/></FormControl><FormMessage /></FormItem>
        )}/>
        
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </form>
    </Form>
  );
}
