
'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import type { User } from '@/lib/auth-constants';
import type { Application } from '@/lib/college-schemas';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, Clock, FileText, MapPin, AlertTriangle, UserPlus, ArrowUpRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getUserProfile, getStudentDashboardStats, getMyApplications } from '@/app/actions/student';
import { format } from 'date-fns';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass?: string;
}

type DashboardStats = {
    totalApplications: number;
    accepted: number;
    underReview: number;
    availableColleges: number;
}

function StatCard({ title, value, icon, colorClass = 'bg-card' }: StatCardProps) {
    return (
        <Card className={`shadow-md ${colorClass}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-4xl font-bold">{value}</div>
            </CardContent>
        </Card>
    );
}

function DashboardSkeleton() {
  return (
    <div className="w-full">
      <Skeleton className="h-10 w-1/3 mb-6" />
       <div className="mt-8 mb-6">
        <Skeleton className="h-40" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <div className="mt-8">
        <Skeleton className="h-40" />
      </div>
    </div>
  )
}

function OnboardingPrompt() {
    return (
        <Card className="mb-6 bg-primary/5 border-primary/20 shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-primary">
                    <UserPlus className="h-8 w-8" />
                    Complete Your Profile
                </CardTitle>
                <CardDescription className="text-foreground/80 !mt-2">
                    Welcome to COLLAPP! To unlock all features and start applying to colleges, please complete your student profile.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Link href="/student/onboarding">
                    <Button>Start Onboarding</Button>
                </Link>
            </CardContent>
        </Card>
    )
}

export default function StudentDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentApps, setRecentApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const overallStatusBadgeVariant = {
    'Under Review': 'secondary',
    'Accepted': 'default',
    'Rejected': 'destructive',
  } as const;

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setLoading(true);
      setError(null);
      if (firebaseUser) {
        try {
           const [profile, dashboardStats, allApplications] = await Promise.all([
              getUserProfile(firebaseUser.uid),
              getStudentDashboardStats(firebaseUser.uid),
              getMyApplications(firebaseUser.uid)
          ]);
          
          if (profile) {
            setUser(profile);
          } else {
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email, onboardingComplete: false } as User);
          }
          setStats(dashboardStats);
          setRecentApps(allApplications.slice(0, 5));
        } catch (e: any) {
            console.error("Failed to fetch dashboard data:", e);
            setError("Failed to load your dashboard. Please try refreshing the page.");
        }
      } else {
        setError("No authenticated user found. Please login.");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);


  if (loading || !stats) {
    return <DashboardSkeleton />;
  }

  if (error || !user) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error || 'Could not load user data. Please try logging out and back in.'}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-primary">Welcome, {user.firstName || 'Student'}!</h1>
        </div>
        
        {!user.onboardingComplete && <OnboardingPrompt />}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard 
                title="Total Applications" 
                value={stats.totalApplications} 
                icon={<FileText className="h-5 w-5 text-muted-foreground" />} 
            />
            <StatCard 
                title="Accepted" 
                value={stats.accepted} 
                icon={<CheckCircle className="h-5 w-5 text-success-foreground" />}
                colorClass="bg-success text-success-foreground" 
            />
            <StatCard 
                title="Under Review" 
                value={stats.underReview} 
                icon={<Clock className="h-5 w-5 text-warning-foreground" />}
                colorClass="bg-warning text-warning-foreground"
            />
            <StatCard 
                title="Available Colleges" 
                value={stats.availableColleges} 
                icon={<MapPin className="h-5 w-5 text-muted-foreground" />} 
            />
        </div>

        <div className="mt-8">
            <Card>
                <CardHeader className="flex flex-row items-center">
                    <div className="grid gap-2">
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>
                            Your most recent application submissions.
                        </CardDescription>
                    </div>
                    <Button asChild size="sm" className="ml-auto gap-1">
                        <Link href="/student/applications">
                        View All
                        <ArrowUpRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {recentApps.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>College</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Submitted</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentApps.map(app => (
                                    <TableRow key={app.id}>
                                        <TableCell className="font-medium">{app.collegeName}</TableCell>
                                        <TableCell>
                                            <Badge variant={overallStatusBadgeVariant[app.status]}>{app.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{format(new Date(app.submittedAt), 'PPP')}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-center py-8 text-muted-foreground">Your recent application activities will be shown here.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
