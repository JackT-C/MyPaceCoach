import passport from 'passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import User from '../models/User.js';

// Configure Strava OAuth2 Strategy
passport.use('strava', new OAuth2Strategy({
    authorizationURL: 'https://www.strava.com/oauth/authorize',
    tokenURL: 'https://www.strava.com/oauth/token',
    clientID: process.env.STRAVA_CLIENT_ID,
    clientSecret: process.env.STRAVA_CLIENT_SECRET,
    callbackURL: process.env.STRAVA_CALLBACK_URL
  },
  async (accessToken, refreshToken, params, profile, done) => {
    try {
      // Fetch user profile from Strava API
      const response = await fetch('https://www.strava.com/api/v3/athlete', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const stravaProfile = await response.json();
      
      // Check if user exists - convert stravaId to string
      let user = await User.findOne({ where: { stravaId: String(stravaProfile.id) } });

      const userData = {
        stravaId: String(stravaProfile.id),
        username: stravaProfile.username,
        firstName: stravaProfile.firstname,
        lastName: stravaProfile.lastname,
        email: stravaProfile.email,
        profile: stravaProfile.profile,
        profileMedium: stravaProfile.profile_medium,
        city: stravaProfile.city,
        state: stravaProfile.state,
        country: stravaProfile.country,
        sex: stravaProfile.sex,
        premium: stravaProfile.premium,
        accessToken,
        refreshToken,
        tokenExpiresAt: new Date(Date.now() + params.expires_in * 1000)
      };

      if (user) {
        // Update existing user
        await user.update(userData);
      } else {
        // Create new user
        user = await User.create(userData);
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
