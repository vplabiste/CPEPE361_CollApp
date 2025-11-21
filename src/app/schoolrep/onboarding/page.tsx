
import { OnboardingForm } from '@/components/schoolrep/onboarding-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Building2 } from 'lucide-react';

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <Card className="shadow-2xl">
          <CardHeader className="text-center bg-card border-b p-8">
             <div className="mx-auto bg-primary text-primary-foreground rounded-full h-16 w-16 flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8" />
            </div>
            <CardTitle className="font-headline text-3xl tracking-tight text-primary">College Profile Setup</CardTitle>
            <CardDescription className="text-lg text-muted-foreground pt-2">
              Publish your college profile on COLLAPP. Please set your application requirements and programs offered.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <OnboardingForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
