import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import env from './config/env.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

const app = express();

// Render/Railway berada di belakang proxy -> agar rate limit membaca IP asli
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    // Izinkan tools seperti curl/Postman (tanpa origin) dan origin yang terdaftar
    if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
}));
app.use(express.json({ limit: '100kb' }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.get('/', (_req, res) => res.json({ status: 'success', message: 'Halika.Clo API. Lihat /api/v1/health' }));
app.use('/api/v1', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
