var dialog = require('./dialog.js'),
	bioDialog,
	template = require('./../templates/dialog-artist-bio.js'),
	deferred,
	api = require('./../api.js');



function show(artist) 
{
	bioDialog = new dialog(template(artist));

	bioDialog.show();
	
	initialize();
}

function initialize() {
	bioDialog.element().css('height', 'auto');
	bioDialog.element().find('button').click(bioDialog.hide);
	bioDialog.element().find('a').attr('target', '_blank');
}


module.exports = {
	show: show
}