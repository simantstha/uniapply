-- CreateTable
CREATE TABLE "sop_share_links" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sop_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sop_share_links_sop_id_fkey" FOREIGN KEY ("sop_id") REFERENCES "sops" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sop_review_comments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "share_link_id" INTEGER NOT NULL,
    "reviewer_name" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sop_review_comments_share_link_id_fkey" FOREIGN KEY ("share_link_id") REFERENCES "sop_share_links" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "sop_share_links_token_key" ON "sop_share_links"("token");
