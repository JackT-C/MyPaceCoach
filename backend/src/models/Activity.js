import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const Activity = sequelize.define('Activity', {
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
  stravaId: {
    type: DataTypes.STRING,
    unique: true,
    field: 'strava_id'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('Run', 'Workout', 'Race', 'CrossTraining', 'Rest'),
    defaultValue: 'Run'
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  distance: {
    type: DataTypes.FLOAT
  },
  movingTime: {
    type: DataTypes.INTEGER,
    field: 'moving_time'
  },
  elapsedTime: {
    type: DataTypes.INTEGER,
    field: 'elapsed_time'
  },
  totalElevationGain: {
    type: DataTypes.FLOAT,
    field: 'total_elevation_gain'
  },
  averageSpeed: {
    type: DataTypes.FLOAT,
    field: 'average_speed'
  },
  maxSpeed: {
    type: DataTypes.FLOAT,
    field: 'max_speed'
  },
  averageHeartrate: {
    type: DataTypes.FLOAT,
    field: 'average_heartrate'
  },
  maxHeartrate: {
    type: DataTypes.FLOAT,
    field: 'max_heartrate'
  },
  calories: {
    type: DataTypes.FLOAT
  },
  pace: {
    type: DataTypes.FLOAT
  },
  averagePace: {
    type: DataTypes.FLOAT,
    field: 'average_pace'
  },
  effortLevel: {
    type: DataTypes.ENUM('easy', 'moderate', 'hard', 'race'),
    defaultValue: 'moderate',
    field: 'effort_level'
  },
  terrain: {
    type: DataTypes.STRING
  },
  weather: {
    type: DataTypes.STRING
  },
  notes: {
    type: DataTypes.TEXT
  },
  isRace: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_race'
  },
  raceDistance: {
    type: DataTypes.STRING,
    field: 'race_distance'
  },
  injuryNotes: {
    type: DataTypes.TEXT,
    field: 'injury_notes'
  },
  painLevel: {
    type: DataTypes.INTEGER,
    field: 'pain_level'
  },
  splits: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  source: {
    type: DataTypes.ENUM('strava', 'manual'),
    defaultValue: 'strava'
  }
}, {
  tableName: 'activities',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id', 'date'] },
    { fields: ['strava_id'] }
  ],
  hooks: {
    beforeSave: (activity) => {
      if (activity.distance && activity.movingTime && !activity.pace) {
        const kmDistance = activity.distance / 1000;
        const minutes = activity.movingTime / 60;
        activity.pace = minutes / kmDistance;
        activity.averagePace = activity.pace;
      }
    }
  }
});

Activity.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Activity, { foreignKey: 'userId', as: 'activities' });

export default Activity;
