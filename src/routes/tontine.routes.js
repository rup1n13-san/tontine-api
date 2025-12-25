import express from 'express';
import {
    createTontine,
    getRoundStatus,
    getTontineDetails,
    joinTontine,
    listTontines,
    makePayment
} from '../controllers/tontine.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validate.js';
import { createTontineSchema, paymentSchema } from '../validators/tontine.validator.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', validate(createTontineSchema), createTontine);
router.get('/', listTontines);
router.get('/:id', getTontineDetails);
router.post('/:id/join', joinTontine);
router.post('/:id/pay', validate(paymentSchema), makePayment);
router.get('/:id/round', getRoundStatus);

export default router;
