import BlacklistedToken from './BlacklistedToken.js';
import Participant from './Participant.js';
import Payment from './Payment.js';
import Tontine from './Tontine.js';
import User from './User.js';

Tontine.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
Tontine.hasMany(Participant, { foreignKey: 'tontineId', onDelete: 'CASCADE' });
Tontine.hasMany(Payment, { foreignKey: 'tontineId', onDelete: 'CASCADE' });

Participant.belongsTo(Tontine, { foreignKey: 'tontineId' });
Participant.belongsTo(User, { foreignKey: 'userId' });

Payment.belongsTo(Tontine, { foreignKey: 'tontineId' });
Payment.belongsTo(User, { foreignKey: 'userId' });

export { BlacklistedToken, Participant, Payment, Tontine, User };

