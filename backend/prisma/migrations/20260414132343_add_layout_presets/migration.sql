-- CreateTable
CREATE TABLE "LayoutPreset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "pageSize" TEXT NOT NULL DEFAULT 'A4',
    "orientation" TEXT NOT NULL DEFAULT 'portrait',
    "marginTop" REAL NOT NULL DEFAULT 10,
    "marginRight" REAL NOT NULL DEFAULT 10,
    "marginBottom" REAL NOT NULL DEFAULT 10,
    "marginLeft" REAL NOT NULL DEFAULT 10,
    "labelsPerRow" INTEGER NOT NULL DEFAULT 3,
    "labelsPerColumn" INTEGER NOT NULL DEFAULT 8,
    "horizontalSpacing" REAL NOT NULL DEFAULT 2,
    "verticalSpacing" REAL NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LayoutPreset_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "LayoutPreset_templateId_idx" ON "LayoutPreset"("templateId");
