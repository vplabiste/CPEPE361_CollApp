
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertTriangle, Frown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { auth } from '@/lib/firebase';
import { getCollegeByRepId, getApplicationsByCollege } from '@/app/actions/schoolrep';
import type { Application, College } from '@/lib/college-schemas';
import { ApplicantCard } from './applicant-card';
import { Button } from '@/components/ui/button';

function ApplicationsSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
        </div>
    );
}

type FilterType = 'all' | 'pending' | 'resubmission' | 'accepted' | 'rejected';

export default function SchoolRepApplicationsPage() {
    const [college, setCollege] = useState<College | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterType>('all');
    const [activeAccordionItem, setActiveAccordionItem] = useState<string | undefined>(undefined);

    const fetchAllData = useCallback(async (user: any) => {
        try {
            const fetchedCollege = await getCollegeByRepId(user.uid);
            if (fetchedCollege) {
                setCollege(fetchedCollege);
                const fetchedApplications = await getApplicationsByCollege(fetchedCollege.id);
                setApplications(fetchedApplications);
            } else {
                setError("No college is associated with your account.");
            }
        } catch (e: any) {
            setError("Failed to load application data.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                setLoading(true);
                await fetchAllData(user);
            } else {
                setError("You are not logged in.");
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [fetchAllData]);

    const handleUpdate = async () => {
        setActiveAccordionItem(undefined);
        setLoading(true);
        const user = auth.currentUser;
        if (user) {
            await fetchAllData(user);
        }
    };

    const filteredApplications = useMemo(() => {
        if (filter === 'all') return applications;
        return applications.filter(app => {
            switch(filter) {
                case 'pending':
                    return app.status === 'Under Review' && !app.documents.some(doc => doc.status === 'Resubmit');
                case 'resubmission':
                    return app.status === 'Under Review' && app.documents.some(doc => doc.status === 'Resubmit');
                case 'accepted':
                    return app.status === 'Accepted';
                case 'rejected':
                    return app.status === 'Rejected';
                default:
                    return true;
            }
        });
    }, [applications, filter]);
    
    const filterCounts = useMemo(() => ({
        all: applications.length,
        pending: applications.filter(app => app.status === 'Under Review' && !app.documents.some(doc => doc.status === 'Resubmit')).length,
        resubmission: applications.filter(app => app.status === 'Under Review' && app.documents.some(doc => doc.status === 'Resubmit')).length,
        accepted: applications.filter(app => app.status === 'Accepted').length,
        rejected: applications.filter(app => app.status === 'Rejected').length,
    }), [applications]);

    if (loading) {
        return <ApplicationsSkeleton />;
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
    
    if (!college?.isPublished) {
         return (
            <Alert>
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle>Profile Unpublished</AlertTitle>
                <AlertDescription>Your college profile is not published. Please complete onboarding to view and receive applications.</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="w-full space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Manage Applications</h1>
                    <p className="text-muted-foreground">Review and manage student applications for {college.name}.</p>
                </div>
                <Card className="p-4">
                    <div className="flex items-center gap-4">
                        <Users className="h-6 w-6 text-primary" />
                        <div>
                            <p className="text-2xl font-bold">{applications.length}</p>
                            <p className="text-sm text-muted-foreground">Total Applicants</p>
                        </div>
                    </div>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Applicant List</CardTitle>
                    <CardDescription>Filter and review student applications.</CardDescription>
                    <div className="flex flex-wrap gap-2 pt-4">
                        <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>All ({filterCounts.all})</Button>
                        <Button variant={filter === 'pending' ? 'default' : 'outline'} onClick={() => setFilter('pending')}>Pending ({filterCounts.pending})</Button>
                        <Button variant={filter === 'resubmission' ? 'default' : 'outline'} onClick={() => setFilter('resubmission')}>Resubmission ({filterCounts.resubmission})</Button>
                        <Button variant={filter === 'accepted' ? 'default' : 'outline'} onClick={() => setFilter('accepted')}>Accepted ({filterCounts.accepted})</Button>
                        <Button variant={filter === 'rejected' ? 'default' : 'outline'} onClick={() => setFilter('rejected')}>Rejected ({filterCounts.rejected})</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredApplications.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full" value={activeAccordionItem} onValueChange={setActiveAccordionItem}>
                            {filteredApplications.map(app => (
                                <ApplicantCard key={app.id} application={app} onUpdate={handleUpdate} />
                            ))}
                        </Accordion>
                    ) : (
                        <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-lg">
                            <Frown className="mx-auto h-12 w-12" />
                            <h3 className="mt-4 text-lg font-semibold">No Applications Found</h3>
                            <p className="mt-2 text-sm">There are no applications matching the current filter.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
