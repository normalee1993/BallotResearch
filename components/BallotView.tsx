import React, { useState } from 'react';
import { Ballot, Candidate, Race } from '../types';
import { CandidateDetail } from './CandidateDetail';
import { ComparisonView } from './ComparisonView';
import { PARTIES, DEFAULT_BADGE_COLOR } from '../constants';
import { UsersIcon, FileTextIcon, ScaleIcon, CheckSquareIcon, RotateCwIcon } from 'lucide-react';

interface Props {
  ballot: Ballot;
  onReset: () => void;
  onRefresh: () => void;
}

export const BallotView: React.FC<Props> = ({ ballot, onReset, onRefresh }) => {
  const [selectedCandidate, setSelectedCandidate] = useState<{cand: Candidate, race: Race} | null>(null);
  
  // Track which race is in "Compare Mode"
  const [compareRaceId, setCompareRaceId] = useState<string | null>(null);
  // Track selected candidate IDs for comparison
  const [compareSelection, setCompareSelection] = useState<Candidate[]>([]);

  const toggleCompareMode = (raceId: string) => {
    if (compareRaceId === raceId) {
      // Exit compare mode
      setCompareRaceId(null);
      setCompareSelection([]);
    } else {
      // Enter compare mode for this race
      setCompareRaceId(raceId);
      setCompareSelection([]);
    }
  };

  const toggleCandidateSelection = (candidate: Candidate) => {
    if (compareSelection.find(c => c.id === candidate.id)) {
      setCompareSelection(prev => prev.filter(c => c.id !== candidate.id));
    } else {
      if (compareSelection.length < 2) {
        setCompareSelection(prev => [...prev, candidate]);
      }
    }
  };

  // Determine if we should show the comparison modal
  const [showComparison, setShowComparison] = useState(false);

  const handleCompareClick = () => {
    if (compareSelection.length === 2) {
        setShowComparison(true);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Your Ballot</h1>
                <p className="text-slate-500 mt-1">
                    {ballot.location} • {ballot.date || "Upcoming Election"}
                </p>
            </div>
            <div className="flex items-center space-x-4">
                <button 
                    onClick={onRefresh}
                    className="flex items-center text-sm text-slate-500 font-medium hover:text-blue-600 transition-colors"
                    title="Force refresh data from AI"
                >
                    <RotateCwIcon size={16} className="mr-1.5"/>
                    Refresh Data
                </button>
                <div className="h-4 w-px bg-slate-300 hidden sm:block"></div>
                <button 
                    onClick={onReset}
                    className="text-sm text-blue-600 font-medium hover:underline"
                >
                    Change Location
                </button>
            </div>
        </div>

        <div className="space-y-8">
            {ballot.races.map((race) => {
                const isCompareMode = compareRaceId === race.id;
                const canCompare = race.candidates.length >= 2;
                
                return (
                    <div key={race.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 flex items-center">
                                    {race.type === 'candidate' ? <UsersIcon size={20} className="mr-2 text-slate-400"/> : <FileTextIcon size={20} className="mr-2 text-slate-400"/>}
                                    {race.office}
                                </h2>
                                {race.description && <p className="text-sm text-slate-500 mt-1">{race.description}</p>}
                            </div>
                            
                            {canCompare && race.type === 'candidate' && (
                                <button 
                                    onClick={() => toggleCompareMode(race.id)}
                                    className={`text-sm font-medium flex items-center px-3 py-1.5 rounded-full transition-colors ${isCompareMode ? 'bg-blue-100 text-blue-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                >
                                    <ScaleIcon size={14} className="mr-1.5"/>
                                    {isCompareMode ? 'Cancel Compare' : 'Compare'}
                                </button>
                            )}
                        </div>

                        {isCompareMode && (
                             <div className="bg-blue-50 px-6 py-3 flex items-center justify-between border-b border-blue-100">
                                <p className="text-sm text-blue-800">
                                    Select <strong>2</strong> candidates to compare ({compareSelection.length}/2)
                                </p>
                                <button 
                                    disabled={compareSelection.length !== 2}
                                    onClick={handleCompareClick}
                                    className="bg-blue-600 text-white text-sm font-bold px-4 py-1.5 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                                >
                                    Compare Now
                                </button>
                             </div>
                        )}
                        
                        <div className="divide-y divide-slate-100">
                            {race.candidates.map((cand) => {
                                const isSelected = compareSelection.some(c => c.id === cand.id);
                                const disabled = isCompareMode && !isSelected && compareSelection.length >= 2;

                                return (
                                    <div 
                                        key={cand.id} 
                                        onClick={() => {
                                            if (isCompareMode) {
                                                if (!disabled) toggleCandidateSelection(cand);
                                            } else {
                                                setSelectedCandidate({cand, race});
                                            }
                                        }}
                                        className={`p-6 transition-colors cursor-pointer group ${
                                            isCompareMode 
                                                ? (isSelected ? 'bg-blue-50/50' : (disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50'))
                                                : 'hover:bg-blue-50'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                {isCompareMode && (
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'}`}>
                                                        {isSelected && <CheckSquareIcon size={14} />}
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                                                        {cand.name}
                                                    </h3>
                                                    <div className="flex items-center mt-1 space-x-2">
                                                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${PARTIES[cand.party] || DEFAULT_BADGE_COLOR}`}>
                                                            {cand.party}
                                                        </span>
                                                        {cand.incumbent && (
                                                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                                                                Incumbent
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {!isCompareMode && (
                                                <button className="text-sm font-medium text-slate-400 group-hover:text-blue-600 transition-colors">
                                                    View Profile →
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {race.candidates.length === 0 && (
                                <div className="p-6 text-center text-slate-400 italic">
                                    No candidates found for this position yet.
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>

        <div className="mt-12 text-center">
            <p className="text-xs text-slate-400 max-w-2xl mx-auto">
                Disclaimer: This application uses AI to gather and summarize public information. 
                While we strive for neutrality, AI models can make mistakes. 
                Always verify critical information with official government sources.
            </p>
        </div>

        {selectedCandidate && (
            <CandidateDetail 
                candidate={selectedCandidate.cand} 
                race={selectedCandidate.race} 
                location={ballot.location}
                onClose={() => setSelectedCandidate(null)}
            />
        )}

        {showComparison && compareSelection.length === 2 && compareRaceId && (
             <ComparisonView
                candidates={[compareSelection[0], compareSelection[1]]}
                race={ballot.races.find(r => r.id === compareRaceId)!}
                location={ballot.location}
                onClose={() => setShowComparison(false)}
             />
        )}
    </div>
  );
};