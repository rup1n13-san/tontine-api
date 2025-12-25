import { DataTypes , Op } from 'sequelize';
import { sequelize } from '../config/database.js';

const BlacklistedToken = sequelize.define('BlacklistedToken', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  token: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'expires_at'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'blacklisted_tokens',
  timestamps: true,
  updatedAt: false,
  indexes: [
    {
      fields: ['token']
    },
    {
      fields: ['expires_at']
    }
  ]
});

BlacklistedToken.cleanupExpired = async function() {
  try {
    const result = await this.destroy({
      where: {
        expiresAt: {
          [Op.lt]: new Date()
        }
      }
    });
    console.log(`Cleaned up ${result} expired tokens from blacklist`);
    return result;
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
    throw error;
  }
};

export default BlacklistedToken;
