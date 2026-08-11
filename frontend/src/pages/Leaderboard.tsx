import { useEffect, useState } from 'react';
import { api } from '../api';
import type { LeaderboardTeam } from '../types';
import { Link } from 'react-router-dom';

export default function Leaderboard() {
  const [teams, setTeams] = useState<LeaderboardTeam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLeaderboard()
      .then(setTeams)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Loading rankings...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Scavenger Hunt</h1>
        <div className="flex gap-4">
          <Link to="/prompts" className="text-sm font-semibold text-blue-600 hover:underline">View Prompts</Link>
          <Link to="/admin" className="text-sm text-gray-500 hover:text-blue-600">Admin</Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 font-semibold">Rank</th>
              <th className="p-4 font-semibold">Team Name</th>
              <th className="p-4 font-semibold text-center">Photos Submitted</th>
              <th className="p-4 font-semibold text-right">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {teams.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">No teams registered yet.</td>
              </tr>
            ) : (
              teams.map((team) => (
                <tr key={team.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-bold text-lg text-gray-400">#{team.rank}</td>
                  <td className="p-4">
                    <Link to={`/teams/${team.id}`} className="font-medium text-blue-600 hover:underline">
                      {team.name}
                    </Link>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded text-sm ${team.photos_submitted >= 10 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                      {team.photos_submitted} / 10
                    </span>
                  </td>
                  <td className="p-4 text-right font-bold text-xl">{team.score}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}