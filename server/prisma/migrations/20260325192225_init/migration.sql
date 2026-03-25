-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "plan_expires_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "gpa" REAL,
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

-- CreateTable
CREATE TABLE "universities" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "website_url" TEXT,
    "category" TEXT NOT NULL,
    "application_deadline" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "universities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sops" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "university_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "word_count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "sops_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sops_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sop_critiques" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sop_id" INTEGER NOT NULL,
    "overall_assessment" TEXT,
    "authenticity_score" INTEGER,
    "specificity_score" INTEGER,
    "clarity_score" INTEGER,
    "impact_score" INTEGER,
    "strengths" TEXT,
    "weaknesses" TEXT,
    "suggestions" TEXT,
    "raw_critique_text" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sop_critiques_sop_id_fkey" FOREIGN KEY ("sop_id") REFERENCES "sops" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");
