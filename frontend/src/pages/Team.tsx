import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import type { Team as TeamType, Submission, HuntItem } from '../types';

export default function Team() {
  const { teamId } = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<TeamType | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [items, setItems] = useState<Record<number, HuntItem>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) return;

    Promise.all([
      api.getTeam(Number(teamId)),
      api.getTeamSubmissions(Number(teamId)),
      api.getItems()
    ])
      .then(([teamData, submissionsData, itemsData]) => {
        setTeam(teamData);
        setSubmissions(submissionsData);
        
        // Convert items array to a dictionary for easy O(1) lookups
        const itemsDict = itemsData.reduce((acc, item) => {
          acc[item.id] = item;
          return acc;
        }, {} as Record<number, HuntItem>);
        setItems(itemsDict);
      })
      .finally(() => setLoading(false));
  }, [teamId]);

  if (loading) return <div className="p-8 text-center">Loading team details...</div>;
  if (!team) return <div className="p-8 text-center text-red-600">Team not found!</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Link to="/" className="text-blue-600 hover:underline">&larr; Back to Leaderboard</Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{team.name}</h1>
          <p className="text-gray-600 mt-1">
            Score: <span className="font-bold text-xl text-gray-900">{team.score}</span> | 
            Photos: <span className="font-bold">{team.photo_count}</span> / 10
          </p>
        </div>
        
        {team.photo_count < 10 ? (
          <Link 
            to={`/teams/${team.id}/submit`}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            + Submit Photo
          </Link>
        ) : (
          <div className="bg-gray-200 text-gray-600 px-6 py-2 rounded-lg font-semibold">
            Max Submissions Reached
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {submissions.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-white rounded-lg shadow text-gray-500">
            No photos submitted yet. Time to get hunting!
          </div>
        ) : (
          submissions.map((sub) => (
            <div key={sub.id} className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
              {/* Image Placeholder or actual URL */}
              <div className="bg-gray-200 h-64 w-full flex items-center justify-center overflow-hidden">
                {sub.image_url ? (
                  <img src={sub.image_url} alt="Submission" className="object-cover w-full h-full" />
                ) : (
                  <span className="text-gray-400">Image Missing</span>
                )}
              </div>
              
              <div className="p-4 flex-grow">
                <h3 className="font-semibold text-lg border-b pb-2 mb-3">Claimed Items</h3>
                <ul className="space-y-2">
                  {sub.claims.map(claim => {
                    const item = items[claim.item_id];
                    return (
                      <li key={claim.item_id} className="flex justify-between items-center text-sm">
                        <span>{item ? item.name : `Item #${claim.item_id}`} ({item?.points} pts)</span>
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                          ${claim.status === 'approved' ? 'bg-green-100 text-green-800' : 
                            claim.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'}`}
                        >
                          {claim.status}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}