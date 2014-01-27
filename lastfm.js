var config = require("./config.js");
var http = require('http');
	

function getArtist(name)
{
	http.get('http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&api_key=' + config.lastfm_apikey + '&artist=' + encodeURIComponent(name) + '&format=json', 
	function(res) {

		res.on("data", function(chunk) {
	    console.log("BODY: " + chunk);
	  });

	});
	
}

module.exports = {
	getArtist: getArtist
};