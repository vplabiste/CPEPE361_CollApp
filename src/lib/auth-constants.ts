export type UserRole = 'student' | 'schoolrep' | 'admin';

export interface User {
  uid: string;
  email?: string | null;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  
  // Onboarding fields
  onboardingComplete?: boolean;
  profilePictureUrl?: string;
  middleName?: string;
  sex?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  address?: {
    isInternational: boolean;
    country?: string;
    region?: string;
    province?: string;
    city?: string;
    streetAddress?: string;
    zipCode?: string;
    fullAddress?: string;
  };
  father?: {
    name: string;
    occupation: string;
    contact: string;
  };
  mother?: {
    name: string;
    occupation: string;
    contact: string;
  };
  birthCertificateUrl?: string;
  schoolIdUrl?: string;
  createdAt?: string;
}
