'use client';

import { StudentSidebar } from '@/components/layout/student-sidebar';
import { StudentHeader } from '@/components/layout/student-header';
import { useRoleAuth } from '@/hooks/use-role-auth';
import { Skeleton } from '@/components/ui/skeleton';


export default function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthorized } = useRoleAuth('student');

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full bg-muted/40">
        <div className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex items-center gap-4 px-2 sm:py-5">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="size-8 rounded-lg" />
        </div>
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14 w-full">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <Skeleton className="h-6 w-32 hidden md:flex" />
                <div className="ml-auto flex items-center gap-2">
                    <Skeleton className="size-9 rounded-full" />
                </div>
            </header>
            <main className="flex-1 p-4 sm:px-6 sm:py-0">
                <Skeleton className="h-40 w-full" />
            </main>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <StudentSidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14 w-full">
        <StudentHeader />
        <main className="flex-1 gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  );
}
