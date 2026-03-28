-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_universities" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "degree_level" TEXT NOT NULL DEFAULT 'masters',
    "website_url" TEXT,
    "category" TEXT NOT NULL,
    "application_deadline" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "notes" TEXT,
    "funding_type" TEXT NOT NULL DEFAULT 'unknown',
    "application_status" TEXT NOT NULL DEFAULT 'not_applied',
    "application_portal_url" TEXT,
    "application_portal_type" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "reminder_30_sent_at" DATETIME,
    "reminder_14_sent_at" DATETIME,
    "reminder_7_sent_at" DATETIME,
    CONSTRAINT "universities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_universities" ("application_deadline", "category", "created_at", "degree_level", "funding_type", "id", "name", "notes", "program", "reminder_14_sent_at", "reminder_30_sent_at", "reminder_7_sent_at", "status", "updated_at", "user_id", "website_url") SELECT "application_deadline", "category", "created_at", "degree_level", "funding_type", "id", "name", "notes", "program", "reminder_14_sent_at", "reminder_30_sent_at", "reminder_7_sent_at", "status", "updated_at", "user_id", "website_url" FROM "universities";
DROP TABLE "universities";
ALTER TABLE "new_universities" RENAME TO "universities";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
