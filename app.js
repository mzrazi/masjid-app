var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const dbConnect = require('./config/connection');
const exphbs = require('express-handlebars');
const Handlebars = require('handlebars')
const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access')
const cron = require('./controllers/cronjob')
const cors=require('cors')


const bodyParser = require('body-parser');

require('dotenv').config()
var app = express();
app.use(bodyParser.json());

var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');


// view engine setup
app.engine('hbs', exphbs.engine({
  extname: 'hbs',
  defaultLayout: 'layout',
  layoutsDir: __dirname + '/views/layouts',
  partialsDir: __dirname + '/views/partials',
  runtimeOptions:{allowProtoPropertiesByDefault:true,
    allowedProtoMethodsByDefault:true}
 
}))
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');


app.use(cors());
app.use(express.json());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
dbConnect()
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
module.exports = app;
