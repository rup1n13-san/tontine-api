import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tontineId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'tontine_id',
    references: {
      model: 'tontines',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  roundNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'round_number',
    validate: {
      min: 1
    }
  },
  paymentDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'payment_date'
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    allowNull: false,
    defaultValue: 'completed'
  }
}, {
  tableName: 'payments',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['tontine_id', 'user_id', 'round_number'],
      name: 'unique_payment_per_round'
    }
  ]
});

export default Payment;
