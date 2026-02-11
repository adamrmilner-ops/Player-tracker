export interface Player {
  id: string;
  name: string;
  position?: string;
  squadNumber?: number;
  active: boolean;
  createdAt: number;
}

export type MatchStatus =
  | "not_started"
  | "first_half"
  | "half_time"
  | "second_half"
  | "full_time";

export interface MatchTimestamps {
  kickOff?: number;
  halfTime?: number;
  secondHalfStart?: number;
  fullTime?: number;
}

export interface WeatherInfo {
  description: string;
  temp: number;
  windSpeed: number;
  icon: string;
}

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface Match {
  id: string;
  date: string; // ISO date
  opposition: string;
  venue: string;
  isHome: boolean;
  location?: GeoLocation;
  weather?: WeatherInfo;
  status: MatchStatus;
  timestamps: MatchTimestamps;
  selectedPlayerIds: string[];
  homeScore: number;
  awayScore: number;
  createdAt: number;
  createdBy: string;
}

export interface PitchEvent {
  id: string;
  matchId: string;
  playerId: string;
  type: "on" | "off";
  timestamp: number;
  recordedBy: string;
}

export interface ScoreEvent {
  id: string;
  matchId: string;
  type: "try" | "conversion";
  scorerId?: string; // player ID, undefined for opposition
  isOpposition: boolean;
  timestamp: number;
  recordedBy: string;
}

export interface Coach {
  id: string;
  name: string;
  email: string;
}
