require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');
const commentRoutes = require('./routes/commentRoutes');
const googleAuthRoutes = require('./routes/googleAuthRoutes');

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');

const app = express();
const PORT = process.env.PORT || 4000;

// Security Middleware 1: Helmet Security Headers
app.use(helmet());

// Security Middleware 2: Rate Limiting
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // Limit 5 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login/auth requests from this IP, please try again after a minute.' }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit 200 requests per 15 mins per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many API requests from this IP, please try again later.' }
});

// Security Middleware 3: CORS Strict Trusted Domain Controls
const clientOrigin = process.env.CLIENT_URL || 'http://localhost:3000';
app.use(cors({ origin: clientOrigin, credentials: true }));

// Body parsing
app.use(express.json({ limit: '10kb' })); // Limit body payload size

// Security Middleware 4: MongoDB NoSQL Injection Protection
app.use(mongoSanitize());

// Security Middleware 5: Input XSS Sanitization Middleware
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    const sanitizeObj = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = xss(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObj(obj[key]);
        }
      }
    };
    sanitizeObj(req.body);
  }
  next();
});

// Apply Rate Limiters
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/send-otp', authLimiter);
app.use('/api/auth/verify-otp', authLimiter);
app.use('/api/', apiLimiter);

// Health check & root route
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Todo SaaS API is running' });
});

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/comments', commentRoutes);
app.use('/auth', googleAuthRoutes);   // Google OAuth redirect routes

const seedInitialData = require('./config/seedData');

// Seed endpoint (Protected in production)
app.get('/api/seed', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Forbidden in production' });
  }
  await seedInitialData();
  res.json({ message: 'Database seed executed successfully' });
});

// Error Handler Middleware
app.use(errorHandler);

// Connect DB & Start Server
const startServer = async () => {
  await connectDB();
  await seedInitialData();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
