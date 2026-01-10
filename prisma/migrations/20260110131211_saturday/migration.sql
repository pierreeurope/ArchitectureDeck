-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "is_template" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "projects_is_template_idx" ON "projects"("is_template");
