const request = require('supertest');
const { app } = require('../src/server');

// Mock the Prisma client used in server.js
jest.mock('../src/prismaClient', () => {
  const mockPrisma = {
    participant: {
      findUnique: jest.fn(),
    },
    session: {
      findUnique: jest.fn(),
    },
    cardVote: {
      aggregate: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    clusterVote: {
      aggregate: jest.fn(),
    },
  };
  return mockPrisma;
});

const prisma = require('../src/prismaClient');

describe('POST /votes endpoint', () => {
  const participantId = 1;
  const sessionId = 10;
  const cardId = 100;

  beforeEach(() => {
    jest.clearAllMocks();
    // Default participant belongs to session
    prisma.participant.findUnique.mockResolvedValue({ sessionId });
    // Session without explicit vote_budget (defaults to 5)
    prisma.session.findUnique.mockResolvedValue({});
    // No prior votes
    prisma.cardVote.aggregate.mockResolvedValue({ _sum: { vote_count: 0 } });
    prisma.clusterVote.aggregate.mockResolvedValue({ _sum: { vote_count: 0 } });
    prisma.cardVote.findFirst.mockResolvedValue(null);
  });

  test('creates a new card vote when within budget', async () => {
    prisma.cardVote.create.mockResolvedValue({
      id: 1,
      participantId,
      cardId,
      vote_count: 2,
    });

    const response = await request(app)
      .post('/votes')
      .send({ participantId, sessionId, targetType: 'card', targetId: cardId, voteCount: 2 });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ participantId, cardId, vote_count: 2 });
    expect(prisma.cardVote.create).toHaveBeenCalledWith({
      data: { participantId, cardId, vote_count: 2 },
    });
  });

  test('rejects vote when budget exceeded', async () => {
    // Simulate participant already used 4 votes
    prisma.cardVote.aggregate.mockResolvedValue({ _sum: { vote_count: 4 } });
    // Attempt to add 2 more votes (budget 5)
    const response = await request(app)
      .post('/votes')
      .send({ participantId, sessionId, targetType: 'card', targetId: cardId, voteCount: 2 });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Vote budget exceeded' });
    expect(prisma.cardVote.create).not.toHaveBeenCalled();
  });
});
