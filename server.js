var config = require('./config.js');

var express = require('express');
var app = express();
app.use(express.bodyParser());
app.set('view engine', 'jade');

var path = require('path');
var _ = require('lodash');

var fs = require('fs');

function userValid(request) {
	return true;
}
//routes 
/*app.get('*', function(req, res) {
	if(userValid(req)) {
		req.next();
		return;
	}
	
	res.send(401);
});*/


function getAbs(req)
{
	var abs = config.media;
	
	var directories = _.filter(req.body.path, function(x) { return (x !== '..' && x !== "."); });

	_.each(directories, function(x) { abs += x + '/'; });

	return abs;
}


/* api */
app.post('/api/list', function(req, res) { //{ path: ['','',''] }
	
	var abs = getAbs(req);

	var list = _.map(
		_.filter(fs.readdirSync(abs), function(x) { return x.substring(0,1) !== '.'; }), 
		function(x) {
		return {
			isFile: !fs.lstatSync(abs + x).isDirectory(),
			name: x
		}; });

	res.send(list);
});

app.get('/api/stream', function(req, res)
{
	var abs = config.media + req.query.path;

	res.setHeader('content-type', 'audio/mpeg3');
    fs.createReadStream(abs).pipe(res);
});


/* client */
app.use("/styles", express.static(__dirname + '/styles'));
app.use("/scripts", express.static(__dirname + '/scripts'));

app.get('/', function(req, res) {
	res.render('index');
});


app.listen(config.port);
