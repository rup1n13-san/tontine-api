import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import { Participant, Payment, Tontine, User } from '../models/index.js';
import { sendError, sendSuccess } from '../utils/response.js';

export const createTontine = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { name, amount, frequency, startDate } = req.body;
    const userId = req.user.id;

    const tontine = await Tontine.create({
      name,
      amount,
      frequency,
      startDate,
      status: 'pending',
      currentRound: 1,
      createdBy: userId
    }, { transaction });

    await Participant.create({
      tontineId: tontine.id,
      userId: userId,
      position: 1,
      hasReceived: false
    }, { transaction });

    await transaction.commit();

    const tontineWithCreator = await Tontine.findByPk(tontine.id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'email', 'firstName', 'lastName']
      }]
    });

    return sendSuccess(res, tontineWithCreator, null, 201);

  } catch (error) {
    await transaction.rollback();
    console.error('Error creating tontine:', error);
    return sendError(res, 'Erreur lors de la création de la tontine', 500);
  }
};

export const listTontines = async (req, res) => {
  try {
    const userId = req.user.id;

    const tontines = await Tontine.findAll({
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'email', 'firstName', 'lastName']
        },
        {
          model: Participant,
          where: { userId },
          required: false,
          attributes: ['position', 'hasReceived']
        }
      ],
      where: {
        [Op.or]: [
          { createdBy: userId },
          { '$Participants.user_id$': userId }
        ]
      }
    });

    return sendSuccess(res, tontines);

  } catch (error) {
    console.error('Error listing tontines:', error);
    return sendError(res, 'Erreur lors de la récupération des tontines', 500);
  }
};

export const getTontineDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const tontine = await Tontine.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'email', 'firstName', 'lastName']
        },
        {
          model: Participant,
          include: [{
            model: User,
            attributes: ['id', 'email', 'firstName', 'lastName']
          }],
          order: [['position', 'ASC']]
        }
      ]
    });

    if (!tontine) {
      return sendError(res, 'Tontine not found', 404);
    }

    const participantCount = tontine.Participants.length;
    const response = {
      ...tontine.toJSON(),
      participantCount,
      totalRounds: participantCount
    };

    return sendSuccess(res, response);

  } catch (error) {
    console.error('Error getting tontine details:', error);
    return sendError(res, 'Erreur lors de la récupération des détails', 500);
  }
};

export const joinTontine = async (req, res) => {
  try {
    const { id: tontineId } = req.params;
    const userId = req.user.id;

    const tontine = await Tontine.findByPk(tontineId);
    if (!tontine) {
      return sendError(res, 'Tontine not found', 404);
    }

    if (tontine.status === 'completed') {
      return sendError(res, 'Cannot join completed tontine', 400);
    }

    const existingParticipant = await Participant.findOne({
      where: { tontineId, userId }
    });

    if (existingParticipant) {
      return sendError(res, 'Already a participant', 400);
    }

    const maxPosition = await Participant.max('position', {
      where: { tontineId }
    }) || 0;

    const nextPosition = maxPosition + 1;

    const participant = await Participant.create({
      tontineId,
      userId,
      position: nextPosition,
      hasReceived: false
    });

    await tontine.update({
      totalRounds: nextPosition
    });

    return sendSuccess(res, participant, null, 201);

  } catch (error) {
    console.error('Error joining tontine:', error);
    return sendError(res, 'Erreur lors de la participation', 500);
  }
};

export const makePayment = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id: tontineId } = req.params;
    const { amount } = req.body;
    const userId = req.user.id;

    const tontine = await Tontine.findByPk(tontineId, {
      lock: transaction.LOCK.UPDATE,
      transaction
    });

    if (!tontine) {
      await transaction.rollback();
      return sendError(res, 'Tontine not found', 404);
    }

    const participant = await Participant.findOne({
      where: { tontineId, userId },
      transaction
    });

    if (!participant) {
      await transaction.rollback();
      return sendError(res, 'You are not a participant of this tontine', 403);
    }

    if (parseFloat(amount) !== parseFloat(tontine.amount)) {
      await transaction.rollback();
      return sendError(res, `Payment amount must be ${tontine.amount}`, 400);
    }

    const currentRound = tontine.currentRound;

    const existingPayment = await Payment.findOne({
      where: {
        tontineId,
        userId,
        roundNumber: currentRound
      },
      transaction
    });

    if (existingPayment) {
      await transaction.rollback();
      return sendError(res, `You have already paid for round ${currentRound}`, 400);
    }

    const payment = await Payment.create({
      tontineId,
      userId,
      amount,
      roundNumber: currentRound,
      status: 'completed'
    }, { transaction });

    const totalParticipants = await Participant.count({
      where: { tontineId },
      transaction
    });

    const paymentsThisRound = await Payment.count({
      where: {
        tontineId,
        roundNumber: currentRound,
        status: 'completed'
      },
      transaction
    });

    if (paymentsThisRound === totalParticipants) {
      const beneficiary = await Participant.findOne({
        where: {
          tontineId,
          position: currentRound
        },
        transaction
      });

      if (beneficiary) {
        await beneficiary.update({ hasReceived: true }, { transaction });
      }

      if (currentRound >= totalParticipants) {
        await tontine.update({
          status: 'completed'
        }, { transaction });
      } else {
        await tontine.update({
          currentRound: currentRound + 1
        }, { transaction });
      }
    }

    await transaction.commit();

    return sendSuccess(res, payment, `Payment for round ${currentRound} recorded successfully`, 201);

  } catch (error) {
    await transaction.rollback();
    console.error('Error making payment:', error);
    return sendError(res, 'Erreur lors du paiement', 500);
  }
};

export const getRoundStatus = async (req, res) => {
  try {
    const { id: tontineId } = req.params;

    const tontine = await Tontine.findByPk(tontineId);
    if (!tontine) {
      return sendError(res, 'Tontine not found', 404);
    }

    const currentRound = tontine.currentRound;

    const participants = await Participant.findAll({
      where: { tontineId },
      include: [{
        model: User,
        attributes: ['id', 'email', 'firstName', 'lastName']
      }],
      order: [['position', 'ASC']]
    });

    const payments = await Payment.findAll({
      where: {
        tontineId,
        roundNumber: currentRound,
        status: 'completed'
      },
      include: [{
        model: User,
        attributes: ['id', 'email', 'firstName', 'lastName']
      }]
    });

    const paidUserIds = payments.map(p => p.userId);

    const participantsStatus = participants.map(p => ({
      ...p.toJSON(),
      hasPaidCurrentRound: paidUserIds.includes(p.userId)
    }));

    const beneficiary = participants.find(p => p.position === currentRound);

    return sendSuccess(res, {
      currentRound,
      totalRounds: tontine.totalRounds || participants.length,
      status: tontine.status,
      beneficiary: beneficiary ? beneficiary.User : null,
      participants: participantsStatus,
      paymentsReceived: payments.length,
      totalParticipants: participants.length,
      isRoundComplete: payments.length === participants.length
    });

  } catch (error) {
    console.error('Error getting round status:', error);
    return sendError(res, 'Erreur lors de la récupération du statut', 500);
  }
};
