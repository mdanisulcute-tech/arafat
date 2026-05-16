export type User = {
  id: string;
  email: string;
  username: string;
  avatar: string;
  xp: number;
  coins: number;
  level: number;
  streak: number;
  best_tap_score: number;
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

export type TapResult = {
  taps: number;
  xp_awarded: number;
  coins_awarded: number;
  is_new_best: boolean;
  best_tap_score: number;
  user: User;
};

export type Mission = {
  id: string;
  key: string;
  title: string;
  description: string;
  goal: number;
  xp_reward: number;
  coin_reward: number;
  progress: number;
  claimed: boolean;
};

export type ChatMessage = {
  id: string;
  user_id: string;
  username: string;
  avatar: string;
  text: string;
  created_at: string;
};
