
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { hasApplied, getUserProfile } from '@/app/actions/student';
import { ApplyForm } from './apply-form';
import { Loader2, AlertTriangle, UserPlus } from 'lucide-react';
import Link from 'next/link';

interface ApplyButtonProps {
    collegeId: string;
    requirements: { id: string; label: string; }[];
    applicationsOpen: boolean;
    programs: string[];
}

export function ApplyButton({ collegeId, requirements, applicationsOpen, programs }: ApplyButtonProps) {
    const [open, setOpen] = useState(false);
    const [applied, setApplied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [onboardingComplete, setOnboardingComplete] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                setUserId(user.uid);
                const [profile, hasAppliedStatus] = await Promise.all([
                    getUserProfile(user.uid),
                    hasApplied(user.uid, collegeId)
                ]);
                setApplied(hasAppliedStatus);
                setOnboardingComplete(!!profile?.onboardingComplete);
            } else {
                setOnboardingComplete(false);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [collegeId]);

    if (loading) {
        return <Button size="lg" className="w-full" disabled><Loader2 className="animate-spin mr-2"/> Checking Status...</Button>;
    }
    
    if (!applicationsOpen) {
        return (
            <>
                <Button size="lg" className="w-full" disabled>Applications Currently Closed</Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">The application period is closed by the administrator.</p>
            </>
        );
    }
    
    if (applied) {
        return <Button size="lg" className="w-full" disabled>Already Applied</Button>;
    }

    if (!onboardingComplete) {
         return (
            <div className="space-y-2">
                <Button size="lg" className="w-full" disabled><UserPlus className="mr-2"/>Apply Now</Button>
                <p className="text-xs text-muted-foreground text-center">
                    You must <Link href="/student/onboarding" className="underline font-semibold">complete your profile</Link> before applying.
                </p>
            </div>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="lg" className="w-full">Apply Now</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Application Submission</DialogTitle>
                    <DialogDescription>
                        Choose your preferred programs and upload the required documents. Ensure your files are clear and correct.
                    </DialogDescription>
                </DialogHeader>
                <ApplyForm 
                    collegeId={collegeId} 
                    userId={userId!} 
                    requirements={requirements}
                    programs={programs}
                    onSuccess={() => {
                        setOpen(false);
                        setApplied(true);
                        toast({ title: 'Success!', description: 'Your application has been submitted.' });
                    }}
                />
            </DialogContent>
        </Dialog>
    );
}
