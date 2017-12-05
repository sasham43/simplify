var router = require('express').Router();
var request = require('request');
var pg = require('pg');
var passport = require('passport');
var SpotifyStrategy = require('passport-spotify').Strategy;

var connectionString = require('../db/connection');

var client_id = process.env.CLIENT_ID; // Your client id
var client_secret = process.env.CLIENT_SECRET; // Your secret
var redirect_uri = process.env.REDIRECT_URI; // Your redirect uri

// set up passport
passport.use(new SpotifyStrategy({
  clientID: client_id,
  clientSecret: client_secret,
  callbackURL: redirect_uri
}, function(accessToken, refreshToken, profile, done){
  // find or create user in db
  process.nextTick(function () {
      // To keep the example simple, the user's spotify profile is returned to
      // represent the logged-in user. In a typical application, you would want
      // to associate the spotify account with a user record in your database,
      // and return that user instead.
      module.exports.access_token = accessToken;
      module.exports.refresh_token = refreshToken;
      return done(null, profile);
    });
}))

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

router.get('/', passport.authenticate('spotify', {scope: ['user-read-email', 'user-read-private', 'user-library-read', 'streaming', 'user-modify-playback-state', 'user-read-playback-state','user-read-currently-playing','user-read-recently-played'] }), function(req, res){
  // does not get called, gets redirected
});

router.get('/callback', passport.authenticate('spotify', {failureRedirect: '/fail'}), function(req, res){
  // success
  console.log('successfully authenticated.', req.user);
  res.redirect('/albums');
});

router.get('/info', ensureAuthenticated, function(req, res){
  res.send(req.user);
});


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed. Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}


module.exports.router = router;
