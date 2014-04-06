var library = require('./library.js'),
	audiocontrols = require('./audiocontrols.js'),
	database = require('./database.js'),
	metadata = require('./metadata.js'),
	responsive = require('./responsive.js'),
	login = require('./dialogs/login.js');


$(function() {

	//Show login dialog
	login.show()
		.then(database.initialize)
		.then(library.initialize)
		.then(metadata.initialize)
		.then(responsive.initialize);
});
