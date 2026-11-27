import app from './app.js';
import env from './config/env.js';

app.listen(env.port, () => {
  console.log(`Halika.Clo API berjalan di http://localhost:${env.port}/api/v1`);
});
