import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Tontine = sequelize.define('Tontine', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 100]
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  frequency: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    },
    comment: 'Payment frequency in days'
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'start_date'
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'completed'),
    allowNull: false,
    defaultValue: 'pending'
  },
  currentRound: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    field: 'current_round',
    validate: {
      min: 1
    }
  },
  totalRounds: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'total_rounds',
    validate: {
      min: 1
    }
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'created_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'updated_at'
  }
}, {
  tableName: 'tontines',
  timestamps: true
});

export default Tontine;
