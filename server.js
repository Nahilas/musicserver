var config = require('./config.js'),
	express = require('express'),
	app = express(),
	_ = require('lodash'),
	node_path = require('path'),
	fs = require('fs'),
	ffmpeg = require('fluent-ffmpeg'),
	scanner = require('./server/scanner.js'),
	auth = require('./server/auth.js');

app.use(express.bodyParser());
app.use(express.cookieParser());
app.set('view engine', 'jade');
app.configure(function() {
    app.set('views', __dirname + '/dist/views');
});

app.use('/api', function(req, res) {
	if(req.originalUrl === '/api/authenticate') {
		req.next();
		return;
	}

	var sessionId = req.cookies['x-session-id'];

	if(auth.checkSession(sessionId))
		req.next();
	else
		res.send(401);
})

app.post('/api/authenticate', function(req, res) {
	var sessionId = auth.authenticateUser(req.body.username, req.body.password);

	if(sessionId) {
		res.cookie('x-session-id', sessionId, { httpOnly: true });
		res.send({});
	}
	else
		res.send(401);
});

app.post('/api/db', function(req, res) {
	res.send(scanner.data());
});

app.get('/api/stream', function(req, res)
{
	function createStream(abs, res) {
		if(node_path.extname(abs) === '.mp3') {
			fs.createReadStream(abs).pipe(res);
			return;
		}

		var proc = new ffmpeg({ source: abs, nolog: false })
			.toFormat('mp3')
			.withAudioBitrate(config.transcode_bitrate + 'k')
		    .withAudioChannels(2)
		    .writeToStream(res);
	}

	var abs = config.media + req.query.path;

	res.setHeader('content-type', 'audio/mpeg3');
	createStream(abs, res)
});

app.get('/api/scan', function(req, res)
{
	rescan = req.query.rescan == 'true';
	scanner.scan(rescan);
	res.send(200);
});


/* client */
app.use("/styles", express.static(__dirname + '/dist/styles'));
app.use("/scripts", express.static(__dirname + '/dist/scripts'));
app.use("/fonts", express.static(__dirname + '/dist/fonts'));
app.use("/images", express.static(__dirname + '/dist/images'));

app.get('/', function(req, res) {
	res.render('index');
});

module.exports = {
	start: function() { app.listen(config.port); }
}


