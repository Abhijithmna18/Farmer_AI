// src/config/passport.js
/**
 * Passport Google OAuth2 strategy setup.
 *
 * This file expects:
 *  - GOOGLE_CLIENT_ID
 *  - GOOGLE_CLIENT_SECRET
 *  - GOOGLE_CALLBACK_URL (e.g. http://localhost:5000/api/auth/google/callback)
 *
 * The strategy will attempt to find a user by email in your MongoDB User collection.
 * If none is found it will create a minimal user record (you can expand the fields).
 *
 * It uses passport.serializeUser / deserializeUser which is helpful if you use sessions.
 *
 * NOTE: If you're not using sessions (you issue JWTs instead), you can still use the strategy
 * by issuing a JWT in your callback route and returning it to the client.
 */

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User'); // adjust path if necessary
const jwt = require('jsonwebtoken');

const initPassport = () => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('Google OAuth env vars not set: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
      },
      // verify callback
      async (accessToken, refreshToken, profile, done) => {
        try {
          // profile fields: profile.id, profile.emails, profile.displayName, profile.photos
          const email = profile?.emails?.[0]?.value;
          const name = profile?.displayName;
          const googleId = profile.id;

          if (!email) {
            return done(new Error('Google account has no email'), null);
          }

          // Find existing user by email or googleId
          let user = await User.findOne({ $or: [{ email }, { googleId }] });

          if (!user) {
            // Create new user - mark email as verified
            user = new User({
              name,
              email,
              googleId,
              verified: true,
              // phone left empty for now; set role default 'farmer'
            });

            await user.save();
          } else {
            // Attach googleId if missing
            if (!user.googleId) {
              user.googleId = googleId;
              user.verified = true;
              await user.save();
            }
          }

          // If you use sessions, call done(null, user)
          // But if you prefer to issue JWT here, we can attach a token to the user object or handle in route.
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );

  // Sessions (optional). If not using sessions you can omit these
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id).select('-password'); // strip password
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};

module.exports = {
  initPassport,
  passport,
};
