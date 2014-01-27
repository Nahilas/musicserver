var config = require('./config.js');
var fs = require('fs');
var _ = require('lodash');
var node_path = require('path');
var ffprobe = require('node-ffprobe');
var q = require('q');

var db = [], fileCount = 0, probedCount = 0;
var cache = null;

function scan() {
	console.log("Scan initiated");

	fileCount = 0;
	probedCount = 0;
	db = [];

	filescandb()
		.then(savedb)
		.then(probedb)
		.then(savedb)
		.then(function() {
			console.log("Scan completed");
			cache = null; //invalidate cache
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
			var item = {
				name: x,
				isFile: true
			};

			if(fs.lstatSync(dir + '/' + x).isDirectory())
			{
				item.items = [];
				item.isFile = false;
				scanDir(dir + '/' + x, item.items)
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
			if(x.isFile) {
				var d = q.defer();
				promises.push(d.promise);
				queue.push(function() { runprobe(x, path + '/' + x.name, d); });
			}
			else
				probe(x.items, path + '/' + x.name);
		});
	}
	probe(db, '');
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