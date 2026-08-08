let prisma;
try {
  const { PrismaClient } = require('@prisma/client');
  // Export a singleton Prisma client instance for the application.
  // In tests, this module can be mocked to stub database interactions.
  prisma = new PrismaClient();
} catch (e) {
  // Prisma client generation may not have run in the test environment.
  // Provide a minimal mock to satisfy imports without performing DB operations.
  prisma = {};
}
module.exports = prisma;
