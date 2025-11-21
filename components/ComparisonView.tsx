import React, { useEffect, useState } from 'react';
import { Candidate, CandidateProfile, Race } from '../types';
import { researchCandidate } from '../services/gemini';
import { getCandidateProfile, saveCandidateProfile } from '../services/storage';
import { LoadingState } from './LoadingState';
import { XIcon, CheckCircleIcon, MinusCircleIcon, ScaleIcon } from 'lucide-react';
import { PARTIES, DEFAULT_BADGE_COLOR } from '../constants';

interface Props {
  candidates: [Candidate, Candidate];
  race: Race;
  location: string;
  onClose: () => void;
}

export const ComparisonView: React.FC<Props> = ({ candidates, race, location, onClose }) => {
  const [profiles, setProfiles] = useState<[CandidateProfile | null, CandidateProfile | null]>([null, null]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const fetchProfile = async (cand: Candidate) => {
          // 1. Check Cache
          const cached = getCandidateProfile(cand.id);
          if (cached) return cached;

          // 2. Fetch AI
          const fresh = await researchCandidate(cand.name, race.office, location, cand.id);
          if (fresh.party === "Unknown" || !fresh.party) fresh.party = cand.party;
          
          // 3. Save
          saveCandidateProfile(fresh);
          return fresh;
        };

        const results = await Promise.all([
          fetchProfile(candidates[0]),
          fetchProfile(candidates[1])
        ]);

        setProfiles([results[0], results[1]]);
      } catch (err) {
        setError("Failed to load comparison data.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [candidates, race, location]);

  const renderSection = (title: string, contentA: React.ReactNode, contentB: React.ReactNode) => (
    <div className="border-b border-slate-100 py-6">
      <h3 className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">{title}</h3>
      <div className="grid grid-cols-2 gap-4 sm:gap-8">
        <div className="text-sm text-slate-700 leading-relaxed">{contentA}</div>
        <div className="text-sm text-slate-700 leading-relaxed border-l border-slate-100 pl-4 sm:pl-8">{contentB}</div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
        <LoadingState message="Analyzing both candidates side-by-side..." />
      </div>
    );
  }

  const [p1, p2] = profiles;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2 text-slate-800">
                <ScaleIcon size={20} className="text-blue-600" />
                <span className="font-bold">Candidate Comparison</span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <XIcon size={20} className="text-slate-500" />
            </button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-8">
            {error && <div className="text-red-600 text-center p-4">{error}</div>}

            {p1 && p2 && (
                <div className="space-y-2">
                    
                    {/* Names / Photos Header */}
                    <div className="grid grid-cols-2 gap-4 sm:gap-8 mb-6">
                        {[p1, p2].map((p, i) => (
                            <div key={i} className={`text-center ${i === 1 ? 'border-l border-slate-100 pl-4 sm:pl-8' : ''}`}>
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-3 text-xl font-bold text-slate-400">
                                    {p.name.charAt(0)}
                                </div>
                                <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">{p.name}</h2>
                                <div className="mt-2 flex justify-center">
                                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${PARTIES[p.party] || DEFAULT_BADGE_COLOR}`}>
                                        {p.party}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary */}
                    {renderSection("Summary", p1.summary, p2.summary)}

                    {/* Experience */}
                    {renderSection(
                        "Experience", 
                        <ul className="space-y-1 list-disc list-inside">{p1.experience.map((e, i) => <li key={i}>{e}</li>)}</ul>,
                        <ul className="space-y-1 list-disc list-inside">{p2.experience.map((e, i) => <li key={i}>{e}</li>)}</ul>
                    )}

                    {/* Platform */}
                    {renderSection(
                        "Platform Pillars",
                        <ul className="space-y-2">{p1.platform.map((item, i) => <div key={i} className="flex items-start"><CheckCircleIcon size={14} className="text-green-500 mt-1 mr-2 shrink-0"/><span className="text-xs sm:text-sm">{item}</span></div>)}</ul>,
                        <ul className="space-y-2">{p2.platform.map((item, i) => <div key={i} className="flex items-start"><CheckCircleIcon size={14} className="text-green-500 mt-1 mr-2 shrink-0"/><span className="text-xs sm:text-sm">{item}</span></div>)}</ul>
                    )}

                    {/* Key Issues (Attempt to match loosely by index or just list) */}
                    {renderSection(
                        "Key Issues",
                        <div className="space-y-3">
                            {p1.keyIssues.map((issue, i) => (
                                <div key={i} className="bg-slate-50 p-3 rounded border border-slate-100">
                                    <strong className="block text-xs font-bold text-slate-900 uppercase mb-1">{issue.topic}</strong>
                                    <p className="text-xs sm:text-sm">{issue.stance}</p>
                                </div>
                            ))}
                        </div>,
                        <div className="space-y-3">
                             {p2.keyIssues.map((issue, i) => (
                                <div key={i} className="bg-slate-50 p-3 rounded border border-slate-100">
                                    <strong className="block text-xs font-bold text-slate-900 uppercase mb-1">{issue.topic}</strong>
                                    <p className="text-xs sm:text-sm">{issue.stance}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};