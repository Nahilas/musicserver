var config = require('./config.js');

var express = require('express');
var app = express();
app.use(express.bodyParser());

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

app.post('/api/stream', function(req, res)
{
	abs = getAbs(req);
	abs = abs.substring(0, abs.length - 1);

	res.setHeader('content-type', 'audio/mpeg3');
    fs.createReadStream(abs).pipe(res);
});

app.listen(config.port);
