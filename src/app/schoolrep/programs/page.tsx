
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ClipboardList, AlertTriangle, Users, Frown } from "lucide-react";
import { auth } from '@/lib/firebase';
import { getCollegeByRepId, getAcceptedApplicationsByCollege } from '@/app/actions/schoolrep';
import type { Application, College } from '@/lib/college-schemas';
import { format } from 'date-fns';

function ProgramsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <div className="space-y-4 pt-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}

export default function SchoolRepProgramsPage() {
  const [college, setCollege] = useState<College | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = useCallback(async (user: any) => {
    try {
      const fetchedCollege = await getCollegeByRepId(user.uid);
      if (fetchedCollege) {
        setCollege(fetchedCollege);
        if (fetchedCollege.isPublished) {
          const fetchedApplications = await getAcceptedApplicationsByCollege(fetchedCollege.id);
          setApplications(fetchedApplications);
        }
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

  const applicationsByProgram = useMemo(() => {
    const grouped: Record<string, Application[]> = {};
    applications.forEach(app => {
      const program = app.finalProgram;
      if (program) {
        if (!grouped[program]) {
          grouped[program] = [];
        }
        grouped[program].push(app);
      }
    });
    return grouped;
  }, [applications]);

  if (loading) {
    return <ProgramsSkeleton />;
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
        <AlertDescription>Your college profile is not published. Please complete onboarding to manage programs and view accepted students.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" /> Program Enrollment
          </CardTitle>
          <CardDescription>
            View all students accepted into specific academic programs at {college.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(applicationsByProgram).length > 0 ? (
            <Accordion type="multiple" className="w-full">
              {Object.entries(applicationsByProgram).map(([program, students]) => (
                <AccordionItem value={program} key={program}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex justify-between items-center w-full pr-4">
                      <span className="font-semibold text-lg">{program}</span>
                      <div className="flex items-center gap-2 bg-muted p-2 rounded-md">
                        <Users className="h-4 w-4" />
                        <span className="text-sm">{students.length} Student{students.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-1">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead className="text-right">Decision Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map(student => (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">{student.studentInfo.name}</TableCell>
                            <TableCell>{student.studentInfo.email}</TableCell>
                            <TableCell className="text-right">
                              {student.decisionDate ? format(new Date(student.decisionDate), 'PPP') : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-lg">
              <Frown className="mx-auto h-12 w-12" />
              <h3 className="mt-4 text-lg font-semibold">No Accepted Students Yet</h3>
              <p className="mt-2 text-sm">Once you accept applications, students will appear here grouped by their program.</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Total accepted students: {applications.length}</p>
        </CardFooter>
      </Card>
    </div>
  );
}
