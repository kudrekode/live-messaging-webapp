
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const userRoutes = require('./routes/users');
const authMiddleware = require('./middleware/authMiddleware');
const db = require('./db'); 

const app = express();

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  process.exit(1);
});

function validateEnvironment() {
  const requiredEnvVars = ['POSTGRES_URL'];
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    process.exit(1);
  }
}

validateEnvironment();

app.use(cors({
  origin: (origin, callback) => {
    if(!origin) return callback(null, true);
    
    const allowedOrigins = [
      'URL'
        //add own URLS here such as local host for development
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true); 
    } else {
      callback(new Error('Not allowed by CORS')); 
    }
  },
  credentials: true, 
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Normal Route Test GET');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);

app.get('/api/test-db', async (req, res) => {
  try {
    const health = await db.healthCheck();
    
    if (health.status === 'healthy') {
      res.json({
        status: 'success',
        message: 'Database connected successfully',
        data: health
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Database health check failed',
        error: health.error
      });
    }
  } catch (error) {
    console.error('Database test route error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});


app.get('/api/debug-connection', async (req, res) => {
  try {
    const result = await db.query('SELECT 1;');
    res.json({
      status: 'success',
      message: 'Basic connection test passed',
      result: result.rows
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Connection test failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Since this was part of another project used in Vercel, I kept it here for reference
module.exports = app;

// Only listen if not running on Vercel
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}