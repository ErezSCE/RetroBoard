/**
 * Creates default columns for a given session.
 * This is used during session creation or seeding to ensure a new retro board
 * starts with the typical columns.
 */
async function createDefaultColumns(prisma, sessionId) {
  const defaultTitles = ['Went Well', 'To Improve', 'Action Items'];
  const columnsData = defaultTitles.map((title, index) => ({
    sessionId,
    title,
    position: index,
  }));
  // Use createMany for efficiency; Prisma supports it for PostgreSQL.
  await prisma.column.createMany({
    data: columnsData,
    skipDuplicates: true,
  });
}

module.exports = { createDefaultColumns };
