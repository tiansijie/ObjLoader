var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');

var app = express();

var port = 3001;
var publicPath = path.resolve(__dirname, "public");

app.use(bodyParser.text());

// We point to our static assets
app.use(express.static(publicPath));

// And run the server
app.listen(port, function () {
  console.log('Server running on port ' + port);
});
