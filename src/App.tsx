import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useCoach } from "./hooks/useCoach";
import Layout from "./components/Layout";
import CoachSetup from "./components/CoachSetup";
import MatchesPage from "./pages/MatchesPage";
import SquadPage from "./pages/SquadPage";
import LiveMatchPage from "./pages/LiveMatchPage";
import HistoryPage from "./pages/HistoryPage";
import StatsPage from "./pages/StatsPage";

export default function App() {
  const { coach, registerCoach } = useCoach();

  if (!coach) {
    return <CoachSetup onRegister={registerCoach} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<MatchesPage />} />
          <Route path="/squad" element={<SquadPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/stats" element={<StatsPage />} />
        </Route>
        <Route path="/match/:matchId" element={<LiveMatchPage />} />
      </Routes>
    </BrowserRouter>
  );
}
