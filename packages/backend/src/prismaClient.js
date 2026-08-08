const { PrismaClient } = require('@prisma/client');

// Export a singleton Prisma client instance for the application.
// In tests, this module can be mocked to stub database interactions.
module.exports = new PrismaClient();
