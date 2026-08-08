/**
 * Minimal stub Prisma client used for unit tests.
 * The real application would import the generated Prisma client,
 * but the test environment does not have a database connection.
 * Providing a lightweight mock satisfies the import in server.js
 * without affecting production code.
 */

// Mock implementations return simple resolved promises.
const prisma = {
  column: {
    create: async ({ data }) => ({ id: Date.now(), ...data }),
    findMany: async (args) => [],
    update: async ({ where, data }) => ({ id: where.id, ...data }),
    // delete is not used in tests that import this stub
  },
  card: {
    count: async (args) => 0,
  },
  // Add other models as needed for future tests.
};

module.exports = prisma;
