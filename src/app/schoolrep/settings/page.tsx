
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings, Edit, EyeOff, Loader2, AlertTriangle } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getCollegeByRepId, unpublishCollege } from '@/app/actions/schoolrep';
import type { College } from '@/lib/college-schemas';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

function SettingsSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-10 w-full" />
            </CardContent>
        </Card>
    );
}

export default function SchoolRepSettingsPage() {
    const [college, setCollege] = useState<College | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const fetchedCollege = await getCollegeByRepId(user.uid);
                    setCollege(fetchedCollege);
                } catch (e) {
                    setError("Failed to fetch your college data.");
                }
            } else {
                setError("You are not logged in.");
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleUnpublish = () => {
        if (!college) return;
        startTransition(async () => {
            const result = await unpublishCollege(college.id);
            if (!result.success) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: result.message,
                });
            } else {
                 toast({
                    title: 'Profile Unpublished',
                    description: 'You are being redirected to the editor.',
                });
            }
        });
    };

  if (loading) {
      return <SettingsSkeleton />
  }

  if (error || !college) {
      return (
          <Alert variant="destructive">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || 'Could not find college data for your account.'}</AlertDescription>
        </Alert>
      );
  }

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" /> College Profile Settings
          </CardTitle>
           <CardDescription>
            Manage your college's profile visibility and information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                    <h3 className="font-medium">{college.name}</h3>
                    <p className="text-sm text-muted-foreground">Profile Publication Status</p>
                </div>
                <Badge variant={college.isPublished ? "default" : "secondary"}>
                    {college.isPublished ? 'Published' : 'Unpublished'}
                </Badge>
            </div>
            {college.isPublished ? (
                <div>
                    <p className="text-sm text-muted-foreground mb-2">
                        To edit your college information, you must first unpublish it. This will temporarily hide it from student searches. You can re-publish it from the edit page once you're done.
                    </p>
                    <Button onClick={handleUnpublish} disabled={isPending}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <EyeOff className="mr-2 h-4 w-4" />}
                        Unpublish and Edit Profile
                    </Button>
                </div>
            ) : (
                <div>
                     <p className="text-sm text-muted-foreground mb-2">
                        Your profile is currently unpublished. Go to the onboarding page to edit and re-publish it.
                    </p>
                    <Button onClick={handleUnpublish}>
                        <Edit className="mr-2 h-4 w-4" />
                        Go to Edit Page
                    </Button>
                </div>
            )}
            
        </CardContent>
      </Card>
    </div>
  );
}
