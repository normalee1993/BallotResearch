export interface Candidate {
  id: string;
  name: string;
  party: string;
  incumbent?: boolean;
}

export interface Race {
  id: string;
  office: string; // e.g., "Mayor", "City Council District 1"
  type: 'candidate' | 'proposition';
  description?: string; // For props
  candidates: Candidate[];
}

export interface Ballot {
  location: string;
  date: string;
  races: Race[];
  lastUpdated: number; // Timestamp for cache invalidation
}

export interface CandidateProfile {
  id: string; // matches Candidate.id
  name: string;
  office: string;
  party: string;
  summary: string;
  platform: string[];
  experience: string[];
  education: string;
  keyIssues: { topic: string; stance: string }[];
  sources: { title: string; uri: string }[];
  lastUpdated: number; // timestamp for cache invalidation
}

export interface AppError {
  message: string;
  details?: string;
}