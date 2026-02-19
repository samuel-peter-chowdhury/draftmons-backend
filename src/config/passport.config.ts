import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { APP_CONFIG } from './app.config';
import { UserService } from '../services/user.service';
import { UserInputDto, UserOutputDto } from '../dtos/user.dto';
import { plainToInstance } from 'class-transformer';

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
          const userInputDto: UserInputDto = plainToInstance(UserInputDto, {
            googleId,
            email,
            firstName,
            lastName,
          });
          const user = await userService.findOrCreate({ googleId }, userInputDto, {
            leagueUsers: true,
          });

          // Return user to passport (full object used only for initial serialize)
          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      },
    ),
  );

  // Serialize only the user ID to the session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize by re-querying the database for fresh user data on every request
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await userService.findOne({ id } as any, { leagueUsers: true } as any);
      const userOutputDto = plainToInstance(UserOutputDto, user, {
        groups: ['user.full'],
        excludeExtraneousValues: true,
      });
      done(null, userOutputDto);
    } catch (error) {
      done(error);
    }
  });
};
