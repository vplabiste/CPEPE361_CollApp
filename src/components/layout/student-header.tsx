
'use client';

import {
  Bell,
  GraduationCap,
  Home,
  LineChart,
  Package,
  PanelLeft,
  Search,
  Settings,
  LogOut,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { getUserProfile } from '@/app/actions/student';

export function StudentHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);

   useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        if (profile && profile.profilePictureUrl) {
          setProfilePictureUrl(profile.profilePictureUrl);
        } else {
          setProfilePictureUrl(null);
        }
      } else {
        setProfilePictureUrl(null);
      }
    });

    return () => unsubscribe();
  }, [pathname]); // Re-run on path change to catch updates after settings page change

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getBreadcrumb = (path: string) => {
    switch (path) {
        case '/student':
            return 'Dashboard';
        case '/student/colleges':
            return 'Colleges';
        case '/student/applications':
            return 'Applications';
        case '/student/settings':
            return 'Settings';
        case '/student/onboarding':
            return 'Onboarding';
        default:
            return 'Student';
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <Sheet>
            <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="sm:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
            </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
            <nav className="grid gap-6 text-lg font-medium">
                <Link
                href="/student"
                className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                >
                <GraduationCap className="h-5 w-5 transition-all group-hover:scale-110" />
                <span className="sr-only">COLLAPP</span>
                </Link>
                <Link
                href="/student"
                className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                <Home className="h-5 w-5" />
                Dashboard
                </Link>
                <Link
                href="/student/colleges"
                className="flex items-center gap-4 px-2.5 text-foreground"
                >
                <Package className="h-5 w-5" />
                Colleges
                </Link>
                <Link
                href="/student/applications"
                className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                <FileText className="h-5 w-5" />
                Applications
                </Link>
                 <Link
                href="/student/settings"
                className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                <Settings className="h-5 w-5" />
                Settings
                </Link>
            </nav>
            </SheetContent>
      </Sheet>
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/student">Student</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{getBreadcrumb(pathname)}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="relative ml-auto flex-1 md:grow-0">
        {/* Search can be added later */}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="overflow-hidden rounded-full"
          >
            <Image
              src={profilePictureUrl || "https://placehold.co/36x36.png"}
              width={36}
              height={36}
              alt="Avatar"
              className="overflow-hidden rounded-full aspect-square object-cover"
              data-ai-hint="profile avatar"
              key={profilePictureUrl}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/student/settings" className="flex items-center gap-2 cursor-pointer">
              <Settings className="h-4 w-4"/> Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer flex items-center gap-2">
             <LogOut className="h-4 w-4"/> Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
