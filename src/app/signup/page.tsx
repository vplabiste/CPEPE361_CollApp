
import { SignupForm } from '@/components/auth/signup-form';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header'; 

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center py-12 bg-muted/40 px-4">
        <SignupForm />
      </main>
      <Footer />
    </div>
  );
}
