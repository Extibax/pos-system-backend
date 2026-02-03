import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { error } from "../utils/response";

export interface AuthPayload {
  id: string;
  tenant: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers["authorization"]?.replace("Bearer ", "");

  if (!token) {
    error(res, 401, "Authentication token required");
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    req.auth = decoded;
    next();
  } catch {
    error(res, 401, "Invalid or expired token");
  }
}
