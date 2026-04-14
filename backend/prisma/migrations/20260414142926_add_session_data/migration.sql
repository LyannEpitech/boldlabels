-- CreateTable
CREATE TABLE "SessionData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "csvHeaders" TEXT,
    "csvRows" TEXT,
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
    "selectedMappingId" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SessionData_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SessionData_templateId_idx" ON "SessionData"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionData_templateId_key" ON "SessionData"("templateId");
