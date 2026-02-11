import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Play,
  Pause,
  Square,
  UserPlus,
  UserMinus,
  Trophy,
  Clock,
} from "lucide-react";
import {
  useLiveMatch,
  getPlayerPitchTime,
  formatDuration,
  isPlayerOnPitch,
} from "../hooks/useMatch";
import { useSquad } from "../hooks/useSquad";
import { useCoach } from "../hooks/useCoach";
import type { Player, MatchStatus } from "../types";

export default function LiveMatchPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { coach } = useCoach();
  const { players } = useSquad();
  const {
    match,
    pitchEvents,
    scoreEvents,
    loading,
    updateMatchStatus,
    addPitchEvent,
    addScoreEvent,
  } = useLiveMatch(matchId);

  const [showScoreModal, setShowScoreModal] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Tick every second to update live times
  useEffect(() => {
    if (
      match?.status === "first_half" ||
      match?.status === "second_half"
    ) {
      const interval = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(interval);
    }
  }, [match?.status]);

  if (loading || !match) {
    return (
      <div className="p-6 text-center text-gray-500">Loading match...</div>
    );
  }

  const selectedPlayers = players.filter((p) =>
    match.selectedPlayerIds.includes(p.id)
  );
  const onPitch = selectedPlayers.filter((p) =>
    isPlayerOnPitch(p.id, pitchEvents)
  );
  const offPitch = selectedPlayers.filter(
    (p) => !isPlayerOnPitch(p.id, pitchEvents)
  );

  const matchIsLive =
    match.status === "first_half" || match.status === "second_half";

  const coachId = coach?.id || "unknown";

  function getElapsedTime(): string {
    if (!match) return "00:00";
    const { timestamps, status } = match;

    if (status === "first_half" && timestamps.kickOff) {
      return formatDuration(now - timestamps.kickOff);
    }
    if (status === "half_time" && timestamps.kickOff && timestamps.halfTime) {
      return formatDuration(timestamps.halfTime - timestamps.kickOff);
    }
    if (status === "second_half" && timestamps.secondHalfStart) {
      const firstHalf =
        timestamps.halfTime && timestamps.kickOff
          ? timestamps.halfTime - timestamps.kickOff
          : 0;
      return formatDuration(
        firstHalf + (now - timestamps.secondHalfStart)
      );
    }
    if (status === "full_time") {
      const firstHalf =
        timestamps.halfTime && timestamps.kickOff
          ? timestamps.halfTime - timestamps.kickOff
          : 0;
      const secondHalf =
        timestamps.fullTime && timestamps.secondHalfStart
          ? timestamps.fullTime - timestamps.secondHalfStart
          : 0;
      return formatDuration(firstHalf + secondHalf);
    }
    return "00:00";
  }

  async function handleTogglePlayer(player: Player) {
    if (!matchIsLive) return;
    const currentlyOn = isPlayerOnPitch(player.id, pitchEvents);
    await addPitchEvent(player.id, currentlyOn ? "off" : "on", coachId);
  }

  function getNextAction(): {
    label: string;
    status: MatchStatus;
    icon: typeof Play;
  } | null {
    switch (match?.status) {
      case "not_started":
        return { label: "Kick Off", status: "first_half", icon: Play };
      case "first_half":
        return { label: "Half Time", status: "half_time", icon: Pause };
      case "half_time":
        return { label: "Start 2nd Half", status: "second_half", icon: Play };
      case "second_half":
        return { label: "Full Time", status: "full_time", icon: Square };
      default:
        return null;
    }
  }

  const nextAction = getNextAction();

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-emerald-900 text-white px-4 py-3">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate("/")} className="p-1">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <p className="text-sm opacity-80">
              {match.isHome ? "Home" : "Away"} vs
            </p>
            <p className="font-bold">{match.opposition}</p>
          </div>
          {match.weather && (
            <div className="text-right text-xs opacity-80">
              <p>{match.weather.description}</p>
              <p>{match.weather.temp}&deg;C</p>
            </div>
          )}
        </div>

        {/* Scoreboard */}
        <div className="bg-emerald-800 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-6">
            <div>
              <p className="text-xs opacity-70">Home</p>
              <p className="text-4xl font-bold">{match.homeScore}</p>
            </div>
            <div>
              <p className="text-xs opacity-70 mb-1">
                {match.status === "not_started"
                  ? "Pre-Match"
                  : match.status === "first_half"
                    ? "1st Half"
                    : match.status === "half_time"
                      ? "Half Time"
                      : match.status === "second_half"
                        ? "2nd Half"
                        : "Full Time"}
              </p>
              <p className="text-lg font-mono flex items-center gap-1 justify-center">
                <Clock size={14} />
                {getElapsedTime()}
              </p>
            </div>
            <div>
              <p className="text-xs opacity-70">Away</p>
              <p className="text-4xl font-bold">{match.awayScore}</p>
            </div>
          </div>

          <div className="flex gap-2 mt-3 justify-center">
            {nextAction && (
              <button
                onClick={() => updateMatchStatus(nextAction.status)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold ${
                  nextAction.status === "full_time"
                    ? "bg-red-600 text-white"
                    : "bg-white text-emerald-900"
                }`}
              >
                <nextAction.icon size={16} />
                {nextAction.label}
              </button>
            )}
            {matchIsLive && (
              <button
                onClick={() => setShowScoreModal(true)}
                className="flex items-center gap-1.5 bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-semibold"
              >
                <Trophy size={16} />
                Score
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Players on pitch */}
      <div className="p-4 flex-1">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            On Pitch ({onPitch.length})
          </h3>
          {onPitch.length === 0 && matchIsLive && (
            <p className="text-xs text-gray-400">
              Tap a player below to bring them on
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            {onPitch.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                isOnPitch={true}
                pitchTime={formatDuration(
                  getPlayerPitchTime(player.id, pitchEvents, match, now)
                )}
                matchIsLive={matchIsLive}
                onToggle={() => handleTogglePlayer(player)}
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Off Pitch ({offPitch.length})
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {offPitch.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                isOnPitch={false}
                pitchTime={formatDuration(
                  getPlayerPitchTime(player.id, pitchEvents, match, now)
                )}
                matchIsLive={matchIsLive}
                onToggle={() => handleTogglePlayer(player)}
              />
            ))}
          </div>
        </div>

        {/* Score events log */}
        {scoreEvents.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Match Events
            </h3>
            <div className="space-y-1">
              {scoreEvents.map((event) => {
                const scorer = players.find((p) => p.id === event.scorerId);
                const mins = match.timestamps.kickOff
                  ? Math.floor(
                      (event.timestamp - match.timestamps.kickOff) / 60000
                    )
                  : 0;
                return (
                  <div
                    key={event.id}
                    className="bg-white rounded-lg px-3 py-2 text-sm flex items-center gap-2 border border-gray-100"
                  >
                    <span className="text-xs text-gray-400 w-8">
                      {mins}&apos;
                    </span>
                    <Trophy
                      size={14}
                      className={
                        event.isOpposition
                          ? "text-red-500"
                          : "text-amber-500"
                      }
                    />
                    <span className="flex-1">
                      {event.isOpposition
                        ? "Opposition"
                        : scorer?.name || "Unknown"}{" "}
                      - {event.type === "try" ? "Try" : "Conversion"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Score modal */}
      {showScoreModal && (
        <ScoreModal
          selectedPlayers={selectedPlayers}
          onScore={async (type, isOpp, scorerId) => {
            await addScoreEvent(type, isOpp, scorerId, coachId);
            setShowScoreModal(false);
          }}
          onClose={() => setShowScoreModal(false)}
        />
      )}
    </div>
  );
}

function PlayerCard({
  player,
  isOnPitch,
  pitchTime,
  matchIsLive,
  onToggle,
}: {
  player: Player;
  isOnPitch: boolean;
  pitchTime: string;
  matchIsLive: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={!matchIsLive}
      className={`rounded-xl p-3 text-left border-2 transition-colors ${
        isOnPitch
          ? "bg-emerald-50 border-emerald-400"
          : "bg-white border-gray-200"
      } ${matchIsLive ? "active:scale-95" : "opacity-70"}`}
    >
      <div className="flex items-center gap-2 mb-1">
        {player.squadNumber && (
          <span
            className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
              isOnPitch
                ? "bg-emerald-600 text-white"
                : "bg-gray-300 text-gray-600"
            }`}
          >
            {player.squadNumber}
          </span>
        )}
        <span className="font-medium text-sm text-gray-900 truncate flex-1">
          {player.name}
        </span>
        {matchIsLive &&
          (isOnPitch ? (
            <UserMinus size={14} className="text-red-500 flex-shrink-0" />
          ) : (
            <UserPlus size={14} className="text-emerald-600 flex-shrink-0" />
          ))}
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <Clock size={10} />
        {pitchTime}
      </div>
    </button>
  );
}

function ScoreModal({
  selectedPlayers,
  onScore,
  onClose,
}: {
  selectedPlayers: Player[];
  onScore: (
    type: "try" | "conversion",
    isOpposition: boolean,
    scorerId?: string
  ) => void;
  onClose: () => void;
}) {
  const [scoreType, setScoreType] = useState<"try" | "conversion">("try");
  const [isOpposition, setIsOpposition] = useState(false);
  const [scorerId, setScorerId] = useState<string | undefined>(undefined);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <div className="bg-white rounded-t-2xl w-full p-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Record Score</h3>
          <button
            onClick={onClose}
            className="text-gray-400 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="space-y-4">
          {/* Score type */}
          <div className="flex gap-2">
            <button
              onClick={() => setScoreType("try")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border-2 ${
                scoreType === "try"
                  ? "bg-emerald-700 text-white border-emerald-700"
                  : "bg-white text-gray-600 border-gray-300"
              }`}
            >
              Try (5 pts)
            </button>
            <button
              onClick={() => setScoreType("conversion")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border-2 ${
                scoreType === "conversion"
                  ? "bg-emerald-700 text-white border-emerald-700"
                  : "bg-white text-gray-600 border-gray-300"
              }`}
            >
              Conversion (2 pts)
            </button>
          </div>

          {/* Which team */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsOpposition(false);
                setScorerId(undefined);
              }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border-2 ${
                !isOpposition
                  ? "bg-emerald-700 text-white border-emerald-700"
                  : "bg-white text-gray-600 border-gray-300"
              }`}
            >
              Our Team
            </button>
            <button
              onClick={() => {
                setIsOpposition(true);
                setScorerId(undefined);
              }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border-2 ${
                isOpposition
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-white text-gray-600 border-gray-300"
              }`}
            >
              Opposition
            </button>
          </div>

          {/* Scorer (only for our team) */}
          {!isOpposition && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Who scored?
              </p>
              <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                {selectedPlayers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setScorerId(p.id)}
                    className={`text-left px-2.5 py-1.5 rounded-lg text-sm border ${
                      scorerId === p.id
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
            </div>
          )}

          <button
            onClick={() => onScore(scoreType, isOpposition, scorerId)}
            className="w-full bg-emerald-700 text-white py-3 rounded-lg font-semibold text-base"
          >
            Record {scoreType === "try" ? "Try" : "Conversion"}
          </button>
        </div>
      </div>
    </div>
  );
}
