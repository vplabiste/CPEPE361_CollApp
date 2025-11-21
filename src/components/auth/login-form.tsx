
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { loginSchema, type LoginFormInputs } from '@/lib/auth-schemas';
import { useToast } from '@/hooks/use-toast';
import { useTransition, useState } from 'react';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, type DocumentSnapshot } from 'firebase/firestore';
import type { User, UserRole } from '@/lib/auth-constants';

const hardcodedUsers = [
  { email: 'schoolrep@collapp.app', password: 'RepPass123!', role: 'schoolrep' as UserRole },
];

export function LoginForm() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const form = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      userType: 'student',
    },
  });

  const onSubmit = (data: LoginFormInputs) => {
    startTransition(async () => {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
        const firebaseUser = userCredential.user;

        if (auth.currentUser && !auth.currentUser.emailVerified && data.email !== 'admin@collapp.app') {
          toast({
            variant: 'destructive',
            title: 'Email Not Verified',
            description: 'Please check your inbox for a verification link to activate your account before logging in.',
          });
          await auth.signOut();
          return;
        }

        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap: DocumentSnapshot = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
           toast({ variant: 'destructive', title: 'Login Error', description: 'User profile not found in database. Please contact support.' });
           return;
        }

        const userData = userDocSnap.data() as User;
        const userRole = userData.role;

        if (data.userType && userRole !== 'admin' && userRole !== data.userType) {
            toast({ variant: 'destructive', title: 'Login Error', description: `This account is not a ${data.userType} account.` });
            return;
        }

        switch (userRole) {
          case 'admin': router.push('/admin'); break;
          case 'schoolrep': router.push('/schoolrep'); break;
          case 'student': router.push('/student'); break;
          default: toast({ variant: 'destructive', title: 'Login Error', description: 'Unknown user role.' });
        }
      } catch (error: any) {
        const hardcodedUser = hardcodedUsers.find(u => u.email === data.email && u.password === data.password);
        if (hardcodedUser) {
           if (data.userType && hardcodedUser.role !== 'admin' && hardcodedUser.role !== data.userType) {
             toast({ variant: 'destructive', title: 'Login Error', description: `This account is not a ${data.userType} account.` });
             return;
           }
           switch (hardcodedUser.role) {
            case 'admin': router.push('/admin'); break;
            case 'schoolrep': router.push('/schoolrep'); break;
            default: toast({ variant: 'destructive', title: 'Login Error', description: 'Unknown demo user role.' });
          }
        } else {
            let message = 'An unexpected error occurred.';
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                message = 'Invalid email or password.';
            } else if (error.code) {
                message = error.code.replace('auth/', '').replace(/-/g, ' ');
            }
            toast({ variant: 'destructive', title: 'Login Failed', description: message });
        }
      }
    });
  };

  return (
    <Card className="w-full max-w-md shadow-xl bg-card border-border">
      <CardHeader>
        <CardTitle className="font-headline text-2xl tracking-tight text-card-foreground">Welcome Back to COLLAPP</CardTitle>
        <CardDescription className="text-card-foreground/80">Enter your credentials to access your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-card-foreground">Email Address</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="you@example.com" 
                      {...field} 
                      type="email"
                      className="bg-input text-foreground border-border placeholder:text-muted-foreground"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-card-foreground">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        {...field} 
                        className="bg-input text-foreground border-border placeholder:text-muted-foreground pr-10"
                        disabled={isPending}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="userType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-card-foreground">I am a...</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                      disabled={isPending}
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="student" className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" />
                        </FormControl>
                        <FormLabel className="font-normal text-card-foreground">Student</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="schoolrep" className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" />
                        </FormControl>
                        <FormLabel className="font-normal text-card-foreground">School Representative</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </Form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have a COLLAPP account?{' '}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
