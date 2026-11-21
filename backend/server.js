import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

import express, { json } from 'express';
import { connect } from 'mongoose';
import cors from 'cors';
import session from 'express-session';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.js';
import StudentRoutes from './routes/student.js'
import companyRoutes from './routes/company.js'
import adminRoutes from  './routes/admin.js'
import jobRoutes from './routes/jobs.js'
import superAdminRoutes from './routes/superAdmin.js'
import aiRoutes from './routes/ai.js'
import notificationRoutes from './routes/notifications.js'
import mockInterviewRoutes from './routes/mockInterview.js'
import skillGapRoutes from './routes/skillGap.js'
import aptitudeRoutes from './routes/aptitude.js'
import prepRoutes from './routes/prep.js'
import interviewRoutes from './routes/interviews.js'
import calendarRoutes from './routes/calendar.js'
import reviewRoutes from './routes/reviews.js'
import eligibilityRoutes from './routes/eligibility.js'
import eventRoutes from './routes/events.js'
import MongoStore from 'connect-mongo';
import { setNotificationIo, processScheduledNotifications } from './services/notificationService.js';

const app = express();

// Trust reverse proxy (Vercel, Render, AWS, Heroku) so HTTPS & secure cookies work correctly
app.set('trust proxy', 1);

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: true, credentials: true }
});
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept');
    }
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

app.use(cors({ 
    origin: true,
    credentials: true // Crucial for session cookies to be sent
}));
app.use(json({ limit: '50mb' }));

// Built-in session parsing: absolutely no custom JWT token verification middleware
const sessionStore = MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
    touchAfter: 24 * 3600,            // Only update session once per 24h unless data changes
    autoRemove: 'native',             // Let MongoDB TTL index handle expired session cleanup
});

// Monkey-patch touch() to silently swallow "Unable to find the session to touch" errors.
// This error fires when a client sends a stale cookie for a session already removed from MongoDB.
// It's harmless but connect-mongo throws it as an unhandled promise rejection.
const originalTouch = sessionStore.touch.bind(sessionStore);
sessionStore.touch = function (sid, session, callback) {
    return originalTouch(sid, session, function (err) {
        if (err && err.message && err.message.includes('Unable to find the session to touch')) {
            // Silently ignore — session was already cleaned up
            return callback ? callback() : undefined;
        }
        return callback ? callback(err) : undefined;
    });
};

const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

app.use(session({
    secret: process.env.SESSION_SECRET || 'strong_cookie_secret_for_placement',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    proxy: true,
    cookie: { 
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        httpOnly: true, 
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}));

// Setup logic to verify sessions within controllers vs dedicated middleware (to meet rule)
// Actually "NO JWT, NO middleware" probably refers to no complicated auth middleware. We'll simply check req.session in endpoints instead.

// Implemented Routes - mounted with both /api prefix and root aliases for bulletproof routing
const apiRoutes = [
    ['/auth', authRoutes],
    ['/student', StudentRoutes],
    ['/company', companyRoutes],
    ['/admin', adminRoutes],
    ['/jobs', jobRoutes],
    ['/super-admin', superAdminRoutes],
    ['/ai', aiRoutes],
    ['/notifications', notificationRoutes],
    ['/mock-interview', mockInterviewRoutes],
    ['/skill-gap', skillGapRoutes],
    ['/aptitude', aptitudeRoutes],
    ['/prep', prepRoutes],
    ['/interviews', interviewRoutes],
    ['/calendar', calendarRoutes],
    ['/reviews', reviewRoutes],
    ['/eligibility', eligibilityRoutes],
    ['/events', eventRoutes],
];

apiRoutes.forEach(([prefix, router]) => {
    app.use('/api' + prefix, router);
    app.use(prefix, router);
});

io.on('connection', (socket) => {
    const { studentId } = socket.handshake.query || {};
    if (studentId) {
        socket.join(`student:${studentId}`);
    }
});
setNotificationIo(io);

setInterval(() => {
    processScheduledNotifications().catch((err) => {
        console.error('Scheduled notification processing failed:', err.message);
    });
}, 60 * 1000);

connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected '))
  .catch(err => console.log('MongoDB connection error:', err));

app.get('/api/health', (req, res) => res.json({ ok: true }));

const distPath = path.join(__dirname, '../dist');
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(distPath));
app.use(express.static(frontendDistPath));

app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    if (req.url.startsWith('/api') || req.url.startsWith('/notifications') || req.url.startsWith('/auth')) {
        return next();
    }
    const indexPath = path.join(distPath, 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            const fallbackPath = path.join(frontendDistPath, 'index.html');
            res.sendFile(fallbackPath, (err2) => {
                if (err2) next();
            });
        }
    });
});

if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 5089;
    httpServer.listen(PORT, () => console.log(`Server running on ${PORT}`));
}

export default app;
