
import { GraduationCap } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border/40 py-8 bg-muted/50 text-muted-foreground">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between text-sm">
        <div className="flex items-center gap-2 mb-4 md:mb-0">
          <GraduationCap className="h-5 w-5 text-foreground" />
          <span className="text-foreground">&copy; {new Date().getFullYear()} COLLAPP</span>
        </div>
        <nav className="flex gap-4">
          <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
        </nav>
      </div>
    </footer>
  );
}
