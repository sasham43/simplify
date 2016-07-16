var router = require('express').Router();
var path = require('path');
var request = require('request');

router.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '../public/views/index.html'));
});



// wildcard route to allow refreshing with angular routes
router.get('/*', function(req, res) {
  res.sendFile(path.join(__dirname, '../public/views/index.html'));
});

module.exports = router;
