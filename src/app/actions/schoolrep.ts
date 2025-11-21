
'use server';

import { z } from 'zod';
import { adminDb } from '@/lib/firebase-admin';
import cloudinary from '@/lib/cloudinary';
import type { ActionResult } from '@/app/actions/student';
import { schoolRepOnboardingSchema } from '@/lib/college-schemas';
import type { College, Application, DocumentStatus, ApplicationStatus, SubmittedDocument } from '@/lib/college-schemas';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import { redirect } from 'next/navigation';

const uploadBrochures = (files: File[], collegeId: string): Promise<string[]> => {
  const uploadPromises = files.map(file => {
    return new Promise<string>(async (resolve, reject) => {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `college-brochures/${collegeId}`,
            public_id: `brochure-${uuidv4()}`,
            resource_type: 'image',
            access_mode: 'public',
          },
          (error, result) => {
            if (error) return reject(new Error(`Cloudinary upload failed for ${file.name}: ${error.message}`));
            if (!result) return reject(new Error(`Cloudinary upload failed for ${file.name}: No result returned.`));
            resolve(result.secure_url);
          }
        );
        uploadStream.end(buffer);
      } catch (e) {
        reject(e);
      }
    });
  });

  return Promise.all(uploadPromises);
};


export async function getCollegeByRepId(repId: string): Promise<College | null> {
    if (!repId) return null;
    try {
        const collegesSnapshot = await adminDb.collection('colleges').where('repUid', '==', repId).limit(1).get();
        if (collegesSnapshot.empty) {
            return null;
        }
        const doc = collegesSnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as College;
    } catch (error) {
        console.error(`Failed to fetch college for rep ${repId}:`, error);
        return null;
    }
}

export async function completeOnboarding(formData: FormData, collegeId: string | null): Promise<ActionResult> {
    if (!collegeId) {
      return { success: false, message: "College ID is missing." };
    }
    if (!cloudinary.config().cloud_name) {
      console.error("submitOnboardingForm Error: Cloudinary configuration is missing.");
      return { success: false, message: "Configuration Error: Could not upload file." };
    }
    
    const validationObject = {
        region: formData.get('region'),
        city: formData.get('city'),
        requirements: formData.getAll('requirements'),
        programs: formData.getAll('programs').map(p => ({ value: p.toString() })),
        customRequirements: formData.getAll('customRequirements').map(p => ({ value: p.toString() })),
        brochures: formData.getAll('brochures').filter(f => (f as File).size > 0),
    }

    const validatedFields = schoolRepOnboardingSchema.safeParse(validationObject);
    
    if (!validatedFields.success) {
        return {
        success: false,
        message: 'Invalid form data.',
        errors: validatedFields.error.issues,
        };
    }

    const { data } = validatedFields;

    try {
        const collegeDocRef = adminDb.collection('colleges').doc(collegeId);

        const updateData: Partial<College> = {
            region: data.region,
            city: data.city,
            programs: data.programs.map(p => p.value),
            applicationRequirements: data.requirements,
            customRequirements: data.customRequirements?.map(cr => cr.value),
            isPublished: true,
        };
        
        // Only update brochures if new files are provided.
        if (data.brochures && data.brochures.length > 0) {
            updateData.brochureUrls = await uploadBrochures(data.brochures, collegeId);
        }

        await collegeDocRef.update(updateData);

    } catch (error: any) {
        console.error("School Rep onboarding error:", error);
        return { success: false, message: `An error occurred: ${error.message || 'Please try again.'}` };
    }

    revalidatePath('/schoolrep');
    revalidatePath('/student/colleges');
    revalidatePath('/');
    redirect('/schoolrep');
}

export async function unpublishCollege(collegeId: string): Promise<ActionResult> {
    if (!collegeId) {
        return { success: false, message: "College ID is required." };
    }

    try {
        const collegeDocRef = adminDb.collection('colleges').doc(collegeId);
        await collegeDocRef.update({ isPublished: false });
        
        revalidatePath('/schoolrep');
        revalidatePath('/schoolrep/settings');
        revalidatePath('/student/colleges');
        revalidatePath('/');

    } catch (error: any) {
        console.error("Error unpublishing college:", error);
        return { success: false, message: "Failed to unpublish college. Please try again." };
    }
    
    redirect('/schoolrep/onboarding');
}

export async function getApplicationsByCollege(collegeId: string): Promise<Application[]> {
    if (!collegeId) return [];
    try {
        const snapshot = await adminDb.collection('applications')
            .where('collegeId', '==', collegeId)
            .get();
        
        if (snapshot.empty) return [];

        const applications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
        
        applications.sort((a, b) => {
            if (a.submittedAt && b.submittedAt) {
                return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
            }
            return 0;
        });

        return applications;
    } catch (error) {
        console.error(`Error fetching applications for college ${collegeId}:`, error);
        return [];
    }
}

export async function getAcceptedApplicationsByCollege(collegeId: string): Promise<Application[]> {
    if (!collegeId) return [];
    try {
        const snapshot = await adminDb.collection('applications')
            .where('collegeId', '==', collegeId)
            .where('status', '==', 'Accepted')
            .get();
        
        if (snapshot.empty) return [];

        const applications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
        
        applications.sort((a, b) => {
            const dateA = a.decisionDate ? new Date(a.decisionDate).getTime() : 0;
            const dateB = b.decisionDate ? new Date(b.decisionDate).getTime() : 0;
            return dateB - dateA;
        });

        return applications;
    } catch (error) {
        console.error(`Error fetching accepted applications for college ${collegeId}:`, error);
        return [];
    }
}

export async function batchUpdateDocumentStatuses(
    applicationId: string,
    updates: { documentId: string; status: DocumentStatus; note?: string }[]
): Promise<ActionResult> {
    try {
        const appDocRef = adminDb.collection('applications').doc(applicationId);
        const appDoc = await appDocRef.get();
        if (!appDoc.exists) {
            return { success: false, message: 'Application not found.' };
        }

        const application = appDoc.data() as Application;
        const newDocuments = [...application.documents];

        updates.forEach(update => {
            const documentIndex = newDocuments.findIndex(doc => doc.id === update.documentId);
            if (documentIndex !== -1) {
                newDocuments[documentIndex].status = update.status;
                if (update.status === 'Resubmit') {
                    newDocuments[documentIndex].resubmissionNote = update.note || '';
                } else {
                    delete newDocuments[documentIndex].resubmissionNote;
                }
            }
        });
        
        await appDocRef.update({ documents: newDocuments });

        revalidatePath(`/schoolrep/applications`);
        return { success: true, message: 'Document statuses updated.' };
    } catch (error: any) {
        console.error('Error batch updating document statuses:', error);
        return { success: false, message: `An error occurred: ${error.message}` };
    }
}


export async function updateOverallApplicationStatus(
    applicationId: string,
    status: ApplicationStatus,
    message: string,
    finalProgram?: string,
    documents?: SubmittedDocument[]
): Promise<ActionResult> {
     try {
        const appDocRef = adminDb.collection('applications').doc(applicationId);
        const appDoc = await appDocRef.get();
        if (!appDoc.exists) {
            return { success: false, message: 'Application not found.' };
        }

        const updateData: { [key: string]: any } = { 
            status,
            finalMessage: message,
            decisionDate: new Date().toISOString()
        };
        
        if (documents) {
            updateData.documents = documents;
        }

        if (status === 'Accepted' && finalProgram) {
            updateData.finalProgram = finalProgram;
        }

        await appDocRef.update(updateData);

        revalidatePath(`/schoolrep/applications`);
        revalidatePath(`/student/applications`);
        revalidatePath('/schoolrep/programs');
        // Here you would also trigger an email notification in a real app
        console.log(`Email notification mock: Sent status '${status}' to student for application ${applicationId}`);

        return { success: true, message: `Application has been ${status.toLowerCase()}.` };
    } catch (error: any) {
        console.error('Error updating application status:', error);
        return { success: false, message: `An error occurred: ${error.message}` };
    }
}
