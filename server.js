var config = require('./config.js');

var express = require('express');
var app = express();
app.use(express.bodyParser());
app.set('view engine', 'jade');

var _ = require('lodash');
var node_path = require('path');
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


function getAbs(path)
{
	var abs = config.media;
	
	var directories = _.filter(path, function(x) { return (x !== '..' && x !== "."); });

	_.each(directories, function(x) { abs += x + '/'; });

	return abs;
}

//Todo Id3
function setInfo(item, path)
{
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

	item.stream = getStreamUrl(item.name, path);
}

function getStreamUrl(name, path)
{
	var str = '';

	_.each(path, function(x) {
		str += x + '/'
	});

	str += name;

	return '/api/stream?path=' + encodeURIComponent(str);
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

	res.send(songs);
})


/* api */
app.post('/api/list', function(req, res) { //{ path: ['','',''] }
	
	var abs = getAbs(req.body.path);

	var list = _.map(filteredReadDir(abs), 
	function(x) {
		var item = {
			isFile: !fs.lstatSync(abs + x).isDirectory(),
			name: x
		}; 

		if(item.isFile)
			setInfo(item, req.body.path);

		return item;
	});

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
