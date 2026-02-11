import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { Player } from "../types";

export function useSquad() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "players"), orderBy("name"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Player[];
      setPlayers(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  async function addPlayer(
    name: string,
    position?: string,
    squadNumber?: number
  ) {
    await addDoc(collection(db, "players"), {
      name,
      position: position || null,
      squadNumber: squadNumber || null,
      active: true,
      createdAt: Date.now(),
    });
  }

  async function updatePlayer(id: string, updates: Partial<Player>) {
    await updateDoc(doc(db, "players", id), updates);
  }

  const activePlayers = players.filter((p) => p.active);

  return { players, activePlayers, loading, addPlayer, updatePlayer };
}
