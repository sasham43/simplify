var router = require('express').Router();
var path = require('path');

router.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, '../public/views/index.html'));
});

// wildcard route to allow refreshing with angular routes
router.get('/*', function(request, response) {
  response.sendFile(path.join(__dirname, '../public/views/index.html'));
});

module.exports = router;
