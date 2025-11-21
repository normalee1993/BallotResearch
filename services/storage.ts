import { CandidateProfile, Ballot } from '../types';
import { STORAGE_KEY_CANDIDATES, STORAGE_KEY_BALLOTS, CACHE_DURATION } from '../constants';

// Simulates a database connection by reading/writing to localStorage
// In a real app, this would call a backend API

const normalizeKey = (str: string) => str.toLowerCase().trim().replace(/\s+/g, ' ');

// --- Candidate Storage ---

export const saveCandidateProfile = (profile: CandidateProfile): void => {
  try {
    const dbString = localStorage.getItem(STORAGE_KEY_CANDIDATES);
    const db: Record<string, CandidateProfile> = dbString ? JSON.parse(dbString) : {};
    
    db[profile.id] = {
      ...profile,
      lastUpdated: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY_CANDIDATES, JSON.stringify(db));
  } catch (e) {
    console.error("Failed to save to local DB", e);
  }
};

export const getCandidateProfile = (candidateId: string): CandidateProfile | null => {
  try {
    const dbString = localStorage.getItem(STORAGE_KEY_CANDIDATES);
    if (!dbString) return null;

    const db: Record<string, CandidateProfile> = JSON.parse(dbString);
    const profile = db[candidateId];

    if (!profile) return null;

    // Check cache expiration
    if (Date.now() - profile.lastUpdated > CACHE_DURATION) {
      console.log(`Cache expired for candidate ${candidateId}. Re-fetching.`);
      return null; 
    }

    return profile;
  } catch (e) {
    console.error("Failed to read from local DB", e);
    return null;
  }
};

// --- Ballot Storage ---

export const saveBallot = (ballot: Ballot): void => {
  try {
    const dbString = localStorage.getItem(STORAGE_KEY_BALLOTS);
    const db: Record<string, Ballot> = dbString ? JSON.parse(dbString) : {};
    
    const key = normalizeKey(ballot.location);
    db[key] = {
      ...ballot,
      lastUpdated: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY_BALLOTS, JSON.stringify(db));
  } catch (e) {
    console.error("Failed to save ballot to local DB", e);
  }
};

export const getBallot = (location: string): Ballot | null => {
  try {
    const dbString = localStorage.getItem(STORAGE_KEY_BALLOTS);
    if (!dbString) return null;

    const db: Record<string, Ballot> = JSON.parse(dbString);
    const key = normalizeKey(location);
    const ballot = db[key];

    if (!ballot) return null;

    // Check cache expiration
    if (Date.now() - (ballot.lastUpdated || 0) > CACHE_DURATION) {
      console.log(`Cache expired for ballot location: ${location}. Re-fetching.`);
      return null;
    }

    console.log(`Loaded ballot for ${location} from local cache.`);
    return ballot;
  } catch (e) {
    console.error("Failed to read ballot from local DB", e);
    return null;
  }
};

export const clearDatabase = () => {
  localStorage.removeItem(STORAGE_KEY_CANDIDATES);
  localStorage.removeItem(STORAGE_KEY_BALLOTS);
};