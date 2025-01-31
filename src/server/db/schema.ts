import { createId as cuid } from "@paralleldrive/cuid2"
import { sql } from "drizzle-orm"
import { index, int, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const rateLimitsTable = sqliteTable(
  "rate_limits",
  {
    ip: text("ip").primaryKey(),
    count: integer("count").notNull(),
    lastAccess: integer("last_access").notNull(),
  },
  (rateLimitsTable) => ({ ipIndex: index("ip_idx").on(rateLimitsTable.ip) }),
)

export const searchHistoryTable = sqliteTable(
  "search_history",
  {
    id: text("id", { mode: "text" }).primaryKey().$default(cuid),
    userId: text("user_id", { length: 36 }).notNull(),
    query: text("query").notNull(),
    videoTitle: text("video_title").notNull(),
    videoUrl: text("video_url").notNull(),

    createdAt: int("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: int("updated_at", { mode: "timestamp" }).$onUpdate(
      () => new Date(),
    ),
  },
  // (table) => ({ nameIndex: index("name_idx").on(table.name) })
)
