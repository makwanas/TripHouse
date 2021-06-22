const express = require('express');
const morgan = require('morgan');

const api = require('./api');
const {rateLimit} = require("./lib/rateLimit");
const {connectToRabbitMQ} = require("./lib/rabbitmq");
const { connectToDB } = require('./lib/mongo');

const app = express();
const port = process.env.PORT || 8000;

/*
 * Morgan is a popular logger.
 */
app.use(morgan('dev'));

app.use(express.json());
app.use(express.static('public'));

/*
 * Limit number of request from clients
 *
 * Todo: Separate entire api to two parts. One for authenticated users, one for not.
 */
app.use(rateLimit)

/*
 * All routes for the API are written in modules in the api/ directory.  The
 * top-level router lives in api/index.js.  That's what we include here, and
 * it provides all of the routes.
 *
 * Todo: When users are authenticated, users don't need to provide any information about userId.
 */
app.use('/', api);

app.use('*', (err, req, res, next) => {
  console.error(err)
  res.status(500).send({
    err: 'An error occurred.    Try again later.'
  })
})

app.use('*', function (req, res, next) {
  res.status(404).json({
    error: "Requested resource " + req.originalUrl + " does not exist"
  });
});

connectToDB(async () => {
  await connectToRabbitMQ('images')
  app.listen(port, () => {
    console.log("== Server is running on port", port);
  });
});


