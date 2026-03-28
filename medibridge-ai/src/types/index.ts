export interface UserProfile {
  id: string;
  name: string;
  relationship: string;
  dateOfBirth: string;
  bloodType: string;
  allergies: string[];
  createdAt: any;
}

export interface MedicalRecord {
  id: string;
  type: string;
  date: string;
  doctor: string;
  hospital: string;
  summary: string;
  extractedData: any;
  createdAt: any;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  schedule: string;
  active: boolean;
  createdAt: any;
}

export interface ShareLink {
  id: string;
  userId: string;
  profileId: string;
  records?: MedicalRecord[];
  recordIds?: string[]; // Kept for backward compatibility if needed
  expiresAt: any;
  createdAt: any;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: any;
  type: 'medication' | 'alert' | 'system';
}

export interface UploadRecordProps {
  user: any; // User from firebase/auth
  profileId: string;
}

export interface LabTrendsPageProps {
  user: any; // User from firebase/auth
}

export interface ChatInterfaceProps {
  user: any;
  profileId: string;
}
