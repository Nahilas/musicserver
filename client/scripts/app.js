var navigation = require('./navigation.js');
var audiocontrols = require('./audiocontrols.js');
var library = require('./library.js');
var metadata = require('./metadata.js');

$(function() {
	library.initialize()
		.then(navigation.initialize)
		.then(metadata.initialize);
});
