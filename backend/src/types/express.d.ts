declare namespace Express {
  interface Request {
    user?: {
      userId: string;
      username: string;
      email: string;
      role: string;
    };
  }
}
