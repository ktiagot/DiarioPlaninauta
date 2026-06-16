import { config } from 'dotenv';
import { resolve } from 'path';
import { defineConfig } from 'prisma/config';

config({ path: resolve(__dirname, '.env') });

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!,
  },
  schema: './prisma/schema.prisma',
});
