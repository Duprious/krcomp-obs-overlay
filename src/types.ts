export interface HistoryEntry {
  accuracy: number;
  assists: number;
  damage_done: number;
  deaths: number;
  headshots: number;
  kills: number;
  objective_score: number;
  score: number;
  team: number;
  player_name: string;
  rank: number;
  mmr_change: number;
}

export interface Match {
  date: string;
  map: number;
  duration: number;
  mode: number;
  season: number;
  is_ranked: number;
  is_competitive: number;
  match_history_processed: number;
  region: number;
  historyEntries: HistoryEntry[];
  score_alpha: number;
  score_bravo: number;
}

export interface MatchHistoryResponse {
  data: {
    matchHistory: {
      matches: Match[];
      totalPages: number;
    };
  };
}
