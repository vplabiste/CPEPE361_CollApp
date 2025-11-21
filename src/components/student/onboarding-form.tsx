
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { submitOnboardingForm } from '@/app/actions/student';
import { onboardingSchema, type OnboardingFormInputs } from '@/lib/student-schemas';
import { useToast } from '@/hooks/use-toast';
import { useState, useTransition, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { Loader2, AlertTriangle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { FieldErrors } from 'react-hook-form';
import { regions } from '@/lib/ph-address-data';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

export function OnboardingForm() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  const form = useForm<OnboardingFormInputs>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      firstName: '',
      middleName: '',
      lastName: '',
      sex: '',
      dateOfBirth: '',
      isInternational: 'philippines',
      region: '',
      province: '',
      city: '',
      country: '',
      internationalAddress: '',
      streetAddress: '',
      zipCode: '',
      fatherName: '',
      fatherOccupation: '',
      fatherContact: '',
      motherName: '',
      motherOccupation: '',
      motherContact: '',
      birthCertificate: undefined,
      schoolId: undefined,
    },
  });

  const isInternational = form.watch('isInternational');
  const selectedRegion = form.watch('region');
  const selectedProvince = form.watch('province');
  
  const provinces = regions.find(r => r.region_name === selectedRegion)?.province_list || [];
  const cities = provinces.find(p => p.province_name === selectedProvince)?.city_list || [];
  
  const onValidSubmit = async (data: OnboardingFormInputs) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value);
      } else if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });

    startTransition(async () => {
      const result = await submitOnboardingForm(formData, userId);
      if (result && !result.success) {
        toast({
          variant: 'destructive',
          title: 'Submission Failed',
          description: result.message,
        });
      }
    });
  };

  const onInvalidSubmit = (errors: FieldErrors<OnboardingFormInputs>) => {
    console.error("Form validation failed:", errors);
    toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: "Please check the form for errors and try again.",
    });
  };

  if (isAuthLoading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!userId) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Authentication Error</AlertTitle>
        <AlertDescription>
          No authenticated user found. Please{' '}
          <Link href="/" className="font-bold underline">
            login
          </Link>{' '}
          to continue.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
    <Form {...form}>
      <form className="space-y-12">
        
        <Card className="border-border/50 shadow-md">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your legal name and personal details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField control={form.control} name="firstName" render={({ field }) => (
                <FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="Juan" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="middleName" render={({ field }) => (
                <FormItem><FormLabel>Middle Name (Optional)</FormLabel><FormControl><Input placeholder="Santos" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="lastName" render={({ field }) => (
                <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="Dela Cruz" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                  <FormItem><FormLabel>Date of Birth</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
               <FormField control={form.control} name="sex" render={({ field }) => (
                <FormItem><FormLabel>Sex</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select sex" /></SelectTrigger></FormControl>
                  <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                </Select><FormMessage /></FormItem>
              )} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 shadow-md">
          <CardHeader>
            <CardTitle>Permanent Address</CardTitle>
            <CardDescription>Where you currently reside.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField control={form.control} name="isInternational" render={({ field }) => (
              <FormItem className="space-y-3"><FormLabel>Location</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="philippines" /></FormControl><FormLabel className="font-normal">Philippines</FormLabel></FormItem>
                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="international" /></FormControl><FormLabel className="font-normal">International</FormLabel></FormItem>
                  </RadioGroup>
                </FormControl><FormMessage /></FormItem>
            )} />

            {isInternational === 'philippines' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField control={form.control} name="region" render={({ field }) => (
                  <FormItem><FormLabel>Region</FormLabel>
                  <Select onValueChange={(value) => { field.onChange(value); form.setValue('province', ''); form.setValue('city', ''); }} value={field.value || ''}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select Region" /></SelectTrigger></FormControl>
                      <SelectContent>{regions.map(r => <SelectItem key={r.region_code} value={r.region_name}>{r.region_name}</SelectItem>)}</SelectContent>
                  </Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="province" render={({ field }) => (
                  <FormItem><FormLabel>Province</FormLabel>
                  <Select onValueChange={(value) => { field.onChange(value); form.setValue('city', ''); }} value={field.value || ''} disabled={!selectedRegion}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select Province" /></SelectTrigger></FormControl>
                      <SelectContent>{provinces.map(p => <SelectItem key={p.province_code} value={p.province_name}>{p.province_name}</SelectItem>)}</SelectContent>
                  </Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>City / Municipality</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''} disabled={!selectedProvince}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select City" /></SelectTrigger></FormControl>
                      <SelectContent>{cities.map(c => <SelectItem key={c.city_code} value={c.city_name}>{c.city_name}</SelectItem>)}</SelectContent>
                  </Select><FormMessage /></FormItem>
                )} />
              </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="country" render={({ field }) => (
                  <FormItem><FormLabel>Country</FormLabel><FormControl><Input placeholder="e.g. USA" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="internationalAddress" render={({ field }) => (
                    <FormItem><FormLabel>Full Address</FormLabel><FormControl><Input placeholder="e.g. 123 Main St, Anytown" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            )}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="streetAddress" render={({ field }) => (
                    <FormItem><FormLabel>Street Address / Barangay</FormLabel><FormControl><Input placeholder="e.g. Brgy. San Jose, 123 Rizal St." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="zipCode" render={({ field }) => (
                    <FormItem><FormLabel>Zip Code</FormLabel><FormControl><Input placeholder="e.g. 6000" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-md">
          <CardHeader>
            <CardTitle>Parent / Guardian Information</CardTitle>
            <CardDescription>Details about your parents or legal guardians.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
             <div>
                <h3 className="font-medium mb-4 text-lg">Father's Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField control={form.control} name="fatherName" render={({ field }) => (
                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Father's Full Name" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="fatherOccupation" render={({ field }) => (
                    <FormItem><FormLabel>Occupation</FormLabel><FormControl><Input placeholder="e.g. Engineer" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="fatherContact" render={({ field }) => (
                    <FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input placeholder="e.g. 09123456789" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
            </div>
            <Separator />
            <div>
                <h3 className="font-medium mb-4 text-lg">Mother's Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField control={form.control} name="motherName" render={({ field }) => (
                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Mother's Full Name" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="motherOccupation" render={({ field }) => (
                    <FormItem><FormLabel>Occupation</FormLabel><FormControl><Input placeholder="e.g. Teacher" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="motherContact" render={({ field }) => (
                    <FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input placeholder="e.g. 09123456789" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
            </div>
          </CardContent>
        </Card>

         <Card className="border-border/50 shadow-md">
          <CardHeader>
            <CardTitle>Document Submission</CardTitle>
            <CardDescription>Upload the required documents in PDF or Image format (max 5MB each).</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
            <FormField control={form.control} name="birthCertificate" render={({ field: { onChange, value, ...rest } }) => (
              <FormItem>
                <FormLabel>Birth Certificate (PDF, JPG, PNG)</FormLabel>
                <FormControl>
                  <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => onChange(e.target.files?.[0])} {...rest} className="pt-2"/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
             <FormField control={form.control} name="schoolId" render={({ field: { onChange, value, ...rest } }) => (
              <FormItem>
                <FormLabel>Recent School ID (PDF, JPG, PNG)</FormLabel>
                <FormControl>
                  <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => onChange(e.target.files?.[0])} {...rest} className="pt-2"/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <div className="flex justify-end pt-8">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button type="button" size="lg" disabled={isPending}>
                        {isPending ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting...</> : "Review & Submit"}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-warning" />Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Please review your information carefully. Once submitted, you cannot edit your profile details without administrator assistance.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Go Back & Review</AlertDialogCancel>
                    <AlertDialogAction onClick={form.handleSubmit(onValidSubmit, onInvalidSubmit)} disabled={isPending}>
                        Yes, Submit My Information
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </form>
    </Form>
    </>
  );
}
