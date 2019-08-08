require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config');
const ArticlesRouter = require('./articles/articles-router');

const app = express();

const morganOption = (NODE_ENV === 'production') ? 'tiny' : 'common';

app.use(morgan(morganOption));
app.use(cors());
app.use(helmet());
app.use(function errorHandler(error, req, res, next) {
    let response;
    if (NODE_ENV === 'production') {
        response = { error: { message: 'Server error' } };
    } else {
        response = { error };
    };
    res.status(500).json(response);
});
app.use('/articles', ArticlesRouter);

app.get('/', (req, res) => {
    res.send('Hello, world!');
});

// Serves up an XSS 'attack' demo page
// app.get('/xss', (req, res) => {
//     res.cookie('secretToken', '1234567890');
//     res.sendFile(__dirname + '/xss-example.html');
//   });

module.exports = app;
