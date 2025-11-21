
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
import { addCollege } from '@/app/actions/colleges';
import { addCollegeSchema, type AddCollegeFormInputs } from '@/lib/college-schemas';
import { useToast } from '@/hooks/use-toast';
import { useTransition, useState } from 'react';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface AddCollegeFormProps {
  onSuccess?: () => void;
}

export function AddCollegeForm({ onSuccess }: AddCollegeFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<AddCollegeFormInputs>({
    resolver: zodResolver(addCollegeSchema),
    defaultValues: {
      name: '',
      description: '',
      logo: undefined,
      url: '',
      repEmail: '',
      repPassword: '',
    },
  });

  const onSubmit = (data: AddCollegeFormInputs) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value);
      } else if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });

    startTransition(async () => {
      const result = await addCollege(formData);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
        form.reset();
        onSuccess?.();
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message, duration: 5000 });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h3 className="font-semibold text-foreground">College Details</h3>
        <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>College Name</FormLabel><FormControl><Input placeholder="e.g., University of Technology" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem><FormLabel>Introductory Message (for landing page)</FormLabel><FormControl><Textarea placeholder="A leading university in..." {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={form.control} name="url" render={({ field }) => (
            <FormItem><FormLabel>Website URL</FormLabel><FormControl><Input placeholder="https://university.edu" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={form.control} name="logo" render={({ field: { onChange, value, ...rest } }) => (
            <FormItem><FormLabel>College Logo (Image file)</FormLabel><FormControl><Input type="file" accept="image/*" onChange={(e) => onChange(e.target.files?.[0])} {...rest} disabled={isPending} className="file:text-primary"/></FormControl><FormMessage /></FormItem>
        )}/>
        
        <Separator />

        <h3 className="font-semibold text-foreground">School Representative Account</h3>
         <FormField control={form.control} name="repEmail" render={({ field }) => (
            <FormItem><FormLabel>Representative's Email</FormLabel><FormControl><Input type="email" placeholder="rep@university.edu" {...field} disabled={isPending}/></FormControl><FormMessage /></FormItem>
        )}/>
         <FormField control={form.control} name="repPassword" render={({ field }) => (
            <FormItem>
                <FormLabel>Initial Password</FormLabel>
                <FormControl>
                    <div className="relative">
                        <Input 
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••" 
                            {...field} 
                            disabled={isPending} 
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                </FormControl>
                <FormMessage />
            </FormItem>
        )}/>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add College & Create Account
        </Button>
      </form>
    </Form>
  );
}
