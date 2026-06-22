const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/api', routes);

app.get('/health', (_req, res) =>
  res.json({ status: 'ok', app: 'candles-app', version: '1.0.0' })
);

// Manejo de errores — siempre al final
app.use(errorHandler);

module.exports = app;
