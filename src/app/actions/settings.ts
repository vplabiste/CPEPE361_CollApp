
'use server';

import { z } from 'zod';
import { adminDb } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/app/actions/student';
import { platformSettingsSchema, type PlatformSettings } from '@/lib/settings-schemas';

const SETTINGS_COLLECTION = 'app-settings';
const PLATFORM_SETTINGS_DOC = 'platform';

export async function getPlatformSettings(): Promise<PlatformSettings> {
  try {
    const docSnap = await adminDb.collection(SETTINGS_COLLECTION).doc(PLATFORM_SETTINGS_DOC).get();
    if (docSnap.exists) {
      // Validate data from Firestore against our schema, providing defaults if fields are missing
      const result = platformSettingsSchema.safeParse(docSnap.data());
      if (result.success) {
        return result.data;
      }
    }
    // Return default settings if doc doesn't exist or parsing fails
    return platformSettingsSchema.parse({});
  } catch (error) {
    console.error("Error fetching platform settings:", error);
    // On error, return safe default settings
    return platformSettingsSchema.parse({});
  }
}

export async function savePlatformSettings(data: PlatformSettings): Promise<ActionResult> {
  try {
    const validatedData = platformSettingsSchema.parse(data);
    await adminDb.collection(SETTINGS_COLLECTION).doc(PLATFORM_SETTINGS_DOC).set(validatedData);
    
    // Revalidate paths that depend on these settings
    revalidatePath('/', 'layout');

    return { success: true, message: 'Platform settings updated successfully.' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Invalid settings data.', errors: error.issues };
    }
    console.error("Error saving platform settings:", error);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}
