import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useSquad } from "../hooks/useSquad";
import { useMatches, formatDuration } from "../hooks/useMatch";
import type { PitchEvent, ScoreEvent, Match } from "../types";
import { Clock, Trophy, BarChart3 } from "lucide-react";

export default function StatsPage() {
  const { players } = useSquad();
  const { matches } = useMatches();
  const [allPitchEvents, setAllPitchEvents] = useState<PitchEvent[]>([]);
  const [allScoreEvents, setAllScoreEvents] = useState<ScoreEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    const [pitchRes, scoreRes] = await Promise.all([
      supabase
        .from("pitch_events")
        .select("*")
        .order("timestamp", { ascending: true }),
      supabase
        .from("score_events")
        .select("*")
        .order("timestamp", { ascending: true }),
    ]);
    if (pitchRes.data) setAllPitchEvents(pitchRes.data as PitchEvent[]);
    if (scoreRes.data) setAllScoreEvents(scoreRes.data as ScoreEvent[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEvents();

    const channel = supabase
      .channel("stats-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pitch_events" },
        () => fetchEvents()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "score_events" },
        () => fetchEvents()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEvents]);

  const completedMatches = matches.filter((m) => m.status === "full_time");

  // Calculate stats per player
  const playerStats = players
    .filter((p) => p.active)
    .map((player) => {
      let totalPitchTime = 0;
      let matchesPlayed = 0;
      const tries = allScoreEvents.filter(
        (e) =>
          e.scorer_id === player.id && e.type === "try" && !e.is_opposition
      ).length;
      const conversions = allScoreEvents.filter(
        (e) =>
          e.scorer_id === player.id &&
          e.type === "conversion" &&
          !e.is_opposition
      ).length;

      for (const match of completedMatches) {
        const matchEvents = allPitchEvents.filter(
          (e) => e.match_id === match.id && e.player_id === player.id
        );

        if (matchEvents.length > 0) {
          matchesPlayed++;
          totalPitchTime += calculatePitchTimeForMatch(matchEvents, match);
        }
      }

      return {
        player,
        totalPitchTime,
        matchesPlayed,
        tries,
        conversions,
        points: tries * 5 + conversions * 2,
      };
    })
    .sort((a, b) => b.totalPitchTime - a.totalPitchTime);

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">Loading stats...</div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold text-gray-900 mb-1">Player Stats</h2>
      <p className="text-sm text-gray-500 mb-4">
        Across {completedMatches.length} completed{" "}
        {completedMatches.length === 1 ? "match" : "matches"}
      </p>

      {playerStats.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <BarChart3 size={48} className="mx-auto mb-3 opacity-50" />
          <p className="font-medium">No stats yet</p>
          <p className="text-sm">
            Complete matches to see player statistics
          </p>
        </div>
      )}

      <div className="space-y-2">
        {playerStats.map(
          ({ player, totalPitchTime, matchesPlayed, tries, conversions, points }) => (
            <div
              key={player.id}
              className="bg-white rounded-xl p-3 shadow-sm border border-gray-200"
            >
              <div className="flex items-center gap-3 mb-2">
                {player.squad_number && (
                  <span className="bg-emerald-100 text-emerald-800 font-bold text-sm w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0">
                    {player.squad_number}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {player.name}
                  </p>
                  {player.position && (
                    <p className="text-xs text-gray-500">{player.position}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 rounded-lg py-1.5">
                  <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                    <Clock size={10} />
                    Pitch Time
                  </p>
                  <p className="font-semibold text-sm text-gray-900">
                    {formatDuration(totalPitchTime)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg py-1.5">
                  <p className="text-xs text-gray-500">Matches</p>
                  <p className="font-semibold text-sm text-gray-900">
                    {matchesPlayed}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg py-1.5">
                  <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                    <Trophy size={10} />
                    Points
                  </p>
                  <p className="font-semibold text-sm text-gray-900">
                    {points}
                    {tries > 0 && (
                      <span className="text-xs text-gray-400 ml-1">
                        ({tries}T {conversions}C)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function toMs(iso: string): number {
  return new Date(iso).getTime();
}

function calculatePitchTimeForMatch(
  events: PitchEvent[],
  match: Match
): number {
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

  if (onTime !== null && match.full_time_at) {
    total += toMs(match.full_time_at) - onTime;
  }

  return total;
}
