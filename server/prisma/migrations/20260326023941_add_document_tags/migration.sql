-- CreateTable
CREATE TABLE "document_tags" (
    "document_id" INTEGER NOT NULL,
    "university_id" INTEGER NOT NULL,

    PRIMARY KEY ("document_id", "university_id"),
    CONSTRAINT "document_tags_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "document_tags_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
