import { useState, useEffect } from 'react';
import useSWR from 'swr';
import type { MatchHistoryResponse } from './types';

const fetcher = async ([url, token]: [string, string]) => {
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`.replaceAll("\"", ""),
      'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.0 Electron/12.0.0-nightly.20201116 Safari/537.36",
      'Origin': "https://krunker.io",
      'Referer': "https://krunker.io/?game=FRA:929il",
    }
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}. Check your Bearer Token.`);
  }

  return response.json();
};


const getMapName = (mapId: number): string => {
  const mapNames: { [key: number]: string } = { 17: 'Bureau', 11: 'Industry', 2: 'Sandstorm', 0: "Burg", 4: "Undergrowth", 12: "Lumber", 5: "Shipment", 14: "Site", };
  return mapNames[mapId] || `Map ID: ${mapId}`;
};

const getRankName = (rankId: number): string => {
  const rankNames: { [key: number]: string } = { 0: 'Unranked', 1: 'Bronze 1', 2: 'Bronze 2', 3: 'Bronze 3', 4: 'Silver 1', 5: 'Silver 2', 6: 'Silver 3', 7: 'Gold 1', 8: 'Gold 2', 9: 'Gold 3', 10: 'Platinum 1', 11: 'Platinum 2', 12: 'Platinum 3', 13: 'Diamond 1', 14: 'Diamond 2', 15: 'Diamond 3', 16: 'Master 1', 17: 'Master 2', 18: 'Master 3', 19: 'Grandmaster 1', 20: 'Grandmaster 2', 21: 'Grandmaster 3' };
  return rankNames[rankId] || `Rank ID: ${rankId}`;
};

interface PlayerMatchInfo {
  isWinner: boolean;
  kdRatio: string;
  mmrChange: number;
  mapName: string;
  rank: string;
}

function App() {
  const [krunkerUsername, setKrunkerUsername] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    const savedUsername = localStorage.getItem('krunkerUsername');
    const savedToken = localStorage.getItem('apiToken');
    if (savedUsername && savedToken) {
      setKrunkerUsername(savedUsername);
      setApiToken(savedToken);
      setIsConfigured(true);
    }
  }, []);

  const API_URL = 'https://api.krunker.io/match-history/me/season/3/gameMode/undefined/isRanked/true/region/3?limit=5&offset=0';

  const { data, error, isLoading } = useSWR<MatchHistoryResponse>(
    isConfigured ? [API_URL, apiToken] : null,
    fetcher,
    {
      refreshInterval: 4 * 60 * 1000,
    }
  );
  console.log(data);

  let playerInfo: PlayerMatchInfo | null = null;
  let processingError: string | null = error ? error.message : null;

  if (data) {
    try {
      const latestMatchWithPlayer = data.data.matchHistory.matches.find(match =>
        match.historyEntries.some(player => player.player_name === krunkerUsername)
      );

      if (!latestMatchWithPlayer) {
        processingError = `Username "${krunkerUsername}" not found in your last 5 matches.`;
      } else {
        const playerData = latestMatchWithPlayer.historyEntries.find(p => p.player_name === krunkerUsername);
        if (!playerData) throw new Error("Could not retrieve player data from the match.");

        const playerTeam = playerData.team;
        const isWinner = (playerTeam === 1 && latestMatchWithPlayer.score_alpha > latestMatchWithPlayer.score_bravo) ||
          (playerTeam === 2 && latestMatchWithPlayer.score_bravo > latestMatchWithPlayer.score_alpha);

        const kdRatio = playerData.deaths === 0
          ? playerData.kills.toFixed(1)
          : (playerData.kills / playerData.deaths).toFixed(2);

        playerInfo = {
          isWinner,
          kdRatio,
          mmrChange: playerData.mmr_change,
          mapName: getMapName(latestMatchWithPlayer.map),
          rank: getRankName(playerData.rank),
        };
      }
    } catch (err: any) {
      processingError = err.message || "Failed to process match data.";
    }
  }


  const handleSave = () => {
    if (krunkerUsername.trim() && apiToken.trim()) {
      localStorage.setItem('krunkerUsername', krunkerUsername.trim());
      localStorage.setItem('apiToken', apiToken.trim());
      setIsConfigured(true);
    } else {
      alert("Please fill in both fields.");
    }
  };

  const handleReset = () => {
    localStorage.removeItem('krunkerUsername');
    localStorage.removeItem('apiToken');
    setIsConfigured(false);
    setKrunkerUsername('');
    setApiToken('');
  };

  if (!isConfigured) {
    return (
      <div className="z-50 font-sans max-w-sm">
        <div className="bg-gray-900 bg-opacity-80 backdrop-blur-md p-6 border border-gray-700 text-gray-200">
          <h1 className="text-xl font-bold text-center mb-4">Setup Match Overlay</h1>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Krunker Username</label>
              <input
                type="text"
                placeholder="e.g., Guest_1"
                value={krunkerUsername}
                onChange={(e) => setKrunkerUsername(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">API Bearer Token</label>
              <input
                type="password"
                placeholder="Paste your token here. This will only be stored in your own browser!"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSave}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
            >
              Save and Display Stats
            </button>
          </div>
        </div>
      </div>
    );
  }

  const textShadow = "[text-shadow:0_1px_3px_rgba(0,0,0,0.7)]";

  return (
    <div className="font-sans max-w-xs">
      {isLoading && <div className={`text-center text-gray-200 ${textShadow}`}>Loading Last Match...</div>}

      {processingError && (
        <div className="bg-red-800 bg-opacity-50 p-3 border border-red-500/50">
          <h3 className={`font-bold text-red-300 ${textShadow}`}>Error</h3>
          <p className={`text-sm text-white ${textShadow}`}>{processingError}</p>
        </div>
      )}

      {playerInfo && !processingError && (
        <div className={`z-50 bg-gray-900 bg-opacity-70 backdrop-blur-md p-4 border ${playerInfo.isWinner ? 'border-green-500/50' : 'border-red-500/50'} text-gray-200`}>
          <div className="text-center pb-3 border-b border-gray-600">
            <h2 className={`text-xs text-gray-200 uppercase tracking-wider font-semibold mb-1 ${textShadow}`}>Last Match</h2>
            <h1 className={`text-3xl font-bold ${playerInfo.isWinner ? 'text-green-400' : 'text-red-400'} ${textShadow}`}>{playerInfo.isWinner ? 'VICTORY' : 'DEFEAT'}</h1>
            <p className={`text-gray-300 text-sm ${textShadow}`}>{playerInfo.mapName}</p>
          </div>
          <div className="flex justify-around items-center pt-3">
            <div className="text-center">
              <div className={`text-xs text-gray-300 uppercase ${textShadow}`}>K/D Ratio</div>
              <div className={`text-2xl font-semibold text-white ${textShadow}`}>{playerInfo.kdRatio}</div>
            </div>
            <div className="text-center">
              <div className={`text-xs text-gray-300 uppercase ${textShadow}`}>MMR</div>
              <div className={`text-2xl font-semibold ${playerInfo.mmrChange >= 0 ? 'text-green-400' : 'text-red-400'} ${textShadow}`}>{playerInfo.mmrChange >= 0 ? '+' : ''}{playerInfo.mmrChange}</div>
            </div>
            <div className="text-center">
              <div className={`text-xs text-gray-300 uppercase ${textShadow}`}>Rank</div>
              <div className={`text-2xl font-semibold text-white ${textShadow}`}>{playerInfo.rank}</div>
            </div>
          </div>
        </div>
      )}

      <div className="text-center mt-2">
        <button onClick={handleReset} className={`text-xs text-gray-400 hover:text-white ${textShadow} bg-gray-800/50 px-2 py-1 rounded`}>
          Change Settings
        </button>
      </div>
    </div>
  );
}

export default App;