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
// serve static files
app.use(express.static(path.join(__dirname, 'public')));
 
dbConnect();
app.use('/api', userRouter);
app.use('/api/admin', adminRouter);

// serve image files
app.get('/images/:filename', function(req, res, next) {
  const filePath = path.join(__dirname, 'public/images', req.params.filename);
  fs.readFile(filePath, function(err, data) {
    if (err) {
      return next(createError(404));
    }
    res.setHeader('Content-Type', 'image/jpeg');
    res.send(data);
  });
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!'+err);
});


// serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname+'/frontend-masjid/build/index.html'));
});

module.exports = app;
