var $metadata,
	library = require('./library.js');

function initialize() {
	$metadata = $("#metadata");
	var meta = library.getMetaData();

	$metadata.html('Library: ' + meta.albums + ' albums, ' + meta.songs + ' songs, ' + meta.duration.toFixed(1) + ' hours');
	
}

module.exports = {

	initialize: initialize

};