import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Match, PitchEvent, ScoreEvent, MatchStatus } from "../types";

export function useMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = useCallback(async () => {
    const { data } = await supabase
      .from("matches")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setMatches(data as Match[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMatches();

    const channel = supabase
      .channel("matches-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        () => {
          fetchMatches();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMatches]);

  async function createMatch(
    matchData: Omit<Match, "id" | "created_at">
  ): Promise<string> {
    const { data, error } = await supabase
      .from("matches")
      .insert(matchData)
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  }

  async function updateMatch(id: string, updates: Partial<Match>) {
    await supabase.from("matches").update(updates).eq("id", id);
  }

  return { matches, loading, createMatch, updateMatch };
}

export function useLiveMatch(matchId: string | undefined) {
  const [match, setMatch] = useState<Match | null>(null);
  const [pitchEvents, setPitchEvents] = useState<PitchEvent[]>([]);
  const [scoreEvents, setScoreEvents] = useState<ScoreEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatch = useCallback(async () => {
    if (!matchId) return;
    const { data } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();
    if (data) setMatch(data as Match);
    setLoading(false);
  }, [matchId]);

  const fetchPitchEvents = useCallback(async () => {
    if (!matchId) return;
    const { data } = await supabase
      .from("pitch_events")
      .select("*")
      .eq("match_id", matchId)
      .order("timestamp", { ascending: true });
    if (data) setPitchEvents(data as PitchEvent[]);
  }, [matchId]);

  const fetchScoreEvents = useCallback(async () => {
    if (!matchId) return;
    const { data } = await supabase
      .from("score_events")
      .select("*")
      .eq("match_id", matchId)
      .order("timestamp", { ascending: true });
    if (data) setScoreEvents(data as ScoreEvent[]);
  }, [matchId]);

  useEffect(() => {
    if (!matchId) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMatch(); fetchPitchEvents(); fetchScoreEvents();

    const matchChannel = supabase
      .channel(`match-${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "matches",
          filter: `id=eq.${matchId}`,
        },
        () => {
          fetchMatch();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "pitch_events",
          filter: `match_id=eq.${matchId}`,
        },
        () => {
          fetchPitchEvents();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "score_events",
          filter: `match_id=eq.${matchId}`,
        },
        () => {
          fetchScoreEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(matchChannel);
    };
  }, [matchId, fetchMatch, fetchPitchEvents, fetchScoreEvents]);

  async function updateMatch(updates: Partial<Match>) {
    if (!matchId) return;
    await supabase.from("matches").update(updates).eq("id", matchId);
  }

  async function updateMatchStatus(status: MatchStatus) {
    if (!matchId) return;
    const nowIso = new Date().toISOString();
    const updates: Partial<Match> = { status };

    if (status === "first_half") updates.kick_off_at = nowIso;
    if (status === "half_time") updates.half_time_at = nowIso;
    if (status === "second_half") updates.second_half_start_at = nowIso;
    if (status === "full_time") updates.full_time_at = nowIso;

    await supabase.from("matches").update(updates).eq("id", matchId);
  }

  async function addPitchEvent(
    playerId: string,
    type: "on" | "off",
    coachId: string
  ) {
    await supabase.from("pitch_events").insert({
      match_id: matchId!,
      player_id: playerId,
      type,
      recorded_by: coachId,
    });
  }

  async function addScoreEvent(
    type: "try" | "conversion",
    isOpposition: boolean,
    scorerId: string | undefined,
    coachId: string
  ) {
    if (!matchId || !match) return;

    const points = type === "try" ? 5 : 2;
    const scoreField = isOpposition ? "away_score" : "home_score";
    const currentScore = isOpposition ? match.away_score : match.home_score;

    await supabase.from("score_events").insert({
      match_id: matchId,
      type,
      scorer_id: scorerId || null,
      is_opposition: isOpposition,
      recorded_by: coachId,
    });

    await supabase
      .from("matches")
      .update({ [scoreField]: currentScore + points })
      .eq("id", matchId);
  }

  return {
    match,
    pitchEvents,
    scoreEvents,
    loading,
    updateMatch,
    updateMatchStatus,
    addPitchEvent,
    addScoreEvent,
  };
}

// Timestamps are ISO strings from Supabase, convert to ms for duration calc
function toMs(isoString: string): number {
  return new Date(isoString).getTime();
}

export function getPlayerPitchTime(
  playerId: string,
  pitchEvents: PitchEvent[],
  match: Match | null,
  currentTime: number
): number {
  const events = pitchEvents.filter((e) => e.player_id === playerId);
  let total = 0;
  let onTime: number | null = null;

  for (const event of events) {
    if (event.type === "on") {
      onTime = toMs(event.timestamp);
    } else if (event.type === "off" && onTime !== null) {
      total += toMs(event.timestamp) - onTime;
      onTime = null;
    }
  }

  // If still on pitch, count time up to now or full time
  if (onTime !== null) {
    const endTime =
      match?.status === "full_time" && match.full_time_at
        ? toMs(match.full_time_at)
        : currentTime;
    total += endTime - onTime;
  }

  return total;
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function isPlayerOnPitch(
  playerId: string,
  pitchEvents: PitchEvent[]
): boolean {
  const events = pitchEvents.filter((e) => e.player_id === playerId);
  if (events.length === 0) return false;
  return events[events.length - 1].type === "on";
}
