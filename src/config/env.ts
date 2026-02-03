import { z } from "zod";

const envSchema = z.object({
  MONGO_URI: z.string().url().default("mongodb://localhost:27017/pos-system"),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().default(6379),
  PORT: z.coerce.number().default(3000),
  WS_PORT: z.coerce.number().default(8081),
  JWT_SECRET: z.string().min(8).default("dev-secret-change-me"),
  JWT_EXPIRES_IN: z.string().default("2h"),
  DEFAULT_TENANT: z.string().default("default"),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
