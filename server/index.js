require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const itemsRouter = require('./routes/items');
const matchesRouter = require('./routes/matches');
const chatRouter = require('./routes/chat');
const policeRouter = require('./routes/police');
const claimsRouter = require('./routes/claims');
const analyticsRouter = require('./routes/analytics');
const reputationRouter = require('./routes/reputation');
const { setIoInstance } = require('./utils/realtime');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH']
  }
});

app.use(cors());
app.use(helmet());
app.use(rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 300,
  standardHeaders: true
}));
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lostandfound';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err.message));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/items', itemsRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/chat', chatRouter);
app.use('/api/police', policeRouter);
app.use('/api/claims', claimsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/reputation', reputationRouter);

io.on('connection', (socket) => {
  socket.on('auth:join', (payload) => {
    if (payload?.userId) {
      socket.join(`user:${payload.userId}`);
    }
  });
});

setIoInstance(io);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
