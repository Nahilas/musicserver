var config = require('./config.js');
var fs = require('fs');
var _ = require('lodash');
var node_path = require('path');
var ffprobe = require('node-ffprobe');
var q = require('q');
var lastfm = require('./lastfm.js');

var db = [], fileCount = 0, probedCount = 0;
var cache = null, scanning = false;

function scan(rescan) {
	if(scanning)
		return;

	console.log("Scan initiated");

	fileCount = 0;
	probedCount = 0;

	if(rescan)
		db = [];
	else {
		cache = null;
		loadcache();
		db = _.clone(cache);
	}

	scanning = true;
	
	filescandb()
		.then(savedb)
		.then(probedb)
		.then(savedb)
		.then(scrobbledb)
		.then(savedb)
		.then(function() {
			console.log("Scan completed");
			cache = null; //invalidate cache
			scanning = false;
		});
}

function filescandb() {
	console.log("Scanning filesystem");
	var deferred = q.defer();

	function scanDir(dir, content)
	{
		var dirContent = fs.readdirSync(dir);
		var dirlen = dirContent.length;
		_.each(dirContent, function(x,i) {
			if(x.substring(0,1) === '.')
				return;

			var cachedItem = _.find(content, function(y) { return y.name === x; });

			var item = cachedItem || {
				name: x,
				isFile: true,
				probed: false,
				scrobbled: false
			};

			if(fs.lstatSync(dir + '/' + x).isDirectory())
			{
				item.items = item.items || [];
				item.isFile = false;
				scanDir(dir + '/' + x, item.items)

				if(!cachedItem)
					content.push(item)
			}
			else
			{   //only add allowed file types
				var ext = node_path.extname(x);

				var found = false;
				_.each(config.filetypes, function(y) {
					if(y.toLowerCase() == ext.toLowerCase()) {
						found = true;
						return;
					}
				});

				if(found) {
					if(!cachedItem)
						content.push(item);

					fileCount++;
				}
			}
		});
	}

	scanDir(config.media, db);
	deferred.resolve();

	return deferred.promise;
}

function probedb() {
	console.log("Probing");
	var queue = [];
	var promises = [];

	function runprobe(item, path, deferred)
	{
		ffprobe(config.media + path, function(error, probeData) 
		{
			if(!error) {
				item.duration = probeData.format.duration;
				var title = probeData.metadata.title || probeData.metadata.TITLE;

				item.song = title ? title : item.name;
				item.track = probeData.metadata.track ? probeData.metadata.track : '';
			} 

			item.probed = true;
			probedCount++;

			console.log('Probed ' + probedCount + '/' + fileCount);

			if(queue.length > 0)
				queue.pop()();

			deferred.resolve();
		});		
	}

	function probe(items, path)
	{
		_.each(items, function(x) {
			if(x.isFile && !x.probed) {
				var d = q.defer();
				promises.push(d.promise);
				queue.push(function() { runprobe(x, path + '/' + x.name, d); });
			}
			else
				probe(x.items, path + '/' + x.name);
		});
	}
	probe(db, '');

	if(queue.length > 0)
		queue.pop()();
	
	return q.all(promises);
}

function savedb()
{
	var deferred = q.defer();

	console.log("Saving db");
	fs.writeFile('.db', JSON.stringify(db));

	deferred.resolve();
	return deferred.promise;
}

function loadcache()
{
	if(cache === null)
		try {
			cache = JSON.parse(fs.readFileSync('.db'));
		}catch(e) { cache = []; }
}

function scrobbledb() {
	var queue = [];

	console.log("Scrobbling");

	var deferred = q.defer();

	_.each(db, function(item) {
		if(!item.scrobbled)
		{
			queue.push(function() {
				lastfm.getArtist(item.name).then(function(artist) {
					try {
						if(!artist)
						{
							console.log(artist.name + " not found")
						}
						else {
							console.log(artist.name + " scrobbled");
							item.summary = artist.bio.summary;
							item.images = artist.image;
							item.scrobbled = true;	
						}
						
					}
					catch(e)
					{
						console.log('Error scrobbling "' + item.name + '" - ' + e);
					}
					
					if(queue.length > 0)
						queue.pop()();
					else
						deferred.resolve();
				});
			});
		}

		_.each(item.items, function(subItem) {
			if(subItem.scrobbled)
				return;

			queue.push(function() {

				lastfm.getAlbum(subItem.name, item.name).then(function(album) {
					try {
						if(!album)
						{
							console.log(item.name + " - " + subItem.name + " not found")
						}
						else {
							console.log(subItem.name + " scrobbled");
							subItem.images = album.image;
							subItem.scrobbled = true;
						}
					}
					catch(e)
					{
						console.log('Error scrobbling "' + subItem.name + '" - ' + e);
					}
					
					if(queue.length > 0)
						queue.pop()();
					else
						deferred.resolve();
				});

			});
			
		});
	});

	if(queue.length > 0)
		queue.pop()();
	else
		deferred.resolve();

	return deferred.promise;
}

function setInfo(item, path)
{
	loadcache();
	var clonedPath = _.clone(path);
	clonedPath.push(item.name);

	var foundItem = null;
	function get(list) {
		if(!list)
			return;

		var p = clonedPath.splice(0,1);
		var i = _.find(list, function(x) {  return x.name == p }); 

		if(i && clonedPath.length > 0)
			get(i.items);
		else if(i)
			foundItem = i;
	}
	
	get(cache);

	if(foundItem) {
		item = _.merge(item, foundItem);
	}
}


module.exports = {
	scan: scan,
	setInfo: setInfo
};