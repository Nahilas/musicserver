var navigation = require('./navigation.js');
var audiocontrols = require('./audiocontrols.js');
var library = require('./library.js');

$(function() {
	library.initialize().then(navigation.initialize);
});
