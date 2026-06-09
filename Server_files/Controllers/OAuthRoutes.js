import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import AppleStrategy from "passport-apple";
import User from "../Models/UserModel.js";

const getBackendOrigin = () =>
  (process.env.API_PUBLIC_ORIGIN || `http://localhost:${process.env.PORT}`)
    .split(",")[0]
    .trim();

const getFrontendOrigin = () =>
  (
    process.env.VERIFICATION_FRONTEND_ORIGIN ||
    process.env.FRONTEND_ORIGIN ||
    "http://localhost:5173"
  )
    .split(",")[0]
    .trim();

const buildFrontendRedirect = (params) => {
  const url = new URL("/auth", getFrontendOrigin());

  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });

  return url.toString();
};

const getProviderEmail = (profile) =>
  profile?.emails?.find((emailRecord) => emailRecord?.value)?.value ||
  profile?._json?.email ||
  "";

const getDisplayNames = (profile, email) => {
  const fallback = email.split("@")[0] || "Vibe";
  const fullName = profile?.displayName || fallback;
  const [firstName = fallback, ...rest] = fullName.trim().split(/\s+/);

  return {
    firstname: firstName,
    lastname: rest.join(" ") || "User",
    displayName: fullName,
  };
};

const makeBaseUsername = (email) =>
  (email.split("@")[0] || "vibe_user")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24) || "vibe_user";

const getUniqueUsername = async (email) => {
  const baseUsername = makeBaseUsername(email);
  let candidate = baseUsername;
  let suffix = 0;

  while (await User.exists({ username: candidate })) {
    suffix += 1;
    candidate = `${baseUsername}_${suffix}`.slice(0, 32);
  }

  return candidate;
};

const issueAuthCookie = (res, user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from the environment");
  }

  const token = jwt.sign(
    {
      id: user._id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const upsertOAuthUser = async ({ provider, providerId, profile }) => {
  const email = getProviderEmail(profile).trim().toLowerCase();

  if (!email) {
    throw new Error("The provider did not return a verified email address.");
  }

  const existingUser = await User.findOne({ email });
  const { firstname, lastname, displayName } = getDisplayNames(profile, email);
  const avatar = profile?.photos?.[0]?.value;

  if (existingUser) {
    existingUser.authProvider = existingUser.authProvider || provider;
    existingUser.providerId =
      existingUser.providerId || String(providerId || "");
    existingUser.status = true;
    existingUser.emailVerifiedAt = existingUser.emailVerifiedAt || new Date();
    existingUser.emailVerificationToken = null;

    if (!existingUser.profile?.displayName) {
      existingUser.profile = {
        ...existingUser.profile,
        displayName,
        images: avatar ? [avatar] : existingUser.profile?.images || [],
      };
    }

    await existingUser.save();
    return existingUser;
  }

  return User.create({
    firstname,
    lastname,
    username: await getUniqueUsername(email),
    email,
    dob: new Date("1900-01-01"),
    phone: "",
    authProvider: provider,
    providerId: String(providerId || ""),
    emailVerifiedAt: new Date(),
    emailVerificationToken: null,
    status: true,
    profile: {
      displayName,
      vibe: "",
      lookingFor: "",
      images: avatar ? [avatar] : [],
    },
  });
};

const handleOAuthProfile =
  (provider) => async (_accessToken, _refreshToken, profile, done) => {
    try {
      const user = await upsertOAuthUser({
        provider,
        providerId: profile.id,
        profile,
      });

      done(null, user);
    } catch (error) {
      done(error);
    }
  };

const configuredStrategies = new Set();

export const configureOAuthStrategies = () => {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: `${getBackendOrigin()}/api/auth/oauth/google/callback`,
        },
        handleOAuthProfile("google"),
      ),
    );
    configuredStrategies.add("google");
  }

  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
          callbackURL: `${getBackendOrigin()}/api/auth/oauth/facebook/callback`,
          profileFields: ["id", "displayName", "emails", "photos"],
        },
        handleOAuthProfile("facebook"),
      ),
    );
    configuredStrategies.add("facebook");
  }

  if (
    process.env.APPLE_CLIENT_ID &&
    process.env.APPLE_TEAM_ID &&
    process.env.APPLE_KEY_ID &&
    process.env.APPLE_PRIVATE_KEY
  ) {
    passport.use(
      new AppleStrategy(
        {
          clientID: process.env.APPLE_CLIENT_ID,
          teamID: process.env.APPLE_TEAM_ID,
          keyID: process.env.APPLE_KEY_ID,
          privateKeyString: process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
          callbackURL: `${getBackendOrigin()}/api/auth/oauth/apple/callback`,
          scope: ["name", "email"],
        },
        async (_accessToken, _refreshToken, _idToken, profile, done) => {
          try {
            const user = await upsertOAuthUser({
              provider: "apple",
              providerId: profile?.id || crypto.randomUUID(),
              profile,
            });

            done(null, user);
          } catch (error) {
            done(error);
          }
        },
      ),
    );
    configuredStrategies.add("apple");
  }
};

export const requireOAuthProvider = (provider) => (req, res, next) => {
  if (!configuredStrategies.has(provider)) {
    return res.redirect(
      buildFrontendRedirect({
        socialAuth: "error",
        provider,
        message: `${provider} OAuth is not configured on the server.`,
      }),
    );
  }

  next();
};

export const handleOAuthCallback = (provider) => (req, res) => {
  try {
    issueAuthCookie(res, req.user);
    return res.redirect(
      buildFrontendRedirect({
        socialAuth: "success",
        provider,
        email: req.user.email,
      }),
    );
  } catch (error) {
    return res.redirect(
      buildFrontendRedirect({
        socialAuth: "error",
        provider,
        message: error.message,
      }),
    );
  }
};

export default passport;
