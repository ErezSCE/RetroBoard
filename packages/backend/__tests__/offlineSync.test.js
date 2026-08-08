const request = require('supertest');

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mCard = { create: jest.fn() };
  const PrismaClient = jest.fn(() => ({
    card: mCard,
  }));
  return { PrismaClient };
});

const { PrismaClient } = require('@prisma/client');
const prismaMock = new PrismaClient();

// Mock implementation for create
prismaMock.card.create.mockImplementation((data) => {
  // Return the data with a fake id
  return { id: 123, ...data.data };
});

// Require server after mocking
const app = require('../src/server');

describe('POST /offline/sync', () => {
  test('returns 400 when actions array missing', async () => {
    const response = await request(app).post('/offline/sync').send({});
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('processes valid createCard action', async () => {
    const actions = [
      {
        type: 'createCard',
        payload: {
          sessionId: 1,
          columnId: 2,
          content: 'Test card',
          author_name: 'Alice',
          position: 0,
        },
      },
    ];
    const response = await request(app).post('/offline/sync').send({ actions });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('results');
    const result = response.body.results[0];
    expect(result.status).toBe('success');
    expect(result.result).toMatchObject({
      id: 123,
      sessionId: 1,
      columnId: 2,
      content: 'Test card',
      author_name: 'Alice',
      position: 0,
    });
  });

  test('ignores unsupported action type', async () => {
    const actions = [{ type: 'unknown', payload: {} }];
    const response = await request(app).post('/offline/sync').send({ actions });
    expect(response.status).toBe(200);
    const result = response.body.results[0];
    expect(result.status).toBe('ignored');
    expect(result.reason).toBe('Unsupported action type');
  });

  test('returns 400 for malformed createCard action', async () => {
    const actions = [
      {
        type: 'createCard',
        payload: {
          // missing columnId and wrong type for sessionId
          sessionId: 'not-a-number',
          content: 'Bad card',
          author_name: 'Bob',
          position: 0,
        },
      },
    ];
    const response = await request(app).post('/offline/sync').send({ actions });
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Invalid createCard payload');
  });
});
