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

router.get('/', passport.authenticate('spotify', {scope: ['user-read-email', 'user-read-private', 'user-library-read'] }), function(req, res){
  // does not get called, gets redirected
});

router.get('/callback', passport.authenticate('spotify', {failureRedirect: '/fail'}), function(req, res){
  // success
  console.log('successfully authenticated.', req.user);
  res.redirect('/home');
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


// /**
//  * Generates a random string containing numbers and letters
//  * @param  {number} length The length of the string
//  * @return {string} The generated string
//  */
// var generateRandomString = function(length) {
//   var text = '';
//   var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//
//   for (var i = 0; i < length; i++) {
//     text += possible.charAt(Math.floor(Math.random() * possible.length));
//   }
//   return text;
// };
//
// var stateKey = 'spotify_auth_state';
//
// router.get('/', function(req, res){
//
//   var state = generateRandomString(16);
//   res.cookie(stateKey, state);
//
//   // request authorization
//   var scope = 'user-read-private user-read-email';
//   res.redirect('https://accounts.spotify.com/authorize?' +
//     querystring.stringify({
//       response_type: 'code',
//       client_id: client_id,
//       scope: scope,
//       redirect_uri: redirect_uri,
//       state: state
//     }));
//
// });
//
// router.get('/callback', function(req, res){
//
//   var code = req.query.code || null;
//   var state = req.query.state || null;
//   var storedState = req.cookies ? req.cookies[stateKey] : null;
//
//   if (state === null || state !== storedState){
//     res.redirect('/#' + querystring.stringify({
//       error: 'state_mismatch'
//     }));
//   } else {
//     res.clearCookie(stateKey);
//     var authOptions = {
//       url: 'https://accounts.spotify.com/api/token',
//       form: {
//         code: code,
//         redirect_uri: redirect_uri,
//         grant_type: 'authorization_code'
//       },
//       headers: {
//         'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
//       },
//       json: true
//     };
//
//     request.post(authOptions, function(error, response, body){
//       if(!error && response.statusCode === 200){
//         var access_token = body.access_token;
//         var refresh_token = body.refresh_token;
//
//         var options = {
//           url: 'https://api.spotify.com/v1/me',
//           headers: {'Authorization': 'Bearer ' + access_token},
//           json: true
//         };
//
//         // use the access token to access the spotify web api
//         // request.get(options, function(error, response, body){
//         //   console.log('spotify get body:', body);
//         // });
//
//         // res.redirect('/#' + querystring.stringify({
//         //   access_token: access_token,
//         //   refresh_token: refresh_token
//         // }));
//
//         //res.sendStatus(200);
//         res.redirect('/');
//
//         console.log('auth tokens:', access_token, refresh_token);
//
//         module.exports.access_token = access_token;
//         module.exports.refresh_token = refresh_token;
//
//         // res.send({
//         //   access_token: access_token,
//         //   refresh_token: refresh_token
//         // })
//       } else {
//         res.redirect('/#' + querystring.stringify({
//           error: 'invalid_token'
//         }))
//       }
//     });
//   }
// });


module.exports.router = router;
