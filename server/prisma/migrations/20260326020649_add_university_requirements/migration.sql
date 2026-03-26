-- CreateTable
CREATE TABLE "university_requirements" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "university_name" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "matched_program" TEXT,
    "requirements_json" TEXT NOT NULL,
    "source_url" TEXT,
    "source_type" TEXT NOT NULL DEFAULT 'ai_knowledge',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "university_requirements_university_name_program_key" ON "university_requirements"("university_name", "program");
