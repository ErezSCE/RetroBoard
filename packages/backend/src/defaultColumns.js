/**
 * Creates default columns for a given session.
 * This is used during session creation or seeding to ensure a new retro board
 * starts with the typical columns.
 */
async function createDefaultColumns(prisma, sessionId) {
  const logger = require('./logger');
  const defaultTitles = ['Went Well', 'To Improve', 'Action Items'];
  const columnsData = defaultTitles.map((title, index) => ({
    sessionId,
    title,
    position: index,
  }));
  // Use createMany for efficiency; Prisma supports it for PostgreSQL.
  try {
    await prisma.column.createMany({
      data: columnsData,
      skipDuplicates: true,
    });
  } catch (error) {
    // Propagate the error after logging for visibility
    const logger = require('./logger');
    logger.error('Failed to create default columns', { error, sessionId });
    throw error;
  }
}

module.exports = { createDefaultColumns };
