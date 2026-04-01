-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_issue_reports" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "github_issue_url" TEXT NOT NULL,
    "github_issue_number" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "issue_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_issue_reports" ("created_at", "description", "github_issue_number", "github_issue_url", "id", "title", "user_id") SELECT "created_at", "description", "github_issue_number", "github_issue_url", "id", "title", "user_id" FROM "issue_reports";
DROP TABLE "issue_reports";
ALTER TABLE "new_issue_reports" RENAME TO "issue_reports";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
