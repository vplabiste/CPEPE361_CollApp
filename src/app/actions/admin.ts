
'use server';

import { adminDb, adminAuth } from '@/lib/firebase-admin';
import type { User, UserRole } from '@/lib/auth-constants';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export async function getDashboardStats() {
  try {
    const usersSnapshot = await adminDb.collection('users').get();
    const totalUsers = usersSnapshot.size;

    const studentsSnapshot = await adminDb.collection('users').where('role', '==', 'student').get();
    const totalStudents = studentsSnapshot.size;

    const schoolRepsSnapshot = await adminDb.collection('users').where('role', '==', 'schoolrep').get();
    const totalSchoolReps = schoolRepsSnapshot.size;
    
    const collegesSnapshot = await adminDb.collection('colleges').get();
    const totalColleges = collegesSnapshot.size;


    return {
      totalUsers,
      totalStudents,
      totalSchoolReps,
      totalColleges,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      totalUsers: 0,
      totalStudents: 0,
      totalSchoolReps: 0,
      totalColleges: 0,
    };
  }
}

export async function getRecentUsers(): Promise<User[]> {
    try {
        // Fetch all users and sort in code to handle missing 'createdAt' fields gracefully.
        const usersSnapshot = await adminDb.collection('users').get();

        if (usersSnapshot.empty) {
            return [];
        }

        const users = usersSnapshot.docs.map(doc => ({
            uid: doc.id,
            ...doc.data()
        } as User));
        
        // Sort by createdAt descending, handling cases where it might be missing
        users.sort((a, b) => {
            if (a.createdAt && b.createdAt) {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            if (!a.createdAt && b.createdAt) return 1; // Put users without createdAt at the end
            if (a.createdAt && !b.createdAt) return -1; // Keep users with createdAt at the front
            return 0;
        });

        return users.slice(0, 5);
    } catch (error) {
        console.error("Error fetching recent users:", error);
        return [];
    }
}

export async function getAllUsers(): Promise<User[]> {
    try {
        const usersSnapshot = await adminDb.collection('users').get();

        if (usersSnapshot.empty) {
            return [];
        }

        const users = usersSnapshot.docs.map(doc => ({
            uid: doc.id,
            ...doc.data()
        } as User));
        
        users.sort((a, b) => {
            if (a.createdAt && b.createdAt) {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            if (!a.createdAt && b.createdAt) return 1;
            if (a.createdAt && !b.createdAt) return -1;
            return 0;
        });

        return users;
    } catch (error) {
        console.error("Error fetching all users:", error);
        return [];
    }
}

const userUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  role: z.enum(['student', 'schoolrep', 'admin']),
});


export async function updateUser(uid: string, data: unknown): Promise<{success: boolean, message: string}> {
  const validatedFields = userUpdateSchema.safeParse(data);
  if (!validatedFields.success) {
    return { success: false, message: 'Invalid data provided.' };
  }
  
  const { firstName, lastName, role } = validatedFields.data;

  const userDoc = await adminDb.collection('users').doc(uid).get();
  const userEmail = userDoc.data()?.email;
  const protectedEmails = ['admin@collapp.app', 'schoolrep@collapp.app', 'student@collapp.app'];

  if (protectedEmails.includes(userEmail) && role !== userDoc.data()?.role) {
      return { success: false, message: 'Changing the role of demo accounts is not allowed.' };
  }

  try {
    await adminDb.collection('users').doc(uid).update({
      firstName,
      lastName,
      role,
    });

    await adminAuth.setCustomUserClaims(uid, { role });

    revalidatePath('/admin/users');
    return { success: true, message: 'User updated successfully.' };

  } catch (error: any) {
    console.error('Error updating user:', error);
    return { success: false, message: `Failed to update user: ${error.message}` };
  }
}

export async function deleteUser(uid: string): Promise<{success: boolean, message: string}> {
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (userDoc.exists && ['admin@collapp.app', 'schoolrep@collapp.app', 'student@collapp.app'].includes(userDoc.data()?.email)) {
        return { success: false, message: 'Deleting demo accounts is not allowed.' };
    }

    try {
        await adminAuth.deleteUser(uid);
        await adminDb.collection('users').doc(uid).delete();
        
        // In a real app, handle cascading deletes (e.g., if user is a rep, what happens to the college?)
        
        revalidatePath('/admin/users');
        revalidatePath('/admin');
        return { success: true, message: 'User deleted successfully.' };
    } catch (error: any) {
        console.error('Error deleting user:', error);
        return { success: false, message: `Failed to delete user: ${error.message}` };
    }
}


export async function getSystemStatus() {
  const firebaseConfigured = !!process.env.FIREBASE_PROJECT_ID && !!process.env.FIREBASE_CLIENT_EMAIL;
  const cloudinaryConfigured = !!process.env.CLOUDINARY_CLOUD_NAME && !!process.env.CLOUDINARY_API_KEY;

  return {
    firebase: firebaseConfigured,
    cloudinary: cloudinaryConfigured,
  };
}
