import { useState } from "react";
import { Plus, UserX, UserCheck, Edit2, Check, X } from "lucide-react";
import { useSquad } from "../hooks/useSquad";

export default function SquadPage() {
  const { players, loading, addPlayer, updatePlayer } = useSquad();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [squadNumber, setSquadNumber] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [editNumber, setEditNumber] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await addPlayer(
      name.trim(),
      position.trim() || undefined,
      squadNumber ? parseInt(squadNumber) : undefined
    );
    setName("");
    setPosition("");
    setSquadNumber("");
    setShowAdd(false);
  }

  function startEdit(player: { id: string; name: string; position?: string; squadNumber?: number }) {
    setEditingId(player.id);
    setEditName(player.name);
    setEditPosition(player.position || "");
    setEditNumber(player.squadNumber?.toString() || "");
  }

  async function saveEdit() {
    if (!editingId || !editName.trim()) return;
    await updatePlayer(editingId, {
      name: editName.trim(),
      position: editPosition.trim() || undefined,
      squadNumber: editNumber ? parseInt(editNumber) : undefined,
    });
    setEditingId(null);
  }

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">Loading squad...</div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">
          Squad ({players.length})
        </h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1 bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm font-medium active:bg-emerald-800"
        >
          <Plus size={16} />
          Add Player
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-200"
        >
          <div className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Player name *"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Position"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="number"
                value={squadNumber}
                onChange={(e) => setSquadNumber(e.target.value)}
                placeholder="#"
                className="w-16 border border-gray-300 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!name.trim()}
                className="flex-1 bg-emerald-700 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-40"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-4 bg-gray-200 text-gray-700 rounded-lg py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {players.map((player) => (
          <div
            key={player.id}
            className={`bg-white rounded-xl p-3 shadow-sm border border-gray-200 flex items-center gap-3 ${
              !player.active ? "opacity-50" : ""
            }`}
          >
            {editingId === player.id ? (
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editPosition}
                    onChange={(e) => setEditPosition(e.target.value)}
                    placeholder="Position"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="number"
                    value={editNumber}
                    onChange={(e) => setEditNumber(e.target.value)}
                    placeholder="#"
                    className="w-16 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={saveEdit}
                    className="flex items-center gap-1 bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs"
                  >
                    <Check size={14} /> Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex items-center gap-1 bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs"
                  >
                    <X size={14} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {player.squadNumber && (
                  <span className="bg-emerald-100 text-emerald-800 font-bold text-sm w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    {player.squadNumber}
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
                <button
                  onClick={() => startEdit(player)}
                  className="p-2 text-gray-400 active:text-gray-600"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() =>
                    updatePlayer(player.id, { active: !player.active })
                  }
                  className="p-2 text-gray-400 active:text-gray-600"
                >
                  {player.active ? (
                    <UserX size={16} />
                  ) : (
                    <UserCheck size={16} />
                  )}
                </button>
              </>
            )}
          </div>
        ))}

        {players.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Users size={48} className="mx-auto mb-3 opacity-50" />
            <p className="font-medium">No players yet</p>
            <p className="text-sm">Add your squad members to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Users(props: { size: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size}
      height={props.size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
