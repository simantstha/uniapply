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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/universities', universitiesRoutes);
app.use('/api/universities', requirementsRoutes);
app.use('/api/sops', sopsRoutes);
app.use('/api/critiques', critiquesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/college-search', collegeSearchRoutes);
app.use('/api/documents', documentsRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
