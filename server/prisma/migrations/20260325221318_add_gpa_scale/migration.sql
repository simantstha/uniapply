-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_profiles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "study_level" TEXT,
    "gpa" REAL,
    "gpa_scale" TEXT NOT NULL DEFAULT 'us_4',
    "sat_score" INTEGER,
    "act_score" INTEGER,
    "gre_verbal" INTEGER,
    "gre_quant" INTEGER,
    "gre_writing" REAL,
    "toefl_score" INTEGER,
    "ielts_score" REAL,
    "undergraduate_institution" TEXT,
    "undergraduate_major" TEXT,
    "graduation_year" INTEGER,
    "work_experience_years" INTEGER,
    "field_of_study" TEXT,
    "career_goals" TEXT,
    "research_interests" TEXT,
    "extracurriculars" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_profiles" ("act_score", "career_goals", "created_at", "extracurriculars", "field_of_study", "gpa", "graduation_year", "gre_quant", "gre_verbal", "gre_writing", "id", "ielts_score", "research_interests", "sat_score", "study_level", "toefl_score", "undergraduate_institution", "undergraduate_major", "updated_at", "user_id", "work_experience_years") SELECT "act_score", "career_goals", "created_at", "extracurriculars", "field_of_study", "gpa", "graduation_year", "gre_quant", "gre_verbal", "gre_writing", "id", "ielts_score", "research_interests", "sat_score", "study_level", "toefl_score", "undergraduate_institution", "undergraduate_major", "updated_at", "user_id", "work_experience_years" FROM "profiles";
DROP TABLE "profiles";
ALTER TABLE "new_profiles" RENAME TO "profiles";
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
