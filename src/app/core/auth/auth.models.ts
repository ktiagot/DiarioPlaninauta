export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    monthlyContribution: number | null;
    isAdmin: boolean;
    nome?: string;
    nick?: string;
  };
}

export interface BackerVerifyResponse {
  isBacker: boolean;
  isPaidThisMonth: boolean;
  thisMonthPaidValue: number | null;
}
