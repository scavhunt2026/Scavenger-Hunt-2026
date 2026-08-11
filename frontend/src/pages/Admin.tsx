import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import type { Submission, HuntItem, Team } from '../types';

export default function Admin() {
  // --- Quick Auth Setup ---
  const [isAuthenticated, setIsAuthenticated] = useState(
    sessionStorage.getItem('adminAuth') === 'true'
  );
  const [passwordInput, setPasswordInput] = useState('');
  
  const ADMIN_PASSWORD = 'touchgrass'; 

  // --- Existing State ---
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [items, setItems] = useState<Record<number, HuntItem>>({});
  const [teams, setTeams] = useState<Record<number, Team>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch data if we are authenticated!
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuth', 'true');
    } else {
      alert('Fuck off plz stop trying to cheat');
      setPasswordInput('');
    }
  };

  // --- The Login Screen ---
  if (!isAuthenticated) {
    return (
      <div className="max-w-sm mx-auto mt-24 p-8 bg-white rounded-xl shadow-md border border-gray-200 text-center">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Game Master Only</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            placeholder="Enter password..."
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <button type="submit" className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition-colors">
            Unlock Dashboard
          </button>
        </form>
        <div className="mt-6">
          <Link to="/" className="text-sm text-gray-500 hover:text-blue-600">&larr; Back to Leaderboard</Link>
        </div>
      </div>
    );
  }

  const fetchData = async () => {
    try {
      const [subsData, itemsData, teamsData] = await Promise.all([
        api.getPendingSubmissions(),
        api.getItems(),
        api.getTeams() // Using leaderboard data to get team names
      ]);

      setSubmissions(subsData);

      const itemsDict = itemsData.reduce((acc, item) => ({ ...acc, [item.id]: item }), {});
      setItems(itemsDict);

      const teamsDict = teamsData.reduce((acc, team) => ({ ...acc, [team.id]: team }), {});
      setTeams(teamsDict);
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (submissionId: number, claimId: number, status: 'approved' | 'rejected') => {
    try {
      await api.updateClaimStatus(claimId, status);
      
      // Optimistically update the UI to remove the processed claim
      setSubmissions(prevSubs => prevSubs.map(sub => {
        if (sub.id === submissionId) {
          return {
            ...sub,
            claims: sub.claims.map(c => c.id === claimId ? { ...c, status } : c)
          };
        }
        return sub;
      }));
    } catch (err) {
      alert("Failed to update claim. Please try again.");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading queue...</div>;

  // Filter out submissions where all claims have been reviewed (no longer pending)
  const pendingSubmissions = submissions.filter(sub => 
    sub.claims.some(claim => claim.status === 'pending')
  );

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Review Queue</h1>
          <p className="text-gray-600">Pending Submissions: {pendingSubmissions.length}</p>
        </div>
        <Link to="/" className="text-blue-600 hover:underline font-medium">&larr; Back to Leaderboard</Link>
      </div>

      <div className="space-y-8">
        {pendingSubmissions.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-lg shadow border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-700">All caught up!</h2>
            <p className="text-gray-500 mt-2">No pending photos to review right now.</p>
          </div>
        ) : (
          pendingSubmissions.map(sub => {
            const teamName = teams[sub.team_id]?.name || `Team #${sub.team_id}`;
            const pendingClaims = sub.claims.filter(c => c.status === 'pending');

            if (pendingClaims.length === 0) return null; // Hide if we just approved the last one

            return (
              <div key={sub.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden flex flex-col md:flex-row">
                {/* Photo Side */}
                <div className="md:w-1/2 bg-gray-100 flex items-center justify-center p-4">
                  {sub.image_url ? (
                    <a href={sub.image_url} target="_blank" rel="noreferrer">
                      <img 
                        src={sub.image_url} 
                        alt={`Submitted by ${teamName}`} 
                        className="max-h-96 object-contain rounded shadow-sm hover:opacity-90 transition-opacity" 
                      />
                    </a>
                  ) : (
                    <span className="text-gray-400">Image Missing</span>
                  )}
                </div>

                {/* Claims Side */}
                <div className="md:w-1/2 p-6 flex flex-col">
                  <div className="mb-6 border-b pb-4">
                    <h3 className="text-lg font-bold text-gray-900">{teamName}</h3>
                    <p className="text-sm text-gray-500">Submitted at {new Date(sub.created_at).toLocaleString()}</p>
                  </div>

                  <div className="flex-grow space-y-4">
                    {pendingClaims.map(claim => {
                      const item = items[claim.item_id];
                      return (
                        <div key={claim.item_id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-semibold text-gray-900">{item ? item.name : `Item #${claim.item_id}`}</p>
                              <p className="text-sm text-gray-500">Value: <span className="font-bold text-gray-700">{item?.points} pts</span></p>
                            </div>
                          </div>
                          
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleReview(sub.id, claim.id, 'approved')}
                              className="flex-1 bg-green-100 text-green-700 hover:bg-green-200 py-2 rounded font-semibold transition-colors border border-green-300"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => handleReview(sub.id, claim.id, 'rejected')}
                              className="flex-1 bg-red-100 text-red-700 hover:bg-red-200 py-2 rounded font-semibold transition-colors border border-red-300"
                            >
                              ✕ Reject
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}