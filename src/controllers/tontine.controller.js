import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import { Participant, Payment, Tontine, User } from '../models/index.js';

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

    return res.status(201).json({
      success: true,
      data: tontineWithCreator
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error creating tontine:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la tontine',
      error: error.message
    });
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

    return res.json({
      success: true,
      data: tontines
    });

  } catch (error) {
    console.error('Error listing tontines:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des tontines',
      error: error.message
    });
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
      return res.status(404).json({
        success: false,
        message: 'Tontine not found'
      });
    }

    const participantCount = tontine.Participants.length;
    const response = {
      ...tontine.toJSON(),
      participantCount,
      totalRounds: participantCount
    };

    return res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error getting tontine details:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des détails',
      error: error.message
    });
  }
};

export const joinTontine = async (req, res) => {
  try {
    const { id: tontineId } = req.params;
    const userId = req.user.id;

    const tontine = await Tontine.findByPk(tontineId);
    if (!tontine) {
      return res.status(404).json({
        success: false,
        message: 'Tontine not found'
      });
    }

    if (tontine.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot join completed tontine'
      });
    }

    const existingParticipant = await Participant.findOne({
      where: { tontineId, userId }
    });

    if (existingParticipant) {
      return res.status(400).json({
        success: false,
        message: 'Already a participant'
      });
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

    return res.status(201).json({
      success: true,
      data: participant
    });

  } catch (error) {
    console.error('Error joining tontine:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la participation',
      error: error.message
    });
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
      return res.status(404).json({
        success: false,
        message: 'Tontine not found'
      });
    }

    const participant = await Participant.findOne({
      where: { tontineId, userId },
      transaction
    });

    if (!participant) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'You are not a participant of this tontine'
      });
    }

    if (parseFloat(amount) !== parseFloat(tontine.amount)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Payment amount must be ${tontine.amount}`
      });
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
      return res.status(400).json({
        success: false,
        message: `You have already paid for round ${currentRound}`
      });
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

    return res.status(201).json({
      success: true,
      data: payment,
      message: `Payment for round ${currentRound} recorded successfully`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error making payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du paiement',
      error: error.message
    });
  }
};

export const getRoundStatus = async (req, res) => {
  try {
    const { id: tontineId } = req.params;

    const tontine = await Tontine.findByPk(tontineId);
    if (!tontine) {
      return res.status(404).json({
        success: false,
        message: 'Tontine not found'
      });
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

    return res.json({
      success: true,
      data: {
        currentRound,
        totalRounds: tontine.totalRounds || participants.length,
        status: tontine.status,
        beneficiary: beneficiary ? beneficiary.User : null,
        participants: participantsStatus,
        paymentsReceived: payments.length,
        totalParticipants: participants.length,
        isRoundComplete: payments.length === participants.length
      }
    });

  } catch (error) {
    console.error('Error getting round status:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du statut',
      error: error.message
    });
  }
};
