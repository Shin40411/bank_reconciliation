/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `Client` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Client_phone_key" ON "Client"("phone");
