
'use server';

import { z } from 'zod';
import { adminDb } from '@/lib/firebase-admin';
import cloudinary from '@/lib/cloudinary';
import { onboardingSchema, profilePictureSchema, applicationFilesSchema, resubmissionSchema } from '@/lib/student-schemas';
import { redirect } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';
import type { User } from '@/lib/auth-constants';
import { getColleges } from './colleges';
import type { Application } from '@/lib/college-schemas';

export interface ActionResult {
  success: boolean;
  message: string;
  errors?: z.ZodIssue[];
  newImageUrl?: string;
}

const uploadFile = (file: File, userId: string, type: 'birth-cert' | 'school-id' | 'profile-picture' | 'application-doc'): Promise<string> => {
  if (!file) throw new Error(`No file provided for ${type}`);
  
  return new Promise(async (resolve, reject) => {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `user-documents/${userId}`,
          public_id: `${type}-${uuidv4()}`,
          resource_type: 'auto',
          access_mode: 'public',
        },
        (error, result) => {
          if (error) {
            return reject(new Error(`Cloudinary upload failed: ${error.message}`));
          }
          if (!result) {
            return reject(new Error('Cloudinary upload failed: No result returned.'));
          }
          resolve(result.secure_url);
        }
      );
      uploadStream.end(buffer);
    } catch (e) {
      reject(e);
    }
  });
};

export async function submitOnboardingForm(formData: FormData, userId: string | null): Promise<ActionResult> {
  if (!userId) {
    return { success: false, message: 'You must be logged in to submit this form.' };
  }

  if (!cloudinary.config().cloud_name) {
    console.error("submitOnboardingForm Error: Cloudinary configuration is missing. Check .env.local and restart server.");
    return { 
        success: false, 
        message: "Configuration Error: Could not upload files. Please ensure your Cloudinary credentials in a .env.local file are correct and the server has been restarted." 
    };
  }

  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = onboardingSchema.safeParse(rawData);
  
  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid form data. Please check the fields.',
      errors: validatedFields.error.issues,
    };
  }
  
  const { data } = validatedFields;

  let birthCertificateUrl: string;
  let schoolIdUrl: string;

  try {
    birthCertificateUrl = await uploadFile(data.birthCertificate, userId, 'birth-cert');
    schoolIdUrl = await uploadFile(data.schoolId, userId, 'school-id');
  } catch (error: any) {
    console.error("Cloudinary upload error:", error);
    return { success: false, message: `File Upload Failed: ${error.message || 'Please check your connection and try again.'}` };
  }
    
  try {
    const userDocRef = adminDb.collection('users').doc(userId);

    const userProfileData = {
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      sex: data.sex,
      dateOfBirth: data.dateOfBirth,
      address: {
        isInternational: data.isInternational === 'international',
        streetAddress: data.streetAddress,
        zipCode: data.zipCode,
        ...(data.isInternational === 'philippines'
          ? {
              region: data.region,
              province: data.province,
              city: data.city,
            }
          : {
              country: data.country,
              fullAddress: data.internationalAddress,
            }),
      },
      father: {
        name: data.fatherName,
        occupation: data.fatherOccupation,
        contact: data.fatherContact,
      },
      mother: {
        name: data.motherName,
        occupation: data.motherOccupation,
        contact: data.motherContact,
      },
      birthCertificateUrl,
      schoolIdUrl,
      onboardingComplete: true,
    };

    await userDocRef.set(userProfileData, { merge: true });

  } catch (error: any) {
    console.error("Firestore update error:", error);
    return { success: false, message: `An error occurred while saving your profile: ${error.message || 'Please try again.'}` };
  }
  
  revalidatePath('/student');
  redirect('/student');
}


export async function updateProfilePicture(formData: FormData, userId: string | null): Promise<ActionResult> {
   if (!userId) {
    return { success: false, message: 'You must be logged in to update your profile picture.' };
  }
   if (!cloudinary.config().cloud_name) {
     console.error("updateProfilePicture Error: Cloudinary not configured.");
     return { success: false, message: "Configuration Error: Could not upload file." };
  }

  const validatedFields = profilePictureSchema.safeParse({
    profilePicture: formData.get('profilePicture'),
  });

  if (!validatedFields.success) {
    return { success: false, message: 'Invalid file.', errors: validatedFields.error.issues };
  }

  const { profilePicture } = validatedFields.data;

  try {
    const profilePictureUrl = await uploadFile(profilePicture, userId, 'profile-picture');
    const userDocRef = adminDb.collection('users').doc(userId);
    await userDocRef.update({ profilePictureUrl });
    
    revalidatePath('/student/settings');
    revalidatePath('/student');

    return { success: true, message: 'Profile picture updated successfully!', newImageUrl: profilePictureUrl };
  } catch (error: any) {
    console.error("Profile picture update error:", error);
    return { success: false, message: `Upload Failed: ${error.message || 'Please try again.'}` };
  }
}

export async function getUserProfile(userId: string): Promise<User | null> {
  if (!userId) {
    return null;
  }
  try {
    const userDocRef = adminDb.collection('users').doc(userId);
    const userDocSnap = await userDocRef.get();

    if (userDocSnap.exists) {
      return { uid: userDocSnap.id, ...userDocSnap.data() } as User;
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return null;
  }
}


export async function getStudentDashboardStats(userId: string) {
    try {
        const applicationsSnapshot = await adminDb.collection('applications').where('studentId', '==', userId).get();
        const applications = applicationsSnapshot.docs.map(doc => doc.data() as Application);

        const colleges = await getColleges();
        
        return {
            totalApplications: applications.length,
            accepted: applications.filter(app => app.status === 'Accepted').length,
            underReview: applications.filter(app => app.status === 'Under Review').length,
            availableColleges: colleges.length,
        };
    } catch (error) {
        console.error("Error fetching student dashboard stats:", error);
        return {
            totalApplications: 0,
            accepted: 0,
            underReview: 0,
            availableColleges: 0,
        };
    }
}

export async function getMyApplications(userId: string): Promise<Application[]> {
    if (!userId) return [];
    try {
        const snapshot = await adminDb.collection('applications')
            .where('studentId', '==', userId)
            .get();
        
        if (snapshot.empty) return [];

        const applications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Application));

        applications.sort((a, b) => {
            if (a.submittedAt && b.submittedAt) {
                return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
            }
            return 0;
        });

        return applications;
    } catch (error) {
        console.error(`Error fetching applications for user ${userId}:`, error);
        return [];
    }
}


export async function submitApplication(formData: FormData, userId: string, collegeId: string): Promise<ActionResult> {
    if (!userId) {
        return { success: false, message: 'You must be logged in.' };
    }

    const user = await getUserProfile(userId);
    if (!user) {
        return { success: false, message: 'User profile not found.' };
    }

    const rawData: { [k: string]: any } = {};
    const requirementKeys: string[] = [];
    formData.forEach((value, key) => {
        if (key.startsWith('requirement-')) {
            const reqId = key.replace('requirement-', '');
            rawData[reqId] = value;
            requirementKeys.push(reqId);
        }
    });

    const validatedFields = applicationFilesSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            success: false,
            message: 'Invalid form data. Please ensure all required files are uploaded.',
            errors: validatedFields.error.issues,
        };
    }
    
    try {
        const collegeRef = adminDb.collection('colleges').doc(collegeId);
        const collegeDoc = await collegeRef.get();
        if (!collegeDoc.exists) {
            return { success: false, message: 'College not found.' };
        }
        const collegeData = collegeDoc.data();

        const documentUploadPromises = requirementKeys.map(async (key) => {
            const file = validatedFields.data[key];
            const fileUrl = await uploadFile(file, userId, 'application-doc');
            return {
                id: key,
                label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                fileUrl,
                status: 'Pending' as const,
            };
        });

        const uploadedDocuments = await Promise.all(documentUploadPromises);

        const applicationData: Omit<Application, 'id'> = {
            studentId: userId,
            collegeId: collegeId,
            collegeName: collegeData?.name || 'Unknown College',
            studentInfo: {
                name: `${user.firstName} ${user.lastName}`,
                email: user.email || '',
                profilePictureUrl: user.profilePictureUrl || ''
            },
            status: 'Under Review',
            submittedAt: new Date().toISOString(),
            documents: uploadedDocuments,
            firstChoiceProgram: formData.get('firstChoiceProgram')?.toString(),
            secondChoiceProgram: formData.get('secondChoiceProgram')?.toString(),
        };

        await adminDb.collection('applications').add(applicationData);

        revalidatePath(`/student/colleges/${collegeId}`);
        revalidatePath('/student/applications');
        return { success: true, message: 'Application submitted successfully!' };

    } catch (error: any) {
        console.error('Error submitting application:', error);
        return { success: false, message: `An unexpected error occurred: ${error.message}` };
    }
}

export async function hasApplied(userId: string, collegeId: string): Promise<boolean> {
    if (!userId) return false;
    try {
        const snapshot = await adminDb.collection('applications')
            .where('studentId', '==', userId)
            .where('collegeId', '==', collegeId)
            .limit(1)
            .get();
        return !snapshot.empty;
    } catch (error) {
        console.error("Error checking application status:", error);
        return false;
    }
}

const getPublicIdFromUrl = (url: string | undefined): string | null => {
  if (!url) return null;
  const match = url.match(/\/v[0-9]+\/(.+?)(?:\.[a-zA-Z0-9]+)?$/);
  return match ? match[1] : null;
};

export async function resubmitDocument(formData: FormData, applicationId: string, documentId: string): Promise<ActionResult> {
    const validatedFields = resubmissionSchema.safeParse({
        documentFile: formData.get('documentFile'),
    });

    if (!validatedFields.success) {
        return {
            success: false,
            message: 'Invalid file provided.',
            errors: validatedFields.error.issues,
        };
    }

    const { documentFile } = validatedFields.data;

    try {
        const appDocRef = adminDb.collection('applications').doc(applicationId);
        const appDoc = await appDocRef.get();
        if (!appDoc.exists) {
            return { success: false, message: 'Application not found.' };
        }

        const application = appDoc.data() as Application;
        const documentIndex = application.documents.findIndex(doc => doc.id === documentId);
        if (documentIndex === -1) {
            return { success: false, message: 'Document not found in application.' };
        }
        
        const oldDocument = application.documents[documentIndex];

        // Delete old file from Cloudinary
        const oldPublicId = getPublicIdFromUrl(oldDocument.fileUrl);
        if (oldPublicId) {
            await cloudinary.uploader.destroy(oldPublicId, { resource_type: 'auto' }).catch(e => console.warn(`Could not delete old Cloudinary file: ${e.message}`));
        }
        
        // Upload new file
        const newFileUrl = await uploadFile(documentFile, application.studentId, 'application-doc');

        // Update application document in Firestore
        const newDocuments = [...application.documents];
        newDocuments[documentIndex].fileUrl = newFileUrl;
        newDocuments[documentIndex].status = 'Pending';
        delete newDocuments[documentIndex].resubmissionNote;

        await appDocRef.update({ documents: newDocuments });

        revalidatePath(`/student/applications`);
        return { success: true, message: 'Document resubmitted successfully.' };

    } catch (error: any) {
        console.error('Error resubmitting document:', error);
        return { success: false, message: `An unexpected error occurred: ${error.message}` };
    }
}
