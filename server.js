require('dotenv').config();
const Hapi = require('@hapi/hapi');
const itemRoutes = require('./routes/itemRoutes');
const billRoutes = require('./routes/billRoutes');
const { initDB } = require('./services/db');

const init = async () => {
  await initDB();

  const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: process.env.NODE_ENV !== 'production' ? 'localhost' : '0.0.0.0',
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  server.route([...itemRoutes, ...billRoutes]);

  await server.start();
  console.log(`Server running at: ${server.info.uri}`);
};

init();
