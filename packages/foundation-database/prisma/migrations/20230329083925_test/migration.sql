/*
  Warnings:

  - Added the required column `booleanField` to the `tableName` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_tableName" (
    "stringField" TEXT NOT NULL DEFAULT '',
    "stringWithDefaultValueField" TEXT NOT NULL DEFAULT 'default value',
    "integerField" INTEGER NOT NULL,
    "integerWithDefaultValueField" INTEGER NOT NULL DEFAULT 10,
    "datetimeField" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "datetimeWithDefaultValueField" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "booleanField" BOOLEAN NOT NULL,
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_tableName" ("created_at", "datetimeField", "deleted_at", "id", "integerField", "integerWithDefaultValueField", "stringField", "stringWithDefaultValueField", "updated_at") SELECT "created_at", "datetimeField", "deleted_at", "id", "integerField", "integerWithDefaultValueField", "stringField", "stringWithDefaultValueField", "updated_at" FROM "tableName";
DROP TABLE "tableName";
ALTER TABLE "new_tableName" RENAME TO "tableName";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;