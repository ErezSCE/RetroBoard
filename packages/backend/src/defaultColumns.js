/**
 * Creates default columns for a given session.
 * This is used during session creation or seeding to ensure a new retro board
 * starts with the typical columns.
 */
const logger = require('./logger');

async function createDefaultColumns(prisma, sessionId) {

  const defaultTitles = ['Went Well', 'To Improve', 'Action Items'];
  const columnsData = defaultTitles.map((title, index) => ({
    sessionId,
    title,
    position: index,
  }));

  try {
    const result = await prisma.column.createMany({
      data: columnsData,
      skipDuplicates: true,
    });
    // Return the Prisma createMany response (e.g., count of created rows)
    return result;
  } catch (error) {
    // Log error and rethrow for upstream handling
    logger.error('Failed to create default columns', { error, sessionId });
    throw error;
  }
}

module.exports = { createDefaultColumns };
