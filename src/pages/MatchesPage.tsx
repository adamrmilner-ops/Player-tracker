import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, MapPin, ArrowRight } from "lucide-react";
import { useMatches } from "../hooks/useMatch";
import { useSquad } from "../hooks/useSquad";
import { useGeolocation } from "../hooks/useGeolocation";
import { useCoach } from "../hooks/useCoach";
import type { Match, MatchStatus } from "../types";
import { format } from "date-fns";

export default function MatchesPage() {
  const { matches, loading, createMatch } = useMatches();
  const { activePlayers } = useSquad();
  const { coach } = useCoach();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);

  const liveMatches = matches.filter(
    (m) => m.status !== "not_started" && m.status !== "full_time"
  );
  const upcomingMatches = matches.filter((m) => m.status === "not_started");
  const completedMatches = matches.filter((m) => m.status === "full_time");

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">Loading matches...</div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Matches</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1 bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm font-medium active:bg-emerald-800"
        >
          <Plus size={16} />
          New Match
        </button>
      </div>

      {showCreate && (
        <CreateMatchForm
          activePlayers={activePlayers}
          coachId={coach?.id || "unknown"}
          onCreate={async (matchId) => {
            setShowCreate(false);
            navigate(`/match/${matchId}`);
          }}
          onCancel={() => setShowCreate(false)}
          createMatch={createMatch}
        />
      )}

      {liveMatches.length > 0 && (
        <Section title="Live">
          {liveMatches.map((m) => (
            <MatchCard key={m.id} match={m} onClick={() => navigate(`/match/${m.id}`)} />
          ))}
        </Section>
      )}

      {upcomingMatches.length > 0 && (
        <Section title="Upcoming">
          {upcomingMatches.map((m) => (
            <MatchCard key={m.id} match={m} onClick={() => navigate(`/match/${m.id}`)} />
          ))}
        </Section>
      )}

      {completedMatches.length > 0 && (
        <Section title="Completed">
          {completedMatches.map((m) => (
            <MatchCard key={m.id} match={m} onClick={() => navigate(`/match/${m.id}`)} />
          ))}
        </Section>
      )}

      {matches.length === 0 && !showCreate && (
        <div className="text-center py-12 text-gray-400">
          <Swords size={48} className="mx-auto mb-3 opacity-50" />
          <p className="font-medium">No matches yet</p>
          <p className="text-sm">Create a new match to get started</p>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function MatchCard({ match, onClick }: { match: Match; onClick: () => void }) {
  const statusColors: Record<MatchStatus, string> = {
    not_started: "bg-gray-100 text-gray-600",
    first_half: "bg-green-100 text-green-700",
    half_time: "bg-yellow-100 text-yellow-700",
    second_half: "bg-green-100 text-green-700",
    full_time: "bg-gray-100 text-gray-600",
  };

  const statusLabels: Record<MatchStatus, string> = {
    not_started: "Not Started",
    first_half: "1st Half",
    half_time: "Half Time",
    second_half: "2nd Half",
    full_time: "Full Time",
  };

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-left active:bg-gray-50"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">
          {format(new Date(match.date), "dd MMM yyyy")}
        </span>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[match.status]}`}
        >
          {statusLabels[match.status]}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-900">
            vs {match.opposition}
          </p>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <MapPin size={12} />
            {match.venue} ({match.isHome ? "Home" : "Away"})
          </p>
        </div>
        {match.status !== "not_started" && (
          <div className="text-right">
            <p className="text-xl font-bold text-gray-900">
              {match.homeScore} - {match.awayScore}
            </p>
          </div>
        )}
        {match.status === "not_started" && (
          <ArrowRight size={20} className="text-gray-400" />
        )}
      </div>
    </button>
  );
}

function CreateMatchForm({
  activePlayers,
  coachId,
  onCreate,
  onCancel,
  createMatch,
}: {
  activePlayers: { id: string; name: string; squadNumber?: number }[];
  coachId: string;
  onCreate: (matchId: string) => void;
  onCancel: () => void;
  createMatch: (data: Omit<Match, "id">) => Promise<string>;
}) {
  const [opposition, setOpposition] = useState("");
  const [venue, setVenue] = useState("");
  const [isHome, setIsHome] = useState(true);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { location, weather, loading: geoLoading, requestLocation } = useGeolocation();

  function togglePlayer(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(activePlayers.map((p) => p.id)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!opposition.trim() || !venue.trim() || selectedIds.size === 0) return;

    const matchId = await createMatch({
      date,
      opposition: opposition.trim(),
      venue: venue.trim(),
      isHome,
      location: location || undefined,
      weather: weather || undefined,
      status: "not_started",
      timestamps: {},
      selectedPlayerIds: Array.from(selectedIds),
      homeScore: 0,
      awayScore: 0,
      createdAt: Date.now(),
      createdBy: coachId,
    });
    onCreate(matchId);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-200 space-y-3"
    >
      <h3 className="font-semibold text-gray-900">New Match</h3>

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />

      <input
        type="text"
        value={opposition}
        onChange={(e) => setOpposition(e.target.value)}
        placeholder="Opposition team *"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />

      <input
        type="text"
        value={venue}
        onChange={(e) => setVenue(e.target.value)}
        placeholder="Venue *"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsHome(true)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
            isHome
              ? "bg-emerald-700 text-white border-emerald-700"
              : "bg-white text-gray-600 border-gray-300"
          }`}
        >
          Home
        </button>
        <button
          type="button"
          onClick={() => setIsHome(false)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
            !isHome
              ? "bg-emerald-700 text-white border-emerald-700"
              : "bg-white text-gray-600 border-gray-300"
          }`}
        >
          Away
        </button>
      </div>

      <div>
        <button
          type="button"
          onClick={requestLocation}
          disabled={geoLoading}
          className="flex items-center gap-2 text-sm text-emerald-700 font-medium"
        >
          <MapPin size={16} />
          {geoLoading
            ? "Getting location..."
            : location
              ? `Location set`
              : "Add location & weather"}
        </button>
        {weather && (
          <p className="text-xs text-gray-500 mt-1">
            {weather.description}, {weather.temp}&deg;C, Wind{" "}
            {weather.windSpeed} km/h
          </p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-700">
            Select players ({selectedIds.size})
          </p>
          <button
            type="button"
            onClick={selectAll}
            className="text-xs text-emerald-700 font-medium"
          >
            Select all
          </button>
        </div>
        <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
          {activePlayers.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => togglePlayer(p.id)}
              className={`text-left px-2.5 py-1.5 rounded-lg text-sm border ${
                selectedIds.has(p.id)
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                  : "bg-white border-gray-200 text-gray-600"
              }`}
            >
              {p.squadNumber && (
                <span className="font-bold mr-1">{p.squadNumber}</span>
              )}
              {p.name}
            </button>
          ))}
        </div>
        {activePlayers.length === 0 && (
          <p className="text-xs text-red-500">
            Add players to your squad first
          </p>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={!opposition.trim() || !venue.trim() || selectedIds.size === 0}
          className="flex-1 bg-emerald-700 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-40"
        >
          Create Match
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 bg-gray-200 text-gray-700 rounded-lg py-2.5 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Swords({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
      <line x1="13" x2="19" y1="19" y2="13" />
      <line x1="16" x2="20" y1="16" y2="20" />
      <line x1="19" x2="21" y1="21" y2="19" />
      <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
      <line x1="5" x2="9" y1="14" y2="18" />
      <line x1="7" x2="4" y1="17" y2="20" />
      <line x1="3" x2="5" y1="19" y2="21" />
    </svg>
  );
}
