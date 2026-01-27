import axios from 'axios';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import RacePB from '../models/RacePB.js';

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

/**
 * Refresh Strava access token if expired
 */
export async function refreshAccessToken(user) {
  if (new Date() < user.tokenExpiresAt) {
    return user.accessToken;
  }

  try {
    const response = await axios.post('https://www.strava.com/oauth/token', {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: user.refreshToken,
      grant_type: 'refresh_token'
    });

    await user.update({
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      tokenExpiresAt: new Date(Date.now() + response.data.expires_in * 1000)
    });

    return user.accessToken;
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
}

/**
 * Fetch detailed activity data including splits from Strava
 */
export async function fetchActivityDetails(user, activityId) {
  const accessToken = await refreshAccessToken(user);

  try {
    const response = await axios.get(`${STRAVA_API_BASE}/activities/${activityId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching activity details:', error);
    throw error;
  }
}

/**
 * Fetch activities from Strava API
 */
export async function fetchStravaActivities(user, page = 1, perPage = 30) {
  const accessToken = await refreshAccessToken(user);

  try {
    const response = await axios.get(`${STRAVA_API_BASE}/athlete/activities`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { page, per_page: perPage }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching Strava activities:', error);
    throw error;
  }
}

/**
 * Detect activity type from title keywords
 * @param {string} title - Activity title/name
 * @returns {string} - Activity type: Run, Workout, Race, CrossTraining, Rest
 */
function detectActivityType(title) {
  if (!title) return 'Run';
  
  const lowerTitle = title.toLowerCase();
  
  // Race indicators
  const raceKeywords = [
    'race', 'marathon', 'half marathon', 'half-marathon', '5k race', '10k race',
    'parkrun', '5k', '10k', '21k', '42k', 'ultra', 'trail race',
    'competition', 'championship', 'turkey trot', 'fun run'
  ];
  
  // Workout indicators (structured training)
  const workoutKeywords = [
    'interval', 'tempo', 'threshold', 'fartlek', 'speedwork', 'speed work',
    'track', 'hill repeats', 'hill workout', 'progression', 'vo2max',
    'lactate', 'yasso', 'repetitions', 'reps', '800m', '400m', '1000m',
    'workout', 'training', 'drills'
  ];
  
  // CrossTraining indicators
  const crossTrainingKeywords = [
    'cross train', 'crosstrain', 'cross-train', 'bike', 'cycle', 'cycling',
    'swim', 'pool', 'strength', 'weights', 'gym', 'yoga', 'pilates',
    'elliptical', 'rowing', 'row', 'hike', 'walk', 'circuit'
  ];
  
  // Rest/Recovery indicators
  const restKeywords = [
    'rest', 'recovery', 'easy recovery', 'rest day', 'off day',
    'active recovery', 'shake out', 'shakeout'
  ];
  
  // Check for race (highest priority)
  if (raceKeywords.some(keyword => lowerTitle.includes(keyword))) {
    return 'Race';
  }
  
  // Check for rest/recovery
  if (restKeywords.some(keyword => lowerTitle.includes(keyword))) {
    return 'Rest';
  }
  
  // Check for cross training
  if (crossTrainingKeywords.some(keyword => lowerTitle.includes(keyword))) {
    return 'CrossTraining';
  }
  
  // Check for workout
  if (workoutKeywords.some(keyword => lowerTitle.includes(keyword))) {
    return 'Workout';
  }
  
  // Check for common easy run phrases
  const easyRunKeywords = ['easy', 'recovery run', 'jog', 'slow', 'base run', 'morning run', 'evening run'];
  if (easyRunKeywords.some(keyword => lowerTitle.includes(keyword))) {
    return 'Run';
  }
  
  // Check for long run (still a Run type)
  const longRunKeywords = ['long run', 'sunday run', 'weekend run'];
  if (longRunKeywords.some(keyword => lowerTitle.includes(keyword))) {
    return 'Run';
  }
  
  // Default to Run for running activities
  return 'Run';
}

/**
 * Sync user activities from Strava
 */
export async function syncUserActivities(userId) {
  const user = await User.findByPk(userId);
  if (!user) throw new Error('User not found');

  let page = 1;
  let hasMore = true;
  let newActivitiesCount = 0;
  let bestEffortsFound = [];

  while (hasMore) {
    const activities = await fetchStravaActivities(user, page);
    
    if (activities.length === 0) {
      hasMore = false;
      break;
    }

    for (const activity of activities) {
      // Skip non-running activities
      if (activity.type !== 'Run') continue;

      // Check if activity already exists
      const exists = await Activity.findOne({ where: { stravaId: activity.id.toString() } });
      if (exists) continue;

      // Fetch detailed activity data to get splits and best efforts
      let splits = [];
      try {
        const detailedActivity = await fetchActivityDetails(user, activity.id);
        
        // Extract splits
        if (detailedActivity.splits_metric && detailedActivity.splits_metric.length > 0) {
          splits = detailedActivity.splits_metric.map(split => ({
            distance: split.distance,
            elapsedTime: split.elapsed_time,
            movingTime: split.moving_time,
            averageSpeed: split.average_speed,
            averageHeartrate: split.average_heartrate,
            paceZone: split.pace_zone
          }));
        }

        // Extract best efforts and save as race PBs
        if (detailedActivity.best_efforts && detailedActivity.best_efforts.length > 0) {
          for (const effort of detailedActivity.best_efforts) {
            let distance = null;
            
            // Map Strava best effort distances to our race distances
            if (effort.name === '5k') distance = '5k';
            else if (effort.name === '10k') distance = '10k';
            else if (effort.name === 'Half-Marathon' || effort.name === '21k') distance = 'half-marathon';
            else if (effort.name === 'Marathon' || effort.name === '42k') distance = 'marathon';
            
            if (distance && effort.elapsed_time) {
              // Check if this is a new PB (faster than existing)
              const existingPB = await RacePB.findOne({
                where: { userId: user.id, distance }
              });

              if (!existingPB || effort.elapsed_time < existingPB.time) {
                await RacePB.upsert({
                  userId: user.id,
                  distance,
                  time: effort.elapsed_time,
                  date: new Date(detailedActivity.start_date),
                  raceName: detailedActivity.name,
                  notes: 'Auto-imported from Strava best effort'
                });

                bestEffortsFound.push({ distance, time: effort.elapsed_time });
              }
            }
          }
        }
      } catch (error) {
        console.error(`Could not fetch details for activity ${activity.id}:`, error.message);
      }

      // Detect activity type from title
      const detectedType = detectActivityType(activity.name);

      // Create new activity
      await Activity.create({
        userId: user.id,
        stravaId: activity.id.toString(),
        name: activity.name,
        type: detectedType,
        date: new Date(activity.start_date),
        distance: activity.distance,
        movingTime: activity.moving_time,
        elapsedTime: activity.elapsed_time,
        totalElevationGain: activity.total_elevation_gain,
        averageSpeed: activity.average_speed,
        maxSpeed: activity.max_speed,
        averageHeartrate: activity.average_heartrate,
        maxHeartrate: activity.max_heartrate,
        calories: activity.calories,
        splits: splits,
        source: 'strava'
      });

      newActivitiesCount++;
    }

    page++;
    if (activities.length < 30) hasMore = false;
  }

  // Update user's last sync time
  await user.update({ lastSync: new Date() });

  return { 
    newActivitiesCount, 
    lastSync: user.lastSync,
    bestEffortsFound: bestEffortsFound.length 
  };
}

/**
 * Sync all users' activities (for cron job)
 */
export async function syncAllUsersActivities() {
  const users = await User.findAll();
  
  for (const user of users) {
    try {
      await syncUserActivities(user.id);
      console.log(`✅ Synced activities for user ${user.username}`);
    } catch (error) {
      console.error(`❌ Failed to sync for user ${user.username}:`, error.message);
    }
  }
}

/**
 * Update existing activities with auto-detected types
 * Applies the detectActivityType logic to all existing activities
 */
export async function updateExistingActivityTypes(userId) {
  try {
    const activities = await Activity.findAll({
      where: { userId }
    });

    let updatedCount = 0;

    for (const activity of activities) {
      const detectedType = detectActivityType(activity.name);
      
      // Only update if the type has changed
      if (activity.type !== detectedType) {
        await activity.update({ type: detectedType });
        updatedCount++;
      }
    }

    return {
      totalActivities: activities.length,
      updatedCount,
      message: `Updated ${updatedCount} out of ${activities.length} activities`
    };
  } catch (error) {
    console.error('Error updating activity types:', error);
    throw error;
  }
}

/**
 * Get athlete stats from Strava
 */
export async function getAthleteStats(user) {
  const accessToken = await refreshAccessToken(user);

  try {
    const response = await axios.get(`${STRAVA_API_BASE}/athletes/${user.stravaId}/stats`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching athlete stats:', error);
    throw error;
  }
}

/**
 * Rescan all existing activities for best efforts and update race PBs
 */
export async function rescanActivitiesForPBs(userId) {
  const user = await User.findByPk(userId);
  if (!user) throw new Error('User not found');

  const activities = await Activity.findAll({
    where: { userId: user.id, source: 'strava' },
    order: [['date', 'DESC']]
  });

  let pbsUpdated = 0;
  const newPBs = [];

  for (const activity of activities) {
    if (!activity.stravaId) continue;

    try {
      const detailedActivity = await fetchActivityDetails(user, parseInt(activity.stravaId));
      
      if (detailedActivity.best_efforts && detailedActivity.best_efforts.length > 0) {
        for (const effort of detailedActivity.best_efforts) {
          let distance = null;
          
          // Map Strava best effort distances to our race distances
          if (effort.name === '5k') distance = '5k';
          else if (effort.name === '10k') distance = '10k';
          else if (effort.name === 'Half-Marathon' || effort.name === '21k') distance = 'half-marathon';
          else if (effort.name === 'Marathon' || effort.name === '42k') distance = 'marathon';
          
          if (distance && effort.elapsed_time) {
            // Check if this is a new PB (faster than existing)
            const existingPB = await RacePB.findOne({
              where: { userId: user.id, distance }
            });

            if (!existingPB || effort.elapsed_time < existingPB.time) {
              await RacePB.upsert({
                userId: user.id,
                distance,
                time: effort.elapsed_time,
                date: new Date(activity.date),
                raceName: activity.name,
                notes: 'Auto-imported from Strava best effort'
              });

              newPBs.push({ 
                distance, 
                time: effort.elapsed_time,
                activity: activity.name 
              });
              pbsUpdated++;
            }
          }
        }
      }
    } catch (error) {
      console.error(`Could not rescan activity ${activity.stravaId}:`, error.message);
    }
  }

  return { 
    activitiesScanned: activities.length, 
    pbsUpdated,
    newPBs 
  };
}

