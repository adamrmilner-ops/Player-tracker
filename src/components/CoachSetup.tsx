import { useState } from "react";
import { UserCircle } from "lucide-react";

interface Props {
  onRegister: (name: string) => void;
}

export default function CoachSetup({ onRegister }: Props) {
  const [name, setName] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onRegister(trimmed);
  }

  return (
    <div className="flex items-center justify-center min-h-dvh bg-emerald-900 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-emerald-100 rounded-full p-4 mb-4">
            <UserCircle size={48} className="text-emerald-700" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            Rugby Pitch Tracker
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Enter your name to get started
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Coach name"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-4"
            autoFocus
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full bg-emerald-700 text-white rounded-lg py-3 font-semibold text-base disabled:opacity-40 active:bg-emerald-800"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
