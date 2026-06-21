const { MongoMemoryServer } = require('mongodb-memory-server');
const fs = require('fs');
const path = require('path');

async function start() {
  const dbPath = path.join(__dirname, 'local-db-data');
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
  }

  console.log('Starting MongoDB Memory Server with persistent storage at:', dbPath);

  try {
    const mongod = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbPath: dbPath,
        storageEngine: 'wiredTiger',
      },
    });

    const uri = mongod.getUri();
    console.log(`\n✅ MongoDB Memory Server is running!`);
    console.log(`Connection URI: ${uri}\n`);
    console.log('Keep this window open to keep the database running.');

    // Keep process alive
    process.on('SIGINT', async () => {
      console.log('Stopping MongoDB Memory Server...');
      await mongod.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start MongoDB Memory Server:', error);
    process.exit(1);
  }
}

start();
