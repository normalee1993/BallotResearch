import { GoogleGenAI } from "@google/genai";
import { Ballot, CandidateProfile, Race } from '../types';
import { getBallot, saveBallot } from './storage';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing");
  return new GoogleGenAI({ apiKey });
};

/**
 * Helper to safely parse JSON from LLM output which might contain Markdown code blocks
 * or conversational text.
 */
const cleanAndParseJSON = <T>(text: string): T => {
  // Locate the first opening brace and last closing brace to extract the JSON object
  const startIndex = text.indexOf('{');
  const endIndex = text.lastIndexOf('}');

  if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
    throw new Error("Response does not contain a valid JSON object");
  }

  const jsonString = text.substring(startIndex, endIndex + 1);
  return JSON.parse(jsonString);
};

/**
 * Finds upcoming elections for a location using Search Grounding.
 * Checks local database first to reduce AI costs unless forceRefresh is true.
 */
export const fetchBallotForLocation = async (location: string, forceRefresh = false): Promise<Ballot> => {
  // 1. Check Cache/Database
  if (!forceRefresh) {
    const cachedBallot = getBallot(location);
    if (cachedBallot) {
      return cachedBallot;
    }
  }

  // 2. Fetch from AI if not in DB or expired
  console.log(`Fetching fresh ballot data for: ${location} (Refresh: ${forceRefresh})...`);
  const ai = getClient();
  
  // Explicitly describing the JSON structure in the prompt
  const systemInstruction = `You are a neutral election database assistant. 
  Find the next upcoming official government election (local, state, or federal) for the provided location.
  If no election is scheduled in the next 6 months, find the most recent past election results to serve as a demo.
  
  CRITICAL INSTRUCTIONS:
  1. You must return the result as a valid JSON string matching the exact structure below.
  2. Output ONLY the JSON object. Do not add any conversational text or markdown formatting.
  3. INCLUDE ALL CANDIDATES: You must list every candidate running, including Independents, Third-Party (Libertarian, Green, etc.), and Unaffiliated candidates. Do not limit results to just Democrats and Republicans.
  
  Expected JSON Structure:
  {
    "location": "string (Clean Format, e.g., Austin, TX)",
    "date": "string (YYYY-MM-DD)",
    "races": [
      {
        "id": "string",
        "office": "string",
        "type": "candidate" | "proposition",
        "description": "string (optional)",
        "candidates": [
          {
            "id": "string",
            "name": "string",
            "party": "string",
            "incumbent": boolean
          }
        ]
      }
    ]
  }

  Mark incumbent candidates if known.
  Do not invent candidates. Use real data found via search.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Find the complete official ballot for: ${location}. Ensure you find ALL candidates, including Independents.`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: systemInstruction,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No data returned from AI");
    
    const data = cleanAndParseJSON<Ballot>(text);
    
    // Post-process to ensure IDs and metadata exist
    data.lastUpdated = Date.now();
    data.races?.forEach((race, rIdx) => {
        if (!race.id) race.id = `race-${rIdx}`;
        race.candidates?.forEach((cand, cIdx) => {
            if (!cand.id) cand.id = `${race.id}-cand-${cIdx}`;
            
            // Normalize party names if missing
            if (!cand.party || cand.party.trim() === "") {
                cand.party = "Nonpartisan";
            } else {
                // Simple capitalization fix to ensure "independent" becomes "Independent"
                cand.party = cand.party.charAt(0).toUpperCase() + cand.party.slice(1);
            }
        });
    });

    // 3. Save to Database
    saveBallot(data);

    return data;
  } catch (error) {
    console.error("Ballot fetch error:", error);
    throw new Error("Failed to fetch ballot data. Please try again.");
  }
};

/**
 * Researches a specific candidate using Search Grounding.
 * Returns an unbiased profile.
 * Note: Caching for this is handled in the component layer (CandidateDetail) or via storage check.
 */
export const researchCandidate = async (
  name: string, 
  office: string, 
  location: string, 
  candidateId: string
): Promise<CandidateProfile> => {
  const ai = getClient();

  const systemInstruction = `You are an unbiased political researcher.
  Research the candidate provided. 
  Provide a neutral summary of their platform, party affiliation, key issues, and professional background.
  Do not use emotive language. Stick to facts found in search results.
  
  CRITICAL: Return valid JSON strictly matching this structure. 
  Output ONLY the JSON object. Do not include "Here is the JSON" or any other conversational text.

  Expected JSON Structure:
  {
    "summary": "A 2-3 sentence neutral bio.",
    "platform": ["List of platform pillars"],
    "experience": ["Past job titles or political roles"],
    "education": "string",
    "keyIssues": [
      { "topic": "string", "stance": "string" }
    ]
  }`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Research candidate ${name} running for ${office} in ${location}.`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: systemInstruction,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No profile data returned");
    
    const rawData = cleanAndParseJSON<any>(text);

    // Extract sources from grounding metadata if available
    const sources: { title: string; uri: string }[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
        chunks.forEach((chunk: any) => {
            if (chunk.web?.uri) {
                sources.push({ title: chunk.web.title || "Source", uri: chunk.web.uri });
            }
        });
    }

    const profile: CandidateProfile = {
      id: candidateId,
      name,
      office,
      party: "Unknown", // Will be merged in UI or updated if prompt requests it
      ...rawData,
      sources,
      lastUpdated: Date.now()
    };

    return profile;

  } catch (error) {
    console.error("Candidate research error:", error);
    throw new Error("Unable to complete research on this candidate.");
  }
};