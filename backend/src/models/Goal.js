import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const Goal = sequelize.define('Goal', {
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
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  type: {
    type: DataTypes.ENUM('race', 'distance', 'time', 'consistency', 'custom'),
    allowNull: false
  },
  raceType: {
    type: DataTypes.STRING,
    field: 'race_type'
  },
  targetTime: {
    type: DataTypes.STRING,
    field: 'target_time'
  },
  raceDate: {
    type: DataTypes.DATE,
    field: 'race_date'
  },
  targetDistance: {
    type: DataTypes.FLOAT,
    field: 'target_distance'
  },
  targetPeriod: {
    type: DataTypes.STRING,
    field: 'target_period'
  },
  runsPerWeek: {
    type: DataTypes.INTEGER,
    field: 'runs_per_week'
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'abandoned', 'paused'),
    defaultValue: 'active'
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  trainingPlan: {
    type: DataTypes.JSONB,
    field: 'training_plan'
  },
  startDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'start_date'
  },
  completedDate: {
    type: DataTypes.DATE,
    field: 'completed_date'
  }
}, {
  tableName: 'goals',
  timestamps: true,
  underscored: true
});

Goal.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Goal, { foreignKey: 'userId', as: 'goals' });

export default Goal;
