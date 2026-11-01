import { jsonb, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Application save records. Row-level security policies are defined in the
 * SQL migration because they depend on Supabase auth.uid().
 */
export const gameSaves = pgTable("game_saves", {
  userId: uuid("user_id").primaryKey(),
  data: jsonb("data").$type<Record<string, string>>().notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
