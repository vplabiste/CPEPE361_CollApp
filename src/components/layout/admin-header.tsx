'use client';

import {
  GraduationCap,
  PanelLeft,
  Settings,
  LogOut,
  Users,
  Building2,
  LayoutDashboard,
} from 'lucide-react';
import Link from 'next/link';
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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
       // Fallback for demo user if signOut fails
      router.push('/');
    }
  };

  const getBreadcrumb = (path: string) => {
    const parts = path.split('/').filter(Boolean);
    if (parts.length < 2) return 'Dashboard';
    const page = parts[1];
    return page.charAt(0).toUpperCase() + page.slice(1);
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
                href="/admin"
                className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                >
                <GraduationCap className="h-5 w-5 transition-all group-hover:scale-110" />
                <span className="sr-only">COLLAPP</span>
                </Link>
                <Link href="/admin" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
                    <LayoutDashboard className="h-5 w-5" />
                    Dashboard
                </Link>
                <Link href="/admin/users" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
                    <Users className="h-5 w-5" />
                    Users
                </Link>
                <Link href="/admin/colleges" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
                    <Building2 className="h-5 w-5" />
                    Colleges
                </Link>
                 <Link href="/admin/settings" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
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
              <Link href="/admin">Admin</Link>
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
              src={"https://placehold.co/36x36.png"}
              width={36}
              height={36}
              alt="Admin Avatar"
              className="overflow-hidden rounded-full aspect-square object-cover"
              data-ai-hint="profile avatar"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/admin/settings" className="flex items-center gap-2 cursor-pointer">
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
