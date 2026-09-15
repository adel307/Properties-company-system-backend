import 'dotenv/config';
import app from './app.js';
import prisma from './db.js';

const port = Number(process.env.PORT) || 6000;
const server = app.listen(port, () => console.log(`REC API listening on port ${port}`));
async function shutdown(signal) {
  console.log(`${signal} received; shutting down`);
  server.close(async () => { await prisma.$disconnect(); process.exit(0); });
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
