import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/main/database/schema/index.ts',
  out: './src/main/database/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './moshi.db'
  }
});
