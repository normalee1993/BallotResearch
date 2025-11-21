import React, { useEffect, useState } from 'react';
import { Candidate, CandidateProfile, Race } from '../types';
import { researchCandidate } from '../services/gemini';
import { getCandidateProfile, saveCandidateProfile } from '../services/storage';
import { LoadingState } from './LoadingState';
import { XIcon, BookOpenIcon, BriefcaseIcon, GraduationCapIcon, ExternalLinkIcon } from 'lucide-react';
import { PARTIES, DEFAULT_BADGE_COLOR } from '../constants';

interface Props {
  candidate: Candidate;
  race: Race;
  location: string;
  onClose: () => void;
}

export const CandidateDetail: React.FC<Props> = ({ candidate, race, location, onClose }) => {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // 1. Check "Database" (Local Storage)
        const cached = getCandidateProfile(candidate.id);
        if (cached) {
          console.log("Loaded from cache:", candidate.name);
          setProfile(cached);
          setLoading(false);
          return;
        }

        // 2. If miss, ask AI
        console.log("Fetching from AI:", candidate.name);
        const freshProfile = await researchCandidate(
            candidate.name, 
            race.office, 
            location, 
            candidate.id
        );
        
        // Merge party from parent if AI returns "Unknown" or similar
        if (freshProfile.party === "Unknown" || !freshProfile.party) {
            freshProfile.party = candidate.party;
        }

        // 3. Save to "Database"
        saveCandidateProfile(freshProfile);
        setProfile(freshProfile);

      } catch (err) {
        setError("Failed to load candidate research. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [candidate, race, location]);

  const partyColor = PARTIES[candidate.party] || DEFAULT_BADGE_COLOR;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col">
        
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-slate-100 flex items-center justify-between rounded-t-2xl">
            <div>
                <h2 className="text-xl font-bold text-slate-900">{candidate.name}</h2>
                <p className="text-sm text-slate-500">Running for {race.office}</p>
            </div>
            <button 
                onClick={onClose}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
            >
                <XIcon size={20} className="text-slate-600"/>
            </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-8">
            {loading && <LoadingState message={`Researching ${candidate.name}...`} />}
            
            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg text-center">
                    {error}
                </div>
            )}

            {!loading && profile && (
                <>
                    {/* Summary Section */}
                    <section>
                        <div className="flex items-center space-x-2 mb-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${partyColor}`}>
                                {candidate.party}
                            </span>
                            {candidate.incumbent && (
                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                    Incumbent
                                </span>
                            )}
                        </div>
                        <p className="text-slate-700 leading-relaxed text-lg">
                            {profile.summary}
                        </p>
                    </section>

                    <hr className="border-slate-100" />

                    {/* Key Issues */}
                    <section>
                        <h3 className="flex items-center text-lg font-semibold text-slate-900 mb-4">
                            <BookOpenIcon size={20} className="mr-2 text-blue-600" />
                            Key Issues & Stances
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            {profile.keyIssues.map((issue, idx) => (
                                <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <h4 className="font-medium text-slate-900 mb-1">{issue.topic}</h4>
                                    <p className="text-sm text-slate-600">{issue.stance}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Platform */}
                    <section>
                         <h3 className="text-lg font-semibold text-slate-900 mb-4">Platform Pillars</h3>
                         <ul className="space-y-2">
                            {profile.platform.map((item, idx) => (
                                <li key={idx} className="flex items-start">
                                    <span className="mr-2 text-blue-500">•</span>
                                    <span className="text-slate-700">{item}</span>
                                </li>
                            ))}
                         </ul>
                    </section>

                    {/* Experience & Education */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <section>
                            <h3 className="flex items-center text-lg font-semibold text-slate-900 mb-3">
                                <BriefcaseIcon size={20} className="mr-2 text-slate-500" />
                                Experience
                            </h3>
                            <ul className="space-y-2 text-slate-700 text-sm">
                                {profile.experience.map((exp, idx) => (
                                    <li key={idx} className="bg-white border border-slate-200 px-3 py-2 rounded-lg">
                                        {exp}
                                    </li>
                                ))}
                            </ul>
                        </section>
                        <section>
                            <h3 className="flex items-center text-lg font-semibold text-slate-900 mb-3">
                                <GraduationCapIcon size={20} className="mr-2 text-slate-500" />
                                Education
                            </h3>
                             <div className="bg-white border border-slate-200 px-3 py-2 rounded-lg text-slate-700 text-sm">
                                {profile.education || "Not listed"}
                             </div>
                        </section>
                    </div>

                    {/* Sources */}
                    {profile.sources && profile.sources.length > 0 && (
                        <section className="bg-slate-50 p-4 rounded-xl">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Sources & References</h4>
                            <ul className="space-y-1">
                                {profile.sources.map((source, idx) => (
                                    <li key={idx}>
                                        <a 
                                            href={source.uri} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-600 hover:underline flex items-center truncate"
                                        >
                                            <ExternalLinkIcon size={10} className="mr-1" />
                                            {source.title}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </>
            )}
        </div>
      </div>
    </div>
  );
};
