
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, CheckCircle, XCircle, Mail, MessageSquare, AlertTriangle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { auth } from '@/lib/firebase';
import { getMyApplications } from '@/app/actions/student';
import type { Application, DocumentStatus } from '@/lib/college-schemas';
import { format } from 'date-fns';
import { ResubmitDocumentDialog } from '@/components/student/resubmit-document-dialog';

function ApplicationSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
    );
}

const statusIcons: { [key in DocumentStatus]: React.ReactNode } = {
    'Pending': <Clock className="h-4 w-4 text-yellow-500" />,
    'Accepted': <CheckCircle className="h-4 w-4 text-green-500" />,
    'Rejected': <XCircle className="h-4 w-4 text-red-500" />,
    'Resubmit': <AlertTriangle className="h-4 w-4 text-orange-500" />,
};

const statusColors: { [key in DocumentStatus]: string } = {
    'Pending': 'border-yellow-500/50 bg-yellow-500/10',
    'Accepted': 'border-green-500/50 bg-green-500/10',
    'Rejected': 'border-red-500/50 bg-red-500/10',
    'Resubmit': 'border-orange-500/50 bg-orange-500/10',
};

const overallStatusBadgeVariant = {
    'Under Review': 'secondary',
    'Accepted': 'default',
    'Rejected': 'destructive',
} as const;


export default function ApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchApplications = useCallback(async () => {
        setLoading(true);
        const user = auth.currentUser;
        if (user) {
            const fetchedApps = await getMyApplications(user.uid);
            setApplications(fetchedApps);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                fetchApplications();
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [fetchApplications]);

    if (loading) {
        return <ApplicationSkeleton />;
    }

    return (
        <div className="w-full">
            <h1 className="text-3xl font-bold tracking-tight text-primary mb-6">My Applications</h1>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Application Status</CardTitle>
                    <CardDescription>Track the status of your college applications here.</CardDescription>
                </CardHeader>
                <CardContent>
                    {applications.length === 0 ? (
                        <p className="text-center py-12 text-muted-foreground">You haven't submitted any applications yet.</p>
                    ) : (
                        <Accordion type="single" collapsible className="w-full">
                            {applications.map(app => (
                                <AccordionItem value={app.id} key={app.id}>
                                    <AccordionTrigger>
                                        <div className="flex justify-between items-center w-full pr-4">
                                            <div className="flex flex-col text-left">
                                                <span className="font-semibold text-lg">{app.collegeName}</span>
                                                <span className="text-sm text-muted-foreground">
                                                    Submitted on: {format(new Date(app.submittedAt), 'PPP')}
                                                </span>
                                            </div>
                                            <Badge variant={overallStatusBadgeVariant[app.status]}>{app.status}</Badge>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 space-y-6 bg-muted/50 rounded-md">
                                        {app.finalMessage && (
                                            <Card className="bg-background">
                                                <CardHeader>
                                                    <CardTitle className="flex items-center gap-2 text-base"><Mail className="h-5 w-5 text-primary"/> Message from College</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-sm text-muted-foreground">{app.finalMessage}</p>
                                                    <p className="text-xs text-muted-foreground mt-2">
                                                        Decision Date: {format(new Date(app.decisionDate || app.submittedAt), 'PPP')}
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        )}

                                        <div>
                                            <h4 className="font-semibold mb-3">Submitted Documents</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {app.documents.map(doc => {
                                                    // FIX: Handle both 'Resubmit' and legacy 'Needs Resubmission' statuses
                                                    const isResubmit = doc.status === 'Resubmit' || (doc.status as string) === 'Needs Resubmission';
                                                    const currentStatus = isResubmit ? 'Resubmit' : doc.status;

                                                    return (
                                                        <div key={doc.id} className={`p-3 border rounded-lg ${statusColors[currentStatus]}`}>
                                                            <div className="flex items-center justify-between">
                                                                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline text-sm">{doc.label}</a>
                                                                <div className="flex items-center gap-2">
                                                                    {statusIcons[currentStatus]}
                                                                    <span className="text-sm">{currentStatus}</span>
                                                                </div>
                                                            </div>
                                                            {isResubmit && (
                                                                <div className="mt-2 space-y-2">
                                                                    {doc.resubmissionNote && (
                                                                        <div className="p-2 bg-background/50 rounded-md text-xs">
                                                                            <p className="flex items-center gap-1.5"><MessageSquare className="h-3 w-3" /> <strong>Note:</strong> {doc.resubmissionNote}</p>
                                                                        </div>
                                                                    )}
                                                                    <div className="text-right">
                                                                        <ResubmitDocumentDialog
                                                                            applicationId={app.id}
                                                                            document={doc}
                                                                            onSuccess={fetchApplications}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

