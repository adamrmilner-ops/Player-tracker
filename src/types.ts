export interface Player {
  id: string;
  name: string;
  position: string | null;
  squad_number: number | null;
  active: boolean;
  created_at: string;
}

export type MatchStatus =
  | "not_started"
  | "first_half"
  | "half_time"
  | "second_half"
  | "full_time";

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
  date: string;
  opposition: string;
  venue: string;
  is_home: boolean;
  location_lat: number | null;
  location_lng: number | null;
  weather_description: string | null;
  weather_temp: number | null;
  weather_wind_speed: number | null;
  weather_icon: string | null;
  status: MatchStatus;
  kick_off_at: string | null;
  half_time_at: string | null;
  second_half_start_at: string | null;
  full_time_at: string | null;
  selected_player_ids: string[];
  home_score: number;
  away_score: number;
  created_at: string;
  created_by: string;
}

export interface PitchEvent {
  id: string;
  match_id: string;
  player_id: string;
  type: "on" | "off";
  timestamp: string;
  recorded_by: string;
}

export interface ScoreEvent {
  id: string;
  match_id: string;
  type: "try" | "conversion";
  scorer_id: string | null;
  is_opposition: boolean;
  timestamp: string;
  recorded_by: string;
}
