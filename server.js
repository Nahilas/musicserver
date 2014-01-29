var config = require('./config.js');
var express = require('express');
var app = express();
app.use(express.bodyParser());
app.set('view engine', 'jade');
var _ = require('lodash');
var node_path = require('path');
var fs = require('fs');
var q = require('q');
var ffmpeg = require('fluent-ffmpeg');
var probe = require('node-ffprobe');
var scanner = require('./scanner.js');
var lastfm = require('./lastfm.js');

function userValid(request) {
	return true;
}

function getAbs(path)
{
	var abs = config.media;
	
	var directories = _.filter(path, function(x) { return (x !== '..' && x !== "."); });

	_.each(directories, function(x) { abs += x + '/'; });

	return abs;
}

function setInfo(item, path)
{
	if(item.isFile) {
		if(path.length < 2)
		{
			item.song = item.name;
			item.album = 'NA';
			item.artist = 'NA';
		}
		if(path.length === 2)
		{
			item.artist = path[0];
			item.album = path[1];
			item.song = item.name;

		} 
		if(path.length >= 3)
		{
			item.artist = path[0];
			item.album = path[1];
			item.song = item.name;
			
			for(var i = 2; i < path.length; i++)
			{
				item.album += ' - ' + path[i];
			}
		}

		var str = '';
		_.each(path, function(x) {
			str += x + '/'
		});
		str += item.name;
		item.stream = '/api/stream?path=' + encodeURIComponent(str);
	}

	scanner.setInfo(item, path);
}

function filteredReadDir(abs)
{
	return _.filter(fs.readdirSync(abs), function(x) {
		if(x.substring(0,1) === '.')
			return false;

		var isDir = fs.lstatSync(abs + x).isDirectory();

		if(isDir)
			return true;

		var ext = node_path.extname(x);

		var found = false;
		_.each(config.filetypes, function(y) {
			if(y.toLowerCase() == ext.toLowerCase()) {
				found = true;
				return;
			}
		});

		return found;
	});	
}

app.post('/api/listsongs', function(req, res)
{
	var songs = [];

	var getSongs = function(path) {
		var abs = getAbs(path);

		_.each(filteredReadDir(abs), function(x) {

			if(fs.lstatSync(abs + x).isDirectory())
			{
				var newPath = _.clone(path);
				newPath.push(x);

				getSongs(newPath);
				return;
			}

			var song = {
				isFile: true,
				name: x,
			};
			setInfo(song, path);
			songs.push(song);
		});
	}

	getSongs(req.body.path);

	if(songs.length > 0) {
		var grouped = [];
		_.each(_.groupBy(songs, 'album'), function(x, p) { grouped.push(_.sortBy(x, 'track')) });

		var album = grouped.pop();
		var songs = album.concat.apply(album, grouped);
	}

	res.send(songs);
});

function getParent(path)
{
	if(path.length < 1) //no parent
		return null;

	var cloned = _.clone(path);

	var item = { isFile: false, name: cloned.pop() };
	setInfo(item, cloned);

	return item;
}

/* api */
app.post('/api/list', function(req, res) { //{ path: ['','',''] }
	
	var abs = getAbs(req.body.path);
	var expand = req.body.expand;

	var list = _.map(filteredReadDir(abs), 
	function(x) {
		var item = {
			isFile: !fs.lstatSync(abs + x).isDirectory(),
			name: x
		}; 

		if(expand)
			setInfo(item, req.body.path);

		return item;
	});

	var grouped = _.groupBy(list, 'isFile');
	grouped.false = grouped.false || [];
	grouped.true = grouped.true || [];

	res.send({
		parent: getParent(req.body.path),
		items: grouped.false.concat(_.sortBy(grouped.true, 'track'))
	});	
});

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

app.get('/api/stream', function(req, res)
{
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
app.use("/styles", express.static(__dirname + '/styles'));
app.use("/scripts", express.static(__dirname + '/scripts'));
app.use("/fonts", express.static(__dirname + '/fonts'));

app.get('/', function(req, res) {
	res.render('index');
});

app.listen(config.port);
