import express from 'express';
import helmet from 'helmet';
import routes from './routes/index.js';
import { notFoundHandler } from './middlewares/not-found.js';
import { errorHandler } from './middlewares/error-handler.js';

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(express.json());
app.use('/api', routes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
