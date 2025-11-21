
import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ACCEPTED_DOC_TYPES = ['application/pdf'];

const imageFileSchema = z
  .any()
  .refine((value) => value, 'Logo is required.')
  .transform((value, ctx) => {
    const file = value instanceof (global.File || Blob) ? value : value?.[0];

    if (!file || file.size === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Logo file is required.',
      });
      return z.NEVER;
    }
    return file;
  })
  .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
  .refine(
    (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
    `Accepted file types: ${ACCEPTED_IMAGE_TYPES.map(t => t.split('/')[1]).join(', ')}.`
  );

const optionalImageFileSchema = z
  .any()
  .optional()
  .transform((value, ctx) => {
    const file = value instanceof (global.File || Blob) ? value : value?.[0];
    if (!file || file.size === 0) {
      return undefined;
    }
    return file;
  })
  .refine((file) => !file || file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
  .refine(
    (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
    `Accepted file types: ${ACCEPTED_IMAGE_TYPES.map(t => t.split('/')[1]).join(', ')}.`
  );


const multipleFileSchema = z
  .any()
  .optional()
  .transform((value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'object' && value.length !== undefined) {
      return Array.from(value as FileList);
    }
    return [];
  })
  .refine((files) => files.length <= 5, {
    message: 'You can upload a maximum of 5 brochures.',
  })
  .superRefine((files, ctx) => {
    if (!files) return;
    for (const file of files) {
      if (!ACCEPTED_DOC_TYPES.includes(file.type)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Only .pdf files are accepted. Invalid file: ${file.name}`,
        });
      }
      if (file.size > MAX_FILE_SIZE) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `File exceeds 5MB limit: ${file.name}`,
        });
      }
    }
  });


export const addCollegeSchema = z.object({
  name: z.string().min(3, 'College name must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  url: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  logo: imageFileSchema,
  repEmail: z.string().email('Invalid email address for the representative.'),
  repPassword: z.string().min(8, 'Password must be at least 8 characters.'),
});

export type AddCollegeFormInputs = z.infer<typeof addCollegeSchema>;


export const editCollegeSchema = z.object({
  name: z.string().min(3, 'College name must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  url: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  logo: optionalImageFileSchema,
  isPublished: z.preprocess((val) => val === 'on' || val === true, z.boolean()),
});

export type EditCollegeFormInputs = z.infer<typeof editCollegeSchema>;


export const availableRequirements = [
  { id: 'high_school_transcript', label: 'High School Transcript' },
  { id: 'birth_certificate', label: 'PSA Birth Certificate' },
  { id: 'letter_of_recommendation', label: 'Letter of Recommendation' },
  { id: 'certificate_good_moral', label: 'Certificate of Good Moral Character' },
  { id: 'college_entrance_exam', label: 'College Entrance Exam Result' },
  { id: 'id_photo', label: '2x2 ID Photo' },
] as const;

export const schoolRepOnboardingSchema = z.object({
  region: z.string().min(1, { message: "Region is required."}),
  city: z.string().min(1, { message: "City is required."}),
  requirements: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one requirement.",
  }),
  programs: z.array(z.object({ value: z.string().min(1, 'Program name cannot be empty.') })),
  customRequirements: z.array(z.object({ value: z.string() })).optional()
    .transform(items => items?.filter(item => item.value.trim() !== '')),
  brochures: multipleFileSchema,
});

export type SchoolRepOnboardingInputs = z.infer<typeof schoolRepOnboardingSchema>;

export interface College {
    id: string;
    name: string;
    description: string;
    logoUrl: string;
    repUid: string;
    url?: string;
    region?: string;
    city?: string;
    isPublished?: boolean;
    applicationRequirements?: string[];
    programs?: string[];
    brochureUrls?: string[];
    customRequirements?: string[];
}

export type DocumentStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Resubmit';
export type ApplicationStatus = 'Under Review' | 'Accepted' | 'Rejected';

export interface SubmittedDocument {
    id: string;
    label: string;
    fileUrl: string;
    status: DocumentStatus;
    resubmissionNote?: string;
}

export interface Application {
    id: string;
    studentId: string;
    collegeId: string;
    collegeName: string;
    studentInfo: {
        name: string;
        email: string;
        profilePictureUrl?: string;
    };
    status: ApplicationStatus;
    submittedAt: string;
    documents: SubmittedDocument[];
    firstChoiceProgram?: string;
    secondChoiceProgram?: string;
    finalMessage?: string;
    decisionDate?: string;
    finalProgram?: string;
}
