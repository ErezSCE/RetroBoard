const request = require('supertest');
const { app } = require('../src/server');

// Mock Prisma client used in server.js
jest.mock('../src/prismaClient', () => {
  const mockPrisma = {
    actionItem: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    // other models can be empty objects as they are not used in these tests
    participant: {},
    session: {},
    column: {},
    card: {},
    cluster: {},
    cardVote: {},
    clusterVote: {},
  };
  return mockPrisma;
});

const prisma = require('../src/prismaClient');

describe('Action Item endpoints', () => {
  const basePayload = {
    sessionId: 1,
    source_type: 'card',
    source_id: 10,
    title: 'Fix bug',
  };

  test('POST /action-items creates a new action item', async () => {
    const createdItem = {
      id: 5,
      ...basePayload,
      ownerParticipantId: null,
      due_date: null,
      status: 'open',
    };
    prisma.actionItem.create.mockResolvedValue(createdItem);

    const response = await request(app).post('/action-items').send(basePayload);
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject(createdItem);
    expect(prisma.actionItem.create).toHaveBeenCalledWith({
      data: {
        sessionId: basePayload.sessionId,
        source_type: basePayload.source_type,
        source_id: basePayload.source_id,
        title: basePayload.title,
        ownerParticipantId: null,
        due_date: null,
        status: 'open',
      },
    });
  });

  test('POST /action-items returns 400 when required fields missing', async () => {
    const response = await request(app).post('/action-items').send({});
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'sessionId, source_type, source_id, and title are required' });
  });

  test('PUT /action-items/:id updates fields', async () => {
    const id = 5;
    const updatePayload = { title: 'Updated title', status: 'closed' };
    const updatedItem = { id, ...basePayload, ...updatePayload, ownerParticipantId: null, due_date: null };
    prisma.actionItem.update.mockResolvedValue(updatedItem);

    const response = await request(app).put(`/action-items/${id}`).send(updatePayload);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject(updatedItem);
    expect(prisma.actionItem.update).toHaveBeenCalledWith({
      where: { id: Number(id) },
      data: {
        title: 'Updated title',
        status: 'closed',
      },
    });
  });

  test('DELETE /action-items/:id deletes the item', async () => {
    const id = 5;
    prisma.actionItem.delete.mockResolvedValue({});
    const response = await request(app).delete(`/action-items/${id}`);
    expect(response.status).toBe(204);
    expect(prisma.actionItem.delete).toHaveBeenCalledWith({ where: { id: Number(id) } });
  });
});
