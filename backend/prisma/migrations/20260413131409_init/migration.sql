-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "width" REAL NOT NULL,
    "height" REAL NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'mm',
    "backgroundColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "borderWidth" REAL NOT NULL DEFAULT 0,
    "borderColor" TEXT NOT NULL DEFAULT '#000000',
    "borderRadius" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TemplateElement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "variableName" TEXT NOT NULL,
    "x" REAL NOT NULL,
    "y" REAL NOT NULL,
    "width" REAL NOT NULL,
    "height" REAL NOT NULL,
    "rotation" REAL NOT NULL DEFAULT 0,
    "properties" TEXT NOT NULL,
    "zIndex" INTEGER NOT NULL,
    CONSTRAINT "TemplateElement_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Mapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "csvSample" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Mapping_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ColumnMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mappingId" TEXT NOT NULL,
    "variableName" TEXT NOT NULL,
    "columnIndex" INTEGER NOT NULL,
    "columnName" TEXT NOT NULL,
    CONSTRAINT "ColumnMapping_mappingId_fkey" FOREIGN KEY ("mappingId") REFERENCES "Mapping" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TemplateElement_templateId_idx" ON "TemplateElement"("templateId");

-- CreateIndex
CREATE INDEX "Mapping_templateId_idx" ON "Mapping"("templateId");

-- CreateIndex
CREATE INDEX "ColumnMapping_mappingId_idx" ON "ColumnMapping"("mappingId");
