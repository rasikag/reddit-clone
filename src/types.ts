import { Request, Response } from "express";
import { Session, SessionData } from "express-session";
import { Redis } from "ioredis";

export type RedditDbContext = {
  req: Request & {
    session: Session & Partial<SessionData> & { userId: number };
  };
  redis: Redis
  res: Response;
};
