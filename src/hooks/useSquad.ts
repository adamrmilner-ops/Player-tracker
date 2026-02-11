import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Player } from "../types";

export function useSquad() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlayers = useCallback(async () => {
    const { data } = await supabase
      .from("players")
      .select("*")
      .order("name");
    if (data) setPlayers(data as Player[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Initial data load + realtime subscription
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPlayers();

    const channel = supabase
      .channel("players-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players" },
        () => {
          fetchPlayers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPlayers]);

  async function addPlayer(
    name: string,
    position?: string,
    squadNumber?: number
  ) {
    await supabase.from("players").insert({
      name,
      position: position || null,
      squad_number: squadNumber || null,
    });
  }

  async function updatePlayer(id: string, updates: Partial<Player>) {
    await supabase.from("players").update(updates).eq("id", id);
  }

  const activePlayers = players.filter((p) => p.active);

  return { players, activePlayers, loading, addPlayer, updatePlayer };
}
