
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useState, useTransition, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { Loader2, AlertTriangle, PlusCircle, X, MapPin } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { College } from '@/lib/college-schemas';
import { getCollegeByRepId, completeOnboarding } from '@/app/actions/schoolrep';
import { schoolRepOnboardingSchema, type SchoolRepOnboardingInputs, availableRequirements } from '@/lib/college-schemas';
import { cn } from '@/lib/utils';
import { regions } from '@/lib/ph-address-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export function OnboardingForm() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [college, setCollege] = useState<College | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  const form = useForm<SchoolRepOnboardingInputs>({
    resolver: zodResolver(schoolRepOnboardingSchema),
    defaultValues: {
      region: '',
      city: '',
      requirements: [],
      programs: [{ value: "" }],
      customRequirements: [{ value: "" }],
      brochures: undefined,
    },
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const fetchedCollege = await getCollegeByRepId(user.uid);
        setCollege(fetchedCollege);
        if (fetchedCollege?.region) {
          setIsEditMode(true);
          form.reset({
            region: fetchedCollege.region || '',
            city: fetchedCollege.city || '',
            requirements: fetchedCollege.applicationRequirements || [],
            programs: fetchedCollege.programs?.map(p => ({ value: p })) || [{ value: "" }],
            customRequirements: fetchedCollege.customRequirements?.map(cr => ({ value: cr })) || [{ value: "" }],
            brochures: undefined // Do not pre-fill file inputs
          });
        }
      } else {
        setCollege(null);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, [form]);
  
  const selectedRegion = form.watch('region');
  const cities = regions.find(r => r.region_name === selectedRegion)?.province_list.flatMap(p => p.city_list) || [];

  const { fields: programFields, append: appendProgram, remove: removeProgram } = useFieldArray({
    name: "programs",
    control: form.control,
  });

  const { fields: customReqFields, append: appendCustomReq, remove: removeCustomReq } = useFieldArray({
    name: "customRequirements",
    control: form.control,
  });

  const onSubmit = (data: SchoolRepOnboardingInputs) => {
    const formData = new FormData();
    formData.append('region', data.region);
    formData.append('city', data.city);

    data.requirements.forEach(req => formData.append('requirements', req));
    data.programs.forEach(prog => {
       if (prog.value) formData.append('programs', prog.value);
    });
    data.customRequirements?.forEach(creq => {
      if (creq.value) formData.append('customRequirements', creq.value);
    });
    
    if (data.brochures && data.brochures.length > 0) {
      data.brochures.forEach(file => {
        if (file instanceof File) {
          formData.append('brochures', file);
        }
      });
    }
    
    startTransition(async () => {
      const result = await completeOnboarding(formData, college?.id || null);
      if (result && !result.success) {
        toast({
          variant: 'destructive',
          title: 'Submission Failed',
          description: result.message,
        });
      } else if (result?.success) {
         toast({
          title: 'Profile Published!',
          description: 'Your college is now visible to students.',
        });
      }
    });
  };

  if (isAuthLoading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!college) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Could not find college information for your account. Please{' '}
          <Link href="/" className="font-bold underline">
            re-login
          </Link>{' '}
          or contact support.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">

        <Card className="border-border/50 shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><MapPin/> School Location</CardTitle>
                <CardDescription>Specify the primary campus location.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="region" render={({ field }) => (
                  <FormItem><FormLabel>Region</FormLabel>
                  <Select onValueChange={(value) => { field.onChange(value); form.setValue('city', ''); }} value={field.value || ''}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select Region" /></SelectTrigger></FormControl>
                      <SelectContent>{regions.map(r => <SelectItem key={r.region_code} value={r.region_name}>{r.region_name}</SelectItem>)}</SelectContent>
                  </Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>City / Municipality</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''} disabled={!selectedRegion}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select City" /></SelectTrigger></FormControl>
                      <SelectContent>{cities.map(c => <SelectItem key={c.city_code} value={c.city_name}>{c.city_name}</SelectItem>)}</SelectContent>
                  </Select><FormMessage /></FormItem>
                )} />
            </CardContent>
        </Card>

        <Card className="border-border/50 shadow-md">
          <CardHeader>
            <CardTitle>Application Requirements</CardTitle>
            <CardDescription>Select the standard documents students need to submit to apply to {college.name}.</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="requirements"
              render={() => (
                <FormItem className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableRequirements.map((item) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name="requirements"
                      render={({ field }) => {
                        return (
                          <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), item.id])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== item.id
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {item.label}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-md">
          <CardHeader>
            <CardTitle>Other Application Requirements</CardTitle>
            <CardDescription>Add any other specific requirements not listed above.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {customReqFields.map((field, index) => (
              <FormField
                control={form.control}
                key={field.id}
                name={`customRequirements.${index}.value`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={cn(index !== 0 && "sr-only")}>
                      Other Requirements
                    </FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input {...field} placeholder="e.g., Portfolio for Arts students" />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeCustomReq(index)} disabled={customReqFields.length <= 1 && form.getValues(`customRequirements.${index}.value`) === ''}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => appendCustomReq({ value: "" })}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Requirement
            </Button>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 shadow-md">
          <CardHeader>
            <CardTitle>Academic Programs</CardTitle>
            <CardDescription>List the programs or courses your college offers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {programFields.map((field, index) => (
              <FormField
                control={form.control}
                key={field.id}
                name={`programs.${index}.value`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={cn(index !== 0 && "sr-only")}>
                      Programs
                    </FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input {...field} placeholder="e.g., Bachelor of Science in Computer Science" />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeProgram(index)} disabled={programFields.length <= 1 && form.getValues(`programs.${index}.value`) === ''}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => appendProgram({ value: "" })}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Program
            </Button>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 shadow-md">
          <CardHeader>
            <CardTitle>Promotional Brochures (Optional)</CardTitle>
            <CardDescription>Upload up to 5 brochures (PDF, max 5MB each). If you are editing, uploading new files will replace all existing ones.</CardDescription>
          </CardHeader>
          <CardContent>
             <FormField control={form.control} name="brochures" render={({ field: { onChange, value, ...rest } }) => (
              <FormItem>
                <FormControl>
                  <Input type="file" accept=".pdf" multiple onChange={(e) => {
                     const files = e.target.files ? Array.from(e.target.files) : [];
                      if (files.length > 5) {
                        toast({ variant: 'destructive', title: 'Upload Limit Exceeded', description: 'You can only upload a maximum of 5 brochures.' });
                        e.target.value = ''; 
                        onChange(undefined);
                      } else {
                        onChange(files);
                      }
                  }} {...rest} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <div className="flex justify-end pt-8">
            <Button type="submit" size="lg" disabled={isPending}>
                {isPending ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Publishing...</> : (isEditMode ? "Update & Publish Profile" : "Publish College Profile")}
            </Button>
        </div>
      </form>
    </Form>
  );
}
