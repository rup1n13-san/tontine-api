import request from 'supertest';
import { sequelize } from '../src/config/database.js';
import app from '../src/index.js';
import { Participant, Payment, Tontine, User } from '../src/models/index.js';

let authToken;
let userId;
let secondUserToken;
let secondUserId;
let tontineId;

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await Payment.destroy({ where: {}, force: true });
  await Participant.destroy({ where: {}, force: true });
  await Tontine.destroy({ where: {}, force: true });
  await User.destroy({ where: {}, force: true });

  const user1Response = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'test1@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User1'
    });

  authToken = user1Response.body.token;
  userId = user1Response.body.user.id;

  const user2Response = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'test2@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User2'
    });

  secondUserToken = user2Response.body.token;
  secondUserId = user2Response.body.user.id;
});

describe('Tontine CRUD Operations', () => {

  test('1. Should create tontine successfully', async () => {
    const response = await request(app)
      .post('/api/tontines')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Tontine',
        amount: 50000,
        frequency: 30,
        startDate: '2025-02-01'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.name).toBe('Test Tontine');
    expect(response.body.data.currentRound).toBe(1);
    expect(response.body.data.status).toBe('pending');
    expect(response.body.data.frequency).toBe(30);

    tontineId = response.body.data.id;
  });

  test('2. Should auto-add creator as participant position 1', async () => {
    const createResponse = await request(app)
      .post('/api/tontines')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Auto Participant Test',
        amount: 25000,
        frequency: 7,
        startDate: '2025-03-01'
      });

    const tontine = await Tontine.findByPk(createResponse.body.data.id);

    const participant = await Participant.findOne({
      where: {
        tontineId: tontine.id,
        userId: userId
      }
    });

    expect(participant).not.toBeNull();
    expect(participant.position).toBe(1);
    expect(participant.hasReceived).toBe(false);
  });

  test('3. Should fail to create tontine with invalid data', async () => {
    const response = await request(app)
      .post('/api/tontines')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'AB',
        amount: -100,
        frequency: 0,
        startDate: '2020-01-01'
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test('4. Should list tontines for authenticated user', async () => {
    await request(app)
      .post('/api/tontines')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'List Test Tontine',
        amount: 30000,
        frequency: 14,
        startDate: '2025-04-01'
      });

    const response = await request(app)
      .get('/api/tontines')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  test('5. Should get tontine details with participants', async () => {
    const createResponse = await request(app)
      .post('/api/tontines')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Details Test',
        amount: 40000,
        frequency: 21,
        startDate: '2025-05-01'
      });

    const tontineId = createResponse.body.data.id;

    const response = await request(app)
      .get(`/api/tontines/${tontineId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('Participants');
    expect(response.body.data.Participants.length).toBe(1);
    expect(response.body.data.participantCount).toBe(1);
  });

  test('6. Should join tontine successfully', async () => {
    const createResponse = await request(app)
      .post('/api/tontines')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Join Test',
        amount: 35000,
        frequency: 10,
        startDate: '2025-06-01'
      });

    const tontineId = createResponse.body.data.id;

    const response = await request(app)
      .post(`/api/tontines/${tontineId}/join`)
      .set('Authorization', `Bearer ${secondUserToken}`);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.position).toBe(2);
  });

  test('7. Should not join same tontine twice', async () => {
    const createResponse = await request(app)
      .post('/api/tontines')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Duplicate Join Test',
        amount: 20000,
        frequency: 15,
        startDate: '2025-07-01'
      });

    const tontineId = createResponse.body.data.id;

    await request(app)
      .post(`/api/tontines/${tontineId}/join`)
      .set('Authorization', `Bearer ${secondUserToken}`);

    const response = await request(app)
      .post(`/api/tontines/${tontineId}/join`)
      .set('Authorization', `Bearer ${secondUserToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Already a participant');
  });

  test('8. Should make payment successfully', async () => {
    const createResponse = await request(app)
      .post('/api/tontines')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Payment Test',
        amount: 45000,
        frequency: 20,
        startDate: '2025-08-01'
      });

    const tontineId = createResponse.body.data.id;

    const response = await request(app)
      .post(`/api/tontines/${tontineId}/pay`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ amount: 45000 });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.roundNumber).toBe(1);
  });

  test('9. Should not allow non-participant to make payment', async () => {
    const createResponse = await request(app)
      .post('/api/tontines')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Non-Participant Test',
        amount: 25000,
        frequency: 12,
        startDate: '2025-09-01'
      });

    const tontineId = createResponse.body.data.id;

    const response = await request(app)
      .post(`/api/tontines/${tontineId}/pay`)
      .set('Authorization', `Bearer ${secondUserToken}`)
      .send({ amount: 25000 });

    expect(response.status).toBe(403);
    expect(response.body.message).toContain('not a participant');
  });

  test('10. Should not allow payment with wrong amount', async () => {
    const createResponse = await request(app)
      .post('/api/tontines')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Wrong Amount Test',
        amount: 50000,
        frequency: 25,
        startDate: '2025-10-01'
      });

    const tontineId = createResponse.body.data.id;

    const response = await request(app)
      .post(`/api/tontines/${tontineId}/pay`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ amount: 10000 });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('must be');
  });

  test('11. Should not allow duplicate payment in same round', async () => {
    const createResponse = await request(app)
      .post('/api/tontines')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Duplicate Payment Test',
        amount: 30000,
        frequency: 18,
        startDate: '2025-11-01'
      });

    const tontineId = createResponse.body.data.id;

    await request(app)
      .post(`/api/tontines/${tontineId}/pay`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ amount: 30000 });

    const response = await request(app)
      .post(`/api/tontines/${tontineId}/pay`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ amount: 30000 });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('already paid');
  });

  test('12. Should advance to next round when all paid', async () => {
    const createResponse = await request(app)
      .post('/api/tontines')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Round Advance Test',
        amount: 40000,
        frequency: 22,
        startDate: '2025-12-01'
      });

    const tontineId = createResponse.body.data.id;

    await request(app)
      .post(`/api/tontines/${tontineId}/join`)
      .set('Authorization', `Bearer ${secondUserToken}`);

    await request(app)
      .post(`/api/tontines/${tontineId}/pay`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ amount: 40000 });

    await request(app)
      .post(`/api/tontines/${tontineId}/pay`)
      .set('Authorization', `Bearer ${secondUserToken}`)
      .send({ amount: 40000 });

    const tontine = await Tontine.findByPk(tontineId);
    expect(tontine.currentRound).toBe(2);

    const firstParticipant = await Participant.findOne({
      where: { tontineId, position: 1 }
    });
    expect(firstParticipant.hasReceived).toBe(true);
  });

  test('13. Should get round status correctly', async () => {
    const createResponse = await request(app)
      .post('/api/tontines')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Round Status Test',
        amount: 35000,
        frequency: 16,
        startDate: '2026-01-01'
      });

    const tontineId = createResponse.body.data.id;

    await request(app)
      .post(`/api/tontines/${tontineId}/join`)
      .set('Authorization', `Bearer ${secondUserToken}`);

    const response = await request(app)
      .get(`/api/tontines/${tontineId}/round`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.currentRound).toBe(1);
    expect(response.body.data.totalParticipants).toBe(2);
    expect(response.body.data.paymentsReceived).toBe(0);
    expect(response.body.data.isRoundComplete).toBe(false);
  });
});
