import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const RacePB = sequelize.define('RacePB', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  distance: {
    type: DataTypes.ENUM('100m', '200m', '400m', '800m', '1500m', '1600m', '3000m', '5k', '10k', 'half-marathon', 'marathon', '50k', '100k'),
    allowNull: false
  },
  time: {
    type: DataTypes.INTEGER, // Time in milliseconds (for sprints) or seconds (for longer races)
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  raceName: {
    type: DataTypes.STRING
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'race_pbs',
  timestamps: true,
  underscored: true
});

export default RacePB;
