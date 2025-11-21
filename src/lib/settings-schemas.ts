
import { z } from 'zod';

export const platformSettingsSchema = z.object({
  maintenanceMode: z.boolean().default(false),
  applicationsOpen: z.boolean().default(true),
  featuredColleges: z.array(z.string()).default([]),
});

export type PlatformSettings = z.infer<typeof platformSettingsSchema>;
