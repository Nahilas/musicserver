var $metadata,
	database = require('./database.js');

function initialize() {
	$metadata = $("#metadata");
	var meta = database.getMetaData();

	$metadata.html('Library: ' + meta.albums + ' albums, ' + meta.songs + ' songs, ' + meta.duration.toFixed(1) + ' hours');
	
}

module.exports = {

	initialize: initialize

};