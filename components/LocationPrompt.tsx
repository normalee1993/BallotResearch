import React, { useState } from 'react';
import { MapPinIcon, ArrowRightIcon } from 'lucide-react';

interface Props {
  onSubmit: (location: string) => void;
  loading: boolean;
}

export const LocationPrompt: React.FC<Props> = ({ onSubmit, loading }) => {
  const [input, setInput] = useState("");

  const handleGeoClick = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    
    // Simple loading state indication before the main loader
    const btn = document.getElementById('geo-btn');
    if(btn) btn.innerText = "Locating...";

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        // Reverse geocoding is usually needed here, but for simplicity with Gemini
        // we can pass lat/long string or ask the user.
        // However, Gemini accepts city names better for the prompt structure. 
        // Let's try to use lat,long as the search query string, Gemini is smart enough.
        onSubmit(`${latitude}, ${longitude}`);
      },
      (error) => {
        alert("Unable to retrieve your location. Please type it manually.");
        if(btn) btn.innerText = "Use My Location";
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input);
    }
  };

  return (
    <div className="max-w-md mx-auto w-full bg-white rounded-xl shadow-lg p-8 border border-slate-100">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPinIcon size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Find Your Ballot</h2>
        <p className="text-slate-500 mt-2">
          Enter your city, county, or state to see upcoming elections and unbiased candidate info.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="location" className="sr-only">Location</label>
          <input
            type="text"
            id="location"
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors outline-none"
            placeholder="e.g., Austin, TX or 78701"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Search Ballot</span>
          <ArrowRightIcon size={18} />
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-slate-500">Or</span>
        </div>
      </div>

      <button
        id="geo-btn"
        type="button"
        onClick={handleGeoClick}
        disabled={loading}
        className="w-full bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
      >
        <MapPinIcon size={18} />
        <span>Use My Current Location</span>
      </button>
    </div>
  );
};
