
'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { auth, db } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  type UserCredential
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import type { User, UserRole } from '@/lib/auth-constants';
import { signupSchema, type SignupFormInputs } from '@/lib/auth-schemas';

export interface AuthResult {
  success: boolean;
  message?: string;
  redirectTo?: string;
}

export async function registerStudent(data: SignupFormInputs): Promise<AuthResult> {
  try {
    const validatedData = signupSchema.parse(data);
    const [firstName, ...lastNameParts] = validatedData.name.split(' ');
    const lastName = lastNameParts.join(' ');


    let userCredential: UserCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(auth, validatedData.email, validatedData.password);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        return { success: false, message: 'An account with this email already exists.' };
      }
      console.error('Firebase Auth registration error:', error);
      return { success: false, message: 'Failed to create account. Please try again.' };
    }
    
    const firebaseUser = userCredential.user;
    if (!firebaseUser) {
        return { success: false, message: 'Failed to create user account details.' };
    }

    const role: UserRole = validatedData.email === 'admin@collapp.app' ? 'admin' : 'student';

    const newUser: Partial<User> = { 
      firstName: firstName || '',
      lastName: lastName || '',
      role: role,
      createdAt: new Date().toISOString(),
      onboardingComplete: role === 'admin' // Admins don't need onboarding
    };

    try {
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser, { merge: true });
      await sendEmailVerification(firebaseUser);
    } catch (err) {
      console.error('Firestore user creation or email verification error:', err);
      return { success: false, message: 'Account created, but failed to save profile or send verification email. Please contact support.' };
    }
    
    return { success: true, message: 'Account created! Please check your email to verify your account before logging in.' };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors.map(e => e.message).join(' ') };
    }
    console.error('Registration process error:', error);
    return { success: false, message: 'An unexpected error occurred during registration. Please try again.' };
  }
}


export async function sendPasswordReset(email: string): Promise<AuthResult> {
  if (!email) {
    return { success: false, message: 'Email is required.' };
  }
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, message: 'Password reset email sent! Please check your inbox.' };
  } catch (error: any) {
    console.error('Password reset error:', error);
    return { success: false, message: 'Failed to send password reset email. Please try again.' };
  }
}
