import { useNavigate } from "react-router-dom";
import { MapPin, CloudSun, Trophy } from "lucide-react";
import { useMatches } from "../hooks/useMatch";
import { format } from "date-fns";

export default function HistoryPage() {
  const { matches, loading } = useMatches();
  const navigate = useNavigate();

  const completedMatches = matches.filter((m) => m.status === "full_time");

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">Loading history...</div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Match History</h2>

      {completedMatches.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Trophy size={48} className="mx-auto mb-3 opacity-50" />
          <p className="font-medium">No completed matches</p>
          <p className="text-sm">
            Completed matches will appear here
          </p>
        </div>
      )}

      <div className="space-y-3">
        {completedMatches.map((match) => {
          const result =
            match.home_score > match.away_score
              ? "W"
              : match.home_score < match.away_score
                ? "L"
                : "D";
          const resultColor =
            result === "W"
              ? "bg-green-100 text-green-700"
              : result === "L"
                ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-700";

          const toMs = (iso: string | null) =>
            iso ? new Date(iso).getTime() : 0;

          const totalTime =
            (match.half_time_at && match.kick_off_at
              ? toMs(match.half_time_at) - toMs(match.kick_off_at)
              : 0) +
            (match.full_time_at && match.second_half_start_at
              ? toMs(match.full_time_at) - toMs(match.second_half_start_at)
              : 0);
          const totalMins = Math.floor(totalTime / 60000);

          return (
            <button
              key={match.id}
              onClick={() => navigate(`/match/${match.id}`)}
              className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-left active:bg-gray-50"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">
                  {format(new Date(match.date), "dd MMM yyyy")}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${resultColor}`}
                >
                  {result}
                </span>
              </div>

              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-gray-900">
                  vs {match.opposition}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {match.home_score} - {match.away_score}
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {match.venue} ({match.is_home ? "H" : "A"})
                </span>
                {match.weather_description && (
                  <span className="flex items-center gap-1">
                    <CloudSun size={12} />
                    {match.weather_description}
                    {match.weather_temp !== null && <>, {match.weather_temp}&deg;C</>}
                  </span>
                )}
                {totalMins > 0 && (
                  <span>{totalMins} mins played</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
