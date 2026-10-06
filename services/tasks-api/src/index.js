const { createApp } = require('./app');
const { createPostgresRepository } = require('./repositories/postgresRepository');

const PORT = Number(process.env.PORT) || 3000;
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://tasklane:tasklane@localhost:5432/tasklane';

async function main() {
  const repo = createPostgresRepository(DATABASE_URL);
  await repo.init();

  const server = createApp(repo).listen(PORT, () => {
    console.log(`tasks-api listening on port ${PORT}`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down`);
    server.close(async () => {
      await repo.close();
      process.exit(0);
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('Failed to start tasks-api:', err);
  process.exit(1);
});
