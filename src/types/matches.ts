export type MatchStatus = 'not_started' | 'in_progress' | 'finished';

export interface MatchPlayer {
  username: string;
  rating: number;
  title?: string;
  country_code?: string;
  color: 'white' | 'black';
}

export interface MatchTimeControl {
  initial_seconds: number;
  increment_seconds: number;
}

export interface MatchClocks {
  white_ms: number;
  black_ms: number;
}

export interface MatchOpening {
  name?: string;
  eco?: string;
}

export interface MatchStakes {
  tier: string;
  min_bet: number;
  max_bet: number;
  currency: string;
}

export interface MatchSource {
  provider: string;
  url?: string;
}

export interface MatchStats {
  total_bets: number;
  total_pool: number;
  house_exposure?: number;
  cap?: number;
}

export interface FeaturedMatchDTO {
  match_id: string;
  status: MatchStatus;
  time_control: MatchTimeControl;
  players: MatchPlayer[];
  clocks?: MatchClocks;
  opening?: MatchOpening;
  stakes?: MatchStakes;
  source?: MatchSource;
  stats?: MatchStats;
  meta?: {
    move_number?: number;
    phase?: string;
  }
}

export interface MatchDetailsDTO extends FeaturedMatchDTO {
  meta?: FeaturedMatchDTO['meta'] & {
    last_move_san?: string;
    side_to_move?: 'white' | 'black';
  };
  odds?: { white_win: number; draw: number; black_win: number };
}

