import { SQLDatabase } from "encore.dev/storage/sqldb";

export const forceDB = new SQLDatabase("force", {
  migrations: "./migrations",
});
