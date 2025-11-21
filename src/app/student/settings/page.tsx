
'use client';

import { useState, useEffect, useTransition } from 'react';
import Image from 'next/image';
import { auth } from '@/lib/firebase';
import type { User } from '@/lib/auth-constants';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, BadgeCheck, File, KeyRound, Mail, User as UserIcon, Upload, Camera } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { updateProfilePicture, getUserProfile } from '@/app/actions/student';
import { sendPasswordReset } from '@/app/actions/auth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-1/4" />
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-32 rounded-full" />
          <Skeleton className="h-10 w-1/4 mt-4" />
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string, value?: string | null }) {
  return (
    <div className="grid grid-cols-3 gap-4 items-center">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="col-span-2 text-sm">{value || 'Not provided'}</span>
    </div>
  );
}

export default function ProfileSettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setLoading(true);
      setError(null);

      if (firebaseUser) {
        setCurrentUserId(firebaseUser.uid);
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          setUser({
            ...(profile || {}),
            uid: firebaseUser.uid,
            email: firebaseUser.email,
          } as User);
        } catch (e: any) {
          console.error("Failed to fetch user data:", e);
          setError(`Failed to fetch user data: ${e.message}`);
        }
      } else {
        setError("No authenticated user found. Please log in.");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleProfilePictureSubmit = async (formData: FormData) => {
    if (!currentUserId) {
        toast({ title: 'Error', description: "User ID not found. Please re-login.", variant: 'destructive' });
        return;
    }
    startTransition(async () => {
      const result = await updateProfilePicture(formData, currentUserId);
      if (result.success) {
        toast({ title: 'Success', description: result.message, variant: 'default' });
        if (result.newImageUrl && user) {
            setUser(prev => prev ? {...prev, profilePictureUrl: result.newImageUrl} : null);
        }
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
    });
  };

  const handlePasswordReset = async () => {
    if (!user?.email) {
      toast({ title: 'Error', description: 'No email address found for this user.', variant: 'destructive' });
      return;
    }
    if (user.uid === 'student@collapp.app') {
       toast({ title: 'Info', description: 'Password reset is disabled for demo accounts.', variant: 'default' });
       return;
    }
    startTransition(async () => {
      const result = await sendPasswordReset(user.email!);
      if (result.success) {
        toast({ title: 'Check your email', description: result.message });
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
    })
  }

  if (loading) {
    return <SettingsSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!user) {
    return (
      <Alert>
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle>Not Logged In</AlertTitle>
        <AlertDescription>Please log in to view your settings.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-primary">Settings</h1>
      
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UserIcon /> Personal Information</CardTitle>
              <CardDescription>This information was provided during onboarding and cannot be changed here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Full Name" value={`${user.firstName || ''} ${user.middleName || ''} ${user.lastName || ''}`.trim()} />
              <InfoRow label="Email" value={user.email} />
              <InfoRow label="Date of Birth" value={user.dateOfBirth} />
              <InfoRow label="Sex" value={user.sex} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><KeyRound/> Security</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                For account security, you can request a password reset link to your email.
              </p>
              <Button onClick={handlePasswordReset} disabled={isPending}>
                {isPending ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </CardContent>
             {user.uid === 'student@collapp.app' && <p className="text-xs text-muted-foreground px-6 pb-4">Password reset is disabled for demo accounts.</p>}
          </Card>

           <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><File /> Uploaded Documents</CardTitle>
              <CardDescription>Links to the documents you submitted during onboarding.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                {user.birthCertificateUrl ?
                    <a href={user.birthCertificateUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline flex items-center gap-2">
                        <BadgeCheck className="h-4 w-4"/> View Birth Certificate
                    </a>
                    : <p className="text-sm text-muted-foreground">No birth certificate uploaded.</p>
                }
                {user.schoolIdUrl ?
                    <a href={user.schoolIdUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline flex items-center gap-2">
                        <BadgeCheck className="h-4 w-4"/> View School ID
                    </a>
                    : <p className="text-sm text-muted-foreground">No school ID uploaded.</p>
                }
                 {!user.birthCertificateUrl && !user.schoolIdUrl && !user.onboardingComplete && <p className="text-sm text-muted-foreground">No documents uploaded yet. Complete onboarding to add them.</p>}
            </CardContent>
          </Card>

        </div>
        
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Camera /> Profile Picture</CardTitle>
              <CardDescription>A formal picture is recommended.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <Image 
                src={user.profilePictureUrl || 'https://placehold.co/128x128.png'} 
                alt="Profile Picture" 
                width={128} 
                height={128} 
                className="rounded-full aspect-square object-cover border-4 border-accent"
                data-ai-hint="profile avatar"
                key={user.profilePictureUrl}
              />
               <form action={handleProfilePictureSubmit} className="w-full space-y-4">
                 <Label htmlFor="profilePicture" className="sr-only">Upload new picture</Label>
                 <Input id="profilePicture" name="profilePicture" type="file" accept="image/png, image/jpeg" className="text-sm" />
                 <Button type="submit" className="w-full" disabled={isPending}>
                   <Upload className="h-4 w-4 mr-2" />
                   {isPending ? 'Uploading...' : 'Upload Picture'}
                 </Button>
               </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
