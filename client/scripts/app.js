var navigation = require('./navigation.js'),
	audiocontrols = require('./audiocontrols.js'),
	library = require('./library.js'),
	metadata = require('./metadata.js'),
	responsive = require('./responsive.js'),
	login = require('./dialogs/login.js');


$(function() {

	//Show login dialog
	login.show()
		.then(library.initialize)
		.then(navigation.initialize)
		.then(metadata.initialize)
		.then(responsive.initialize);
});
