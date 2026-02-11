import { NavLink, Outlet } from "react-router-dom";
import { Users, Swords, ClipboardList, BarChart3 } from "lucide-react";

const navItems = [
  { to: "/", icon: Swords, label: "Matches" },
  { to: "/squad", icon: Users, label: "Squad" },
  { to: "/history", icon: ClipboardList, label: "History" },
  { to: "/stats", icon: BarChart3, label: "Stats" },
];

export default function Layout() {
  return (
    <div className="flex flex-col min-h-dvh bg-gray-50">
      <header className="bg-emerald-900 text-white px-4 py-3 shadow-md">
        <h1 className="text-lg font-bold tracking-tight">
          Rugby Pitch Tracker
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-around">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center py-2 px-3 text-xs ${
                  isActive
                    ? "text-emerald-700 font-semibold"
                    : "text-gray-500"
                }`
              }
            >
              <Icon size={20} />
              <span className="mt-0.5">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
