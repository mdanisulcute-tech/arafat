export type User = {
  id: string;
  email: string;
  username: string;
  avatar: string;
  xp: number;
  coins: number;
  level: number;
  streak: number;
  last_login_reward_at: string | null;
  badges: string[];
  games_played: number;
  created_at: string;
};

export type AuthResponse = { token: string; user: User };

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
};

export type LeaderboardEntry = {
  rank: number;
  username: string;
  avatar: string;
  xp: number;
  level: number;
};

export type SpinResult = {
  prize_index: number;
  prize_label: string;
  coins_awarded: number;
  xp_awarded: number;
};
