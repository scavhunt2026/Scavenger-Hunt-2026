import type { LeaderboardTeam, Team, Submission, HuntItem, TeamCreate } from './types';

// Fallback to localhost if the env var isn't found
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const api = {
  getLeaderboard: async (): Promise<LeaderboardTeam[]> => {
    const res = await fetch(`${API_BASE}/leaderboard`);
    return res.json();
  },
  
  createTeam: async (data: TeamCreate): Promise<Team> => {
    const res = await fetch(`${API_BASE}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create team');
    return res.json();
  },

  getTeam: async (id: number): Promise<Team> => {
    const res = await fetch(`${API_BASE}/teams/${id}`);
    return res.json();
  },

  getPendingSubmissions: async (): Promise<Submission[]> => {
    const res = await fetch(`${API_BASE}/admin/submissions/pending`);
    return res.json();
  },

  getTeamSubmissions: async (teamId: number): Promise<Submission[]> => {
    const res = await fetch(`${API_BASE}/teams/${teamId}/submissions`);
    if (!res.ok) throw new Error('Failed to fetch submissions');
    return res.json();
  },
  
  // Also, we'll need to fetch the hunt items so we can translate item_id to actual names
  getItems: async (): Promise<HuntItem[]> => {
    const res = await fetch(`${API_BASE}/items`);
    if (!res.ok) throw new Error('Failed to fetch items');
    return res.json();
  },
  createSubmission: async (teamId: number, imageUrl: string, claimedItemIds: number[]): Promise<Submission> => {
    const res = await fetch(`${API_BASE}/teams/${teamId}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        claimed_item_ids: claimedItemIds
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to submit photo');
    }
    return res.json();
  },
  updateClaimStatus: async (claimId: number, status: 'approved' | 'rejected'): Promise<void> => {
    // FastAPI reads standard arguments as query parameters unless specified as body
    const res = await fetch(`${API_BASE}/admin/claims/${claimId}?status=${status}`, {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error('Failed to update claim status');
  },
  
  // A quick helper to get all teams so we can map team_id to team names in the admin view
  getTeams: async (): Promise<Team[]> => {
    const res = await fetch(`${API_BASE}/leaderboard`);
    return res.json();
  }
  
};