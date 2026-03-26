import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import universitiesRoutes from './routes/universities.js';
import sopsRoutes from './routes/sops.js';
import critiquesRoutes from './routes/critiques.js';
import dashboardRoutes from './routes/dashboard.js';
import collegeSearchRoutes from './routes/collegeSearch.js';
import documentsRoutes from './routes/documents.js';
import requirementsRoutes from './routes/requirements.js';
import lorsRoutes from './routes/lors.js';
import reviewRoutes from './routes/review.js';
import onboardingRoutes from './routes/onboarding.js';
import { startDeadlineReminders } from './jobs/deadlineReminders.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = (process.env.CLIENT_URL || '').split(',').map(o => o.trim());
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/universities', universitiesRoutes);
app.use('/api/universities', requirementsRoutes);
app.use('/api', reviewRoutes);
app.use('/api/sops', sopsRoutes);
app.use('/api/critiques', critiquesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/college-search', collegeSearchRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/lors', lorsRoutes);
app.use('/api/onboarding', onboardingRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

startDeadlineReminders();
