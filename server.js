require('dotenv').config();
const Hapi = require('@hapi/hapi');
const itemRoutes = require('./routes/itemRoutes');
const { initDB } = require('./services/db');

const init = async() => {
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

    server.route(itemRoutes);

    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
};

init();