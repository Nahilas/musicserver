var config = require("./config.js");
var http = require('http');
var q = require('q');

function getArtist(name)
{	
	var deferred = q.defer();

	http.get('http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&api_key=' + config.lastfm_apikey + '&artist=' + name + '&format=json', 
	function(res) {
		var responseData = "";
		res.on("data", function(data) 
		{
			responseData += data;
		});

		res.on("end", function() {
			deferred.resolve(JSON.parse(responseData).artist);
		});
	});
	
	return deferred.promise;
}

function getAlbum(name, artist)
{	
	var deferred = q.defer();
	
	http.get('http://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=' + config.lastfm_apikey + '&artist=' + encodeURIComponent(artist) + '&album=' + encodeURIComponent(name) + '&format=json', 
	function(res) {
		var responseData = "";
		res.on("data", function(data) 
		{
			responseData += data;
		});

		res.on("end", function() {
			deferred.resolve(JSON.parse(responseData).album);
		});
	});
	
	return deferred.promise;
}


module.exports = {
	getArtist: getArtist,
	getAlbum: getAlbum
};