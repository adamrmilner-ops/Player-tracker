import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { Match, PitchEvent, ScoreEvent, MatchStatus } from "../types";

export function useMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "matches"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Match[];
      setMatches(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  async function createMatch(matchData: Omit<Match, "id">) {
    const docRef = await addDoc(collection(db, "matches"), matchData);
    return docRef.id;
  }

  async function updateMatch(id: string, updates: Partial<Match>) {
    await updateDoc(doc(db, "matches", id), updates);
  }

  return { matches, loading, createMatch, updateMatch };
}

export function useLiveMatch(matchId: string | undefined) {
  const [match, setMatch] = useState<Match | null>(null);
  const [pitchEvents, setPitchEvents] = useState<PitchEvent[]>([]);
  const [scoreEvents, setScoreEvents] = useState<ScoreEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!matchId) return;

    const unsubs: (() => void)[] = [];

    unsubs.push(
      onSnapshot(doc(db, "matches", matchId), (snap) => {
        if (snap.exists()) {
          setMatch({ id: snap.id, ...snap.data() } as Match);
        }
        setLoading(false);
      })
    );

    const peQuery = query(
      collection(db, "pitchEvents"),
      where("matchId", "==", matchId),
      orderBy("timestamp", "asc")
    );
    unsubs.push(
      onSnapshot(peQuery, (snap) => {
        setPitchEvents(
          snap.docs.map((d) => ({ id: d.id, ...d.data() })) as PitchEvent[]
        );
      })
    );

    const seQuery = query(
      collection(db, "scoreEvents"),
      where("matchId", "==", matchId),
      orderBy("timestamp", "asc")
    );
    unsubs.push(
      onSnapshot(seQuery, (snap) => {
        setScoreEvents(
          snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ScoreEvent[]
        );
      })
    );

    return () => unsubs.forEach((u) => u());
  }, [matchId]);

  async function updateMatch(updates: Partial<Match>) {
    if (!matchId) return;
    await updateDoc(doc(db, "matches", matchId), updates);
  }

  async function updateMatchStatus(status: MatchStatus) {
    if (!matchId) return;
    const now = Date.now();
    const timestampUpdates: Record<string, number> = {};

    if (status === "first_half") timestampUpdates["timestamps.kickOff"] = now;
    if (status === "half_time") timestampUpdates["timestamps.halfTime"] = now;
    if (status === "second_half")
      timestampUpdates["timestamps.secondHalfStart"] = now;
    if (status === "full_time") timestampUpdates["timestamps.fullTime"] = now;

    await updateDoc(doc(db, "matches", matchId), {
      status,
      ...timestampUpdates,
    });
  }

  async function addPitchEvent(
    playerId: string,
    type: "on" | "off",
    coachId: string
  ) {
    await addDoc(collection(db, "pitchEvents"), {
      matchId,
      playerId,
      type,
      timestamp: Date.now(),
      recordedBy: coachId,
    });
  }

  async function addScoreEvent(
    type: "try" | "conversion",
    isOpposition: boolean,
    scorerId: string | undefined,
    coachId: string
  ) {
    if (!matchId) return;

    const points = isOpposition
      ? type === "try"
        ? 5
        : 2
      : type === "try"
        ? 5
        : 2;

    const scoreField = isOpposition ? "awayScore" : "homeScore";
    const currentMatch = match;
    if (!currentMatch) return;

    const currentScore = isOpposition
      ? currentMatch.awayScore
      : currentMatch.homeScore;

    await addDoc(collection(db, "scoreEvents"), {
      matchId,
      type,
      scorerId: scorerId || null,
      isOpposition,
      timestamp: Date.now(),
      recordedBy: coachId,
    });

    await updateDoc(doc(db, "matches", matchId), {
      [scoreField]: currentScore + points,
    });
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

export function getPlayerPitchTime(
  playerId: string,
  pitchEvents: PitchEvent[],
  match: Match | null,
  currentTime: number
): number {
  const events = pitchEvents.filter((e) => e.playerId === playerId);
  let total = 0;
  let onTime: number | null = null;

  for (const event of events) {
    if (event.type === "on") {
      onTime = event.timestamp;
    } else if (event.type === "off" && onTime !== null) {
      total += event.timestamp - onTime;
      onTime = null;
    }
  }

  // If still on pitch, count time up to now or full time
  if (onTime !== null) {
    const endTime =
      match?.status === "full_time" && match.timestamps.fullTime
        ? match.timestamps.fullTime
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
  const events = pitchEvents.filter((e) => e.playerId === playerId);
  if (events.length === 0) return false;
  return events[events.length - 1].type === "on";
}
