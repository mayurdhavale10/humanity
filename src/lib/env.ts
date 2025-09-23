import { z } from "zod";
const Env = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(10),
  NEXTAUTH_URL: z.string().optional(),
});
Env.parse(process.env);
