import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { Prisma } from '@prisma/client';
import { requireApiKey } from './middleware/authMiddleware.js';
import employeeRoutes from './routes/employeeRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import materialRoutes from './routes/materialRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import expenseCategoryRoutes from './routes/expenseCategoryRoutes.js';
import apartmentRoutes from './routes/apartmentRoutes.js';
import { ShowAllTables } from './controllers/DBController.js';

const app = express();
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);
app.use(express.json({ limit: '1mb' }));
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));

app.get('/api/DB', ShowAllTables);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api', requireApiKey);

app.use('/api/employees', employeeRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/expense_categories', expenseCategoryRoutes);
app.use('/api/apartments', apartmentRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((error, _req, res, _next) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return res.status(409).json({ error: 'A record with this value already exists' });
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') return res.status(409).json({ error: 'Record is still referenced by another resource' });
  if (error instanceof Prisma.PrismaClientValidationError) return res.status(400).json({ error: error.message });
  console.error(error);
  return res.status(500).json({ error: 'Internal server error' });
});

export default app;