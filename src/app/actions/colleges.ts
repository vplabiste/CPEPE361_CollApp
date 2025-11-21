
'use server';

import { z } from 'zod';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import cloudinary from '@/lib/cloudinary';
import { addCollegeSchema, editCollegeSchema, type College } from '@/lib/college-schemas';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

export interface ActionResult {
  success: boolean;
  message: string;
  errors?: z.ZodIssue[];
}

const getPublicIdFromUrl = (url: string | undefined): string | null => {
  if (!url) return null;
  const match = url.match(/\/v[0-9]+\/(.+?)(?:\.[a-zA-Z0-9]+)?$/);
  return match ? match[1] : null;
};

const uploadLogo = (file: File, collegeName: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `college-logos`,
          public_id: `${collegeName.toLowerCase().replace(/\s+/g, '-')}-${uuidv4()}`,
          resource_type: 'image',
          access_mode: 'public',
        },
        (error, result) => {
          if (error) return reject(new Error(`Cloudinary upload failed: ${error.message}`));
          if (!result) return reject(new Error('Cloudinary upload failed: No result returned.'));
          resolve(result.secure_url);
        }
      );
      uploadStream.end(buffer);
    } catch (e) {
      reject(e);
    }
  });
};

export async function addCollege(formData: FormData): Promise<ActionResult> {
  if (!cloudinary.config().cloud_name) {
    console.error("addCollege Error: Cloudinary configuration is missing.");
    return { success: false, message: "Configuration Error: Could not upload files. Please check your .env.local file." };
  }

  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = addCollegeSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid form data.',
      errors: validatedFields.error.issues,
    };
  }
  
  const { data } = validatedFields;
  let logoUrl: string;
  let schoolRepUid: string;

  try {
    const userRecord = await adminAuth.createUser({
      email: data.repEmail,
      password: data.repPassword,
      emailVerified: true, 
      displayName: `${data.name} Representative`,
    });
    schoolRepUid = userRecord.uid;

    logoUrl = await uploadLogo(data.logo, data.name);

    const userDocRef = adminDb.collection('users').doc(schoolRepUid);
    await userDocRef.set({
      email: data.repEmail,
      role: 'schoolrep',
      firstName: `${data.name} Rep`,
      lastName: '',
      createdAt: new Date().toISOString(),
      onboardingComplete: true,
      profilePictureUrl: logoUrl, // Use logo as profile picture
    });

    const collegeDocRef = adminDb.collection('colleges').doc();
    await collegeDocRef.set({
      name: data.name,
      description: data.description,
      logoUrl: logoUrl,
      url: data.url,
      repUid: schoolRepUid,
      isPublished: false, // College starts as unpublished
    });

  } catch (error: any) {
    console.error("Error adding college:", error);
    let message = 'An unexpected error occurred.';
    if (error.code === 'auth/email-already-exists') {
        message = 'A user with this email already exists.';
    } else if (error.message.includes('Cloudinary')) {
        message = `File Upload Failed: ${error.message}`;
    } else {
        message = error.message || message;
    }
    return { success: false, message };
  }
  
  revalidatePath('/admin/colleges');
  revalidatePath('/');
  return { success: true, message: 'College and representative account created successfully.' };
}

export async function updateCollege(formData: FormData, collegeId: string): Promise<ActionResult> {
    const rawData = Object.fromEntries(formData.entries());
    const validatedFields = editCollegeSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return { success: false, message: 'Invalid form data.', errors: validatedFields.error.issues };
    }

    const { data } = validatedFields;
    
    try {
        const collegeDocRef = adminDb.collection('colleges').doc(collegeId);
        const collegeDoc = await collegeDocRef.get();
        if (!collegeDoc.exists) {
            return { success: false, message: 'College not found.' };
        }
        
        const collegeToUpdate = collegeDoc.data() as College;
        const updateData: Partial<College> = {
            name: data.name,
            description: data.description,
            url: data.url,
            isPublished: data.isPublished
        };

        if (data.logo) {
            if (collegeToUpdate.logoUrl) {
                const oldPublicId = getPublicIdFromUrl(collegeToUpdate.logoUrl);
                if (oldPublicId) {
                    await cloudinary.uploader.destroy(oldPublicId, { resource_type: 'image' });
                }
            }
            const newLogoUrl = await uploadLogo(data.logo, data.name);
            updateData.logoUrl = newLogoUrl;

            // Also update the representative's user document with the new logo
            if (collegeToUpdate.repUid) {
                const userDocRef = adminDb.collection('users').doc(collegeToUpdate.repUid);
                await userDocRef.update({ profilePictureUrl: newLogoUrl });
            }
        }

        await collegeDocRef.update(updateData);

    } catch (error: any) {
        console.error("Error updating college:", error);
        return { success: false, message: `Update failed: ${error.message}` };
    }

    revalidatePath('/admin/colleges');
    revalidatePath(`/student/colleges/${collegeId}`);
    revalidatePath('/');
    return { success: true, message: 'College updated successfully.' };
}


export async function deleteCollege(collegeId: string): Promise<ActionResult> {
  try {
    const collegeDocRef = adminDb.collection('colleges').doc(collegeId);
    const collegeDoc = await collegeDocRef.get();

    if (!collegeDoc.exists) {
      return { success: false, message: 'College not found.' };
    }

    const collegeData = collegeDoc.data() as College;

    // Delete associated user
    if (collegeData.repUid) {
      try {
        await adminAuth.deleteUser(collegeData.repUid);
        await adminDb.collection('users').doc(collegeData.repUid).delete();
      } catch (userError: any) {
        console.warn(`Could not delete user ${collegeData.repUid}: ${userError.message}`);
      }
    }

    // Delete Cloudinary assets
    const cloudinaryDeletions = [];
    const logoPublicId = getPublicIdFromUrl(collegeData.logoUrl);
    if (logoPublicId) {
       cloudinaryDeletions.push(cloudinary.uploader.destroy(logoPublicId, { resource_type: 'image' }));
    }
    if (collegeData.brochureUrls && collegeData.brochureUrls.length > 0) {
        for (const url of collegeData.brochureUrls) {
            const brochurePublicId = getPublicIdFromUrl(url);
            if (brochurePublicId) {
                cloudinaryDeletions.push(cloudinary.uploader.destroy(brochurePublicId, { resource_type: 'image' }));
            }
        }
    }
    await Promise.all(cloudinaryDeletions).catch(cloudinaryError => {
        console.warn(`Could not delete all Cloudinary assets for ${collegeId}: ${cloudinaryError.message}`);
    });
    
    // Delete college doc
    await collegeDocRef.delete();

    revalidatePath('/admin/colleges');
    revalidatePath('/');
    return { success: true, message: 'College and all associated data deleted successfully.' };

  } catch (error: any) {
    console.error("Error deleting college:", error);
    return { success: false, message: `An unexpected error occurred: ${error.message}` };
  }
}

export async function getColleges(publishedOnly = true): Promise<College[]> {
    try {
        const collectionRef = adminDb.collection('colleges');
        let query;

        if (publishedOnly) {
            query = collectionRef.where('isPublished', '==', true);
        } else {
            query = collectionRef.orderBy('name');
        }

        const collegesSnapshot = await query.get();
            
        if (collegesSnapshot.empty) {
            return [];
        }

        const colleges = collegesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as College));

        if (publishedOnly) {
            colleges.sort((a, b) => a.name.localeCompare(b.name));
        }

        return colleges;

    } catch (error) {
        console.error("Error fetching colleges:", error);
        return [];
    }
}


export async function getCollegeById(id: string): Promise<College | null> {
    try {
        const collegeDocRef = adminDb.collection('colleges').doc(id);
        const collegeDocSnap = await collegeDocRef.get();

        if (collegeDocSnap.exists) {
            const collegeData = collegeDocSnap.data() as Omit<College, 'id'>;
            return { id: collegeDocSnap.id, ...collegeData } as College;
        }
        return null;
    } catch (error) {
        console.error(`Failed to fetch college with ID ${id}:`, error);
        return null;
    }
}
