export const APP_NAME = "CivicChoice";
export const STORAGE_KEY_BALLOT = "civic_choice_ballot_cache";
export const STORAGE_KEY_BALLOTS = "civic_choice_ballots_db_v1";
export const STORAGE_KEY_CANDIDATES = "civic_choice_candidate_db";

// Cache duration in milliseconds (24 hours)
export const CACHE_DURATION = 1000 * 60 * 60 * 24;

export const PARTIES: Record<string, string> = {
  'Democrat': 'bg-blue-100 text-blue-800',
  'Democratic': 'bg-blue-100 text-blue-800',
  'Republican': 'bg-red-100 text-red-800',
  'Green': 'bg-green-100 text-green-800',
  'Libertarian': 'bg-yellow-100 text-yellow-800',
  'Independent': 'bg-purple-100 text-purple-800',
  'Unaffiliated': 'bg-purple-50 text-purple-700',
  'No Party Preference': 'bg-gray-100 text-gray-800',
  'NPP': 'bg-gray-100 text-gray-800',
  'Nonpartisan': 'bg-gray-100 text-gray-800',
  'Other': 'bg-gray-100 text-gray-600',
};

export const DEFAULT_BADGE_COLOR = 'bg-slate-100 text-slate-800';