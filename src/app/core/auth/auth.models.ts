export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    monthlyContribution: number | null;
  };
}

export interface BackerVerifyResponse {
  isBacker: boolean;
  isPaidThisMonth: boolean;
}
