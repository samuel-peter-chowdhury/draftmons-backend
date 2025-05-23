import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { APP_CONFIG } from './app.config';
import { UserService } from '../services/user.service';

export const configurePassport = (userService: UserService): void => {
  // Configure Google OAuth2.0 Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: APP_CONFIG.auth.google.clientID,
        clientSecret: APP_CONFIG.auth.google.clientSecret,
        callbackURL: APP_CONFIG.auth.google.callbackURL,
        scope: ['profile', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Extract user information from Google profile
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value || '';
          const firstName = profile.name?.givenName || '';
          const lastName = profile.name?.familyName || '';

          // Check if user exists and update or create as needed
          const user = await userService.findOrCreateGoogleUser({
            googleId,
            email,
            firstName,
            lastName,
          });

          // Return user to passport
          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );

  // Serialize user to session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await userService.findOne(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
};
