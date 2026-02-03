import { Response } from "express";

interface ApiResponse<T = unknown> {
  data: T;
  code: number;
  message: string;
}

export function success<T>(res: Response, data: T, message = "OK"): void {
  const response: ApiResponse<T> = { data, code: 200, message };
  res.status(200).json(response);
}

export function created<T>(res: Response, data: T, message = "Created"): void {
  const response: ApiResponse<T> = { data, code: 201, message };
  res.status(201).json(response);
}

export function error(res: Response, code: number, message: string): void {
  const response: ApiResponse<null> = { data: null, code, message };
  res.status(code).json(response);
}
