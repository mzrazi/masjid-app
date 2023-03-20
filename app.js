var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const dbConnect = require('./config/connection');
const cors = require('cors');

const bodyParser = require('body-parser');

require('dotenv').config();
var app = express();
app.use(bodyParser.json());

var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');

app.use(cors());
app.use(express.json());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'frontend-masjid/build')));

dbConnect();
app.use('/', userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  console.log(err);

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname+'/frontend-masjid/build/index.html'));
});

module.exports = app;
