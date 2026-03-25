-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "act_score" INTEGER;
ALTER TABLE "profiles" ADD COLUMN "sat_score" INTEGER;
ALTER TABLE "profiles" ADD COLUMN "study_level" TEXT;

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
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "universities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_universities" ("application_deadline", "category", "created_at", "id", "name", "notes", "program", "status", "updated_at", "user_id", "website_url") SELECT "application_deadline", "category", "created_at", "id", "name", "notes", "program", "status", "updated_at", "user_id", "website_url" FROM "universities";
DROP TABLE "universities";
ALTER TABLE "new_universities" RENAME TO "universities";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
