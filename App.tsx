import React, { useState, useCallback } from 'react';
import { fetchBallotForLocation } from './services/gemini';
import { Ballot } from './types';
import { LocationPrompt } from './components/LocationPrompt';
import { BallotView } from './components/BallotView';
import { LoadingState } from './components/LoadingState';
import { VoteIcon } from 'lucide-react';

const App: React.FC = () => {
  const [ballot, setBallot] = useState<Ballot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLocationSubmit = useCallback(async (location: string, forceRefresh = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchBallotForLocation(location, forceRefresh);
      setBallot(data);
    } catch (err) {
      console.error(err);
      setError("We couldn't find ballot information for that location. Please try a different city or state.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleReset = () => {
    setBallot(null);
    setError(null);
  };

  const handleRefresh = () => {
      if (ballot && ballot.location) {
          handleLocationSubmit(ballot.location, true);
      }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-900" onClick={handleReset} style={{cursor: 'pointer'}}>
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <VoteIcon size={24} />
            </div>
            <span className="font-bold text-xl tracking-tight">CivicChoice</span>
          </div>
          <div className="text-sm font-medium text-slate-500 hidden sm:block">
            Unbiased. Local. Prepared.
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow px-4 py-8 sm:py-12">
        {loading ? (
          <LoadingState message="Researching upcoming elections in your area..." fullScreen />
        ) : !ballot ? (
          <div className="flex flex-col items-center justify-center mt-8 sm:mt-16 animate-fade-in-up">
            <LocationPrompt onSubmit={(loc) => handleLocationSubmit(loc)} loading={loading} />
            
            {error && (
              <div className="mt-6 max-w-md w-full bg-red-50 border border-red-100 text-red-600 p-4 rounded-lg text-center text-sm">
                {error}
              </div>
            )}

            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full text-center">
              <div className="p-4">
                <h3 className="font-semibold text-lg text-slate-800 mb-2">Smart Search</h3>
                <p className="text-slate-600 text-sm">We find specific elections for your town, city, or county instantly.</p>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg text-slate-800 mb-2">Unbiased Data</h3>
                <p className="text-slate-600 text-sm">AI researches candidates objectively, stripping away campaign rhetoric.</p>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg text-slate-800 mb-2">Offline Ready</h3>
                <p className="text-slate-600 text-sm">Researched profiles are saved to your device for quick access.</p>
              </div>
            </div>
          </div>
        ) : (
          <BallotView 
            ballot={ballot} 
            onReset={handleReset} 
            onRefresh={handleRefresh} 
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm">
            &copy; {new Date().getFullYear()} CivicChoice. Not affiliated with any government entity.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;