const knex = require('knex');
const app = require('./app');
const { PORT, DB_URL } = require('./config');

const db = knex({
    client: 'pg',
    connection: DB_URL
});

app.set('db', db);

app.listen(PORT, () => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`Server available at http://localhost:${PORT}`);
    }
});
