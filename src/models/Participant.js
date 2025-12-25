import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Participant = sequelize.define('Participant', {
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
  position: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  hasReceived: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'has_received'
  },
  joinedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'joined_at'
  }
}, {
  tableName: 'participants',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['tontine_id', 'user_id'],
      name: 'unique_user_per_tontine'
    },
    {
      unique: true,
      fields: ['tontine_id', 'position'],
      name: 'unique_position_per_tontine'
    }
  ]
});

export default Participant;
