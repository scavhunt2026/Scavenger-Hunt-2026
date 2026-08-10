export type ClaimStatus = 'pending' | 'approved' | 'rejected';

export interface HuntItem {
  id: number;
  name: string;
  points: number;
  description?: string;
}

export interface SubmissionClaim {
  id: number;
  item_id: number;
  status: ClaimStatus;
}

export interface Submission {
  id: number;
  team_id: number;
  image_url: string;
  created_at: string;
  claims: SubmissionClaim[];
}

export interface Team {
  id: number;
  name: string;
  score: number;
  photo_count: number;
}

export interface LeaderboardTeam {
  rank: number;
  id: number;
  name: string;
  score: number;
  photos_submitted: number;
}

export interface TeamCreate {
  name: string;
}

export interface HuntItemCreate {
  name: string;
  points: number;
  description?: string;
}