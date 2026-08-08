const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

/**
 * GET /auth/google
 * Redirects the browser to Google's consent page.
 */
const initiateGoogleAuth = (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    prompt: 'select_account',
  });
  res.redirect(authUrl);
};

/**
 * GET /auth/google/callback
 * Google redirects here with ?code=...
 * Exchange code → tokens → get user info → upsert in DB → issue JWT → redirect to frontend.
 */
const googleCallback = async (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

  try {
    const { code } = req.query;
    if (!code) {
      return res.redirect(`${clientUrl}/login?error=no_code`);
    }

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Decode the id_token to get user info (no extra HTTP call needed)
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const { email, name, picture, sub: googleId } = payload;

    // Upsert user in MongoDB
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        avatar: picture || '',
        googleId,
        isVerified: true,
      });
    } else {
      // Sync avatar and googleId if not set
      if (!user.googleId) user.googleId = googleId;
      if (!user.avatar && picture) user.avatar = picture;
      await user.save();
    }

    // Issue a custom JWT
    const token = generateToken(user._id);

    // Redirect to frontend with token in query string
    res.redirect(`${clientUrl}/auth/callback?token=${token}`);
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    res.redirect(`${clientUrl}/login?error=google_failed`);
  }
};

module.exports = { initiateGoogleAuth, googleCallback };
