
import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const ACCEPTED_DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

export const fileSchema = (acceptedTypes: string[], required = true) => z
  .any()
  .refine((value) => required ? value : true, 'File is required.')
  .transform((value, ctx) => {
    const file = value instanceof (global.File || Blob) ? value : value?.[0];

    if (!file || file.size === 0) {
      if (required) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'File is required.',
          });
          return z.NEVER;
      }
      return undefined;
    }
    return file;
  })
  .refine((file) => !file || file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
  .refine(
    (file) => !file || acceptedTypes.includes(file.type),
    `Accepted file types: ${acceptedTypes.map(t => t.split('/')[1]).join(', ')}.`
  );


export const onboardingSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required.'),
  sex: z.enum(['male', 'female', 'other'], { required_error: 'Please select your sex.' }),
  dateOfBirth: z.string().min(1, 'Date of birth is required.'),
  
  isInternational: z.enum(['philippines', 'international']),
  
  region: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  
  country: z.string().optional(),
  internationalAddress: z.string().optional(),
  
  streetAddress: z.string().min(1, 'Street address is required.'),
  zipCode: z.string().min(1, 'Zip code is required.'),

  fatherName: z.string().min(1, "Father's name is required."),
  fatherOccupation: z.string().min(1, "Father's occupation is required."),
  fatherContact: z.string().min(1, "Father's contact is required."),

  motherName: z.string().min(1, "Mother's name is required."),
  motherOccupation: z.string().min(1, "Mother's occupation is required."),
  motherContact: z.string().min(1, "Mother's contact is required."),

  birthCertificate: fileSchema(ACCEPTED_DOC_TYPES),
  schoolId: fileSchema(ACCEPTED_DOC_TYPES),

}).superRefine((data, ctx) => {
  if (data.isInternational === 'philippines') {
    if (!data.region) {
      ctx.addIssue({ code: 'custom', message: 'Region is required.', path: ['region'] });
    }
    if (!data.province) {
      ctx.addIssue({ code: 'custom', message: 'Province is required.', path: ['province'] });
    }
    if (!data.city) {
      ctx.addIssue({ code: 'custom', message: 'City/Municipality is required.', path: ['city'] });
    }
  } else {
    if (!data.country) {
      ctx.addIssue({ code: 'custom', message: 'Country is required.', path: ['country'] });
    }
    if (!data.internationalAddress) {
      ctx.addIssue({ code: 'custom', message: 'Full address is required.', path: ['internationalAddress'] });
    }
  }
});


export type OnboardingFormInputs = z.infer<typeof onboardingSchema>;

export const profilePictureSchema = z.object({
  profilePicture: fileSchema(ACCEPTED_IMAGE_TYPES),
});

export type ProfilePictureInputs = z.infer<typeof profilePictureSchema>;

// This schema validates only the files dynamically based on their keys.
export const applicationFilesSchema = z.record(z.string(), fileSchema(ACCEPTED_DOC_TYPES));
export type ApplicationFilesInputs = z.infer<typeof applicationFilesSchema>;

// This schema is for the program choice part of the form.
// The full schema is constructed dynamically in the form component.
export const applicationProgramsSchema = z.object({
    firstChoiceProgram: z.string({ required_error: 'First choice program is required.'}).min(1, 'First choice program is required.'),
    secondChoiceProgram: z.string().optional(),
});


export const resubmissionSchema = z.object({
  documentFile: fileSchema(ACCEPTED_DOC_TYPES),
});
export type ResubmissionInputs = z.infer<typeof resubmissionSchema>;
