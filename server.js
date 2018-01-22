const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const morgan = require('morgan');
const User = require('./models/user');

const app = express();

app.set('port', 9000);

// Use of middlewares

app.use(morgan('dev'));

app.use(bodyParser.urlencoded({ extended:true }));

app.use(cookieParser());

// Express session
app.use(session({
  key: 'user_sid',
  secret:'catchthecat',
  resave: false,
  saveUninitialized: false,
  cookie: {
    expires: 6000000
  }
}));

// Checking if user's cookie is still available

app.use((req,res,next) => {
  if (req.cookies.user_sid && !req.session.user){
    res.clearCookie('user_sid');
  }
  next();
});

// Checking logged in users

const sessionChecker = (req, res, next) => {
  if(req.session.user && req.cookies.user_sid){
    res.redirect('/dashboard');
  } else {
    next();
  }
};

// Setting routes

app.get('/', sessionChecker, (req,res) => {
  res.redirect('/login');
});

app.route('/signup')
    .get(sessionChecker, (req,res) => {
      res.sendFile(__dirname + '/public/signup.html');
    })
    .post((req,res)=> {
      User.create({
        username: req.body.username,
        email:req.body.email,
        password: req.body.password
      })
      .then(user => {
        req.session.user = user.dataValues;
        res.redirect('/dashboard');
      })
      .catch(error => {
        res.redirect('/signup');
      })
    });

app.route('/login')
    .get(sessionChecker, (req,res) => {
      res.sendFile(__dirname + '/public/login.html');
    })
    .post((req,res)=> {
      const username = req.body.username,
            password = req.body.password;
      User.findOne({ where: { username : username } }).then(function(user){
        if (!user){
          res.redirect('/login');
        } else if (!user.validPassword(password)){
          res.redirect('/login');
        } else {
          req.session.user = user.dataValues;
          res.redirect('/dashboard');
        }
      });
    });

  app.get('/dashboard', (req,res)=> {
    if(req.session.user && req.cookies.user_sid){
      res.sendFile(__dirname + '/public/dashboard.html')
    } else {
      res.redirect('/login');
    }
  })

  app.get('/logout', (req, res) => {
    if(req.session.user && req.cookies.user_sid){
      res.clearCookie('user_sid');
      res.redirect('/');
    } else {
      res.redirect('/login');
    }
  });

  app.use(function(req,res,next){
    res.status(404).send("Sorry cannot find that !")
  })

  app.listen(app.get('port'), () => console.log(`App started on port ${app.get('port')}`));