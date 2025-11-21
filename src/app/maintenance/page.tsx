import { Wrench } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/40 text-foreground">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4">
        <Wrench className="h-20 w-20 text-primary mb-6" />
        <h1 className="text-4xl font-bold tracking-tight text-primary mb-4">Under Maintenance</h1>
        <p className="text-lg text-muted-foreground max-w-lg">
          Our site is currently undergoing scheduled maintenance to improve your experience. We'll be back online shortly. Thank you for your patience!
        </p>
      </main>
      <Footer />
    </div>
  );
}
