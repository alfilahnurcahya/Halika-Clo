import { successResponse } from '../utils/api-response.js';
import { getDatabaseStatus } from '../config/database.js';

export async function getHealth(req, res) {
  const database = await getDatabaseStatus();
  res.status(200).json(successResponse('Service is healthy.', {
    status: 'ok',
    database,
    timestamp: new Date().toISOString(),
  }));
}
