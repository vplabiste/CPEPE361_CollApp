
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GraduationCap } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function Header() {
  const router = useRouter();

  const handleLoginNav = () => {
    if (window.location.pathname === '/') {
       const loginSection = document.getElementById('login-section');
       if (loginSection) {
        loginSection.scrollIntoView({ behavior: 'smooth' });
       }
    } else {
      router.push('/#login-section'); 
    }
  };
  
  const handleSignupNav = () => {
    router.push('/signup');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto grid h-16 max-w-screen-2xl grid-cols-2 items-center px-6 md:grid-cols-3">
        {/* Spacer for desktop view */}
        <div className="hidden md:flex">
          {/* Future nav links can go here */}
        </div>

        {/* Logo: Centered on desktop, left on mobile */}
        <div className="flex justify-start md:justify-center">
          <Link href="/" className="flex items-center gap-2" aria-label="COLLAPP Home">
            <GraduationCap className="h-7 w-7 text-primary" />
            <span className="font-headline text-xl font-semibold text-primary">COLLAPP</span>
          </Link>
        </div>
        
        {/* Buttons */}
        <div className="flex justify-end">
          <div className="flex items-center gap-x-2">
            <Button onClick={handleLoginNav} variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              Login
            </Button>
            <Button onClick={handleSignupNav} variant="default" size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Sign Up
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
