var dialog = require('./dialog.js'),
	_ = require('./../vendor/lodash.min.js'),
	bioDialog,
	template = require('./../templates/dialog-artist-bio.js'),
	library = require('./../library.js'),
	deferred,
	api = require('./../api.js');



function getImage(artist)
{
	var image = _.find(artist.images, function(x) { return x.size === 'large'; });
	if(image)
		image = image['#text'];

	return image;
}


function getSimilarList(artist)
{
	_.each(artist.similar, function(x) {
		var libraryArtist = library.get([ x.name ], true);

		if(libraryArtist) {
			x.isLastFM = false;
			x.name = libraryArtist.name; //Use name from library
		}
		else
			x.isLastFM = true;
	});

	return _.sortBy(artist.similar, 'isLastFM');
}

function animate() {
	var tl = new TimelineLite();

	var items = bioDialog.element().find('.album-item').toArray();
	items.unshift(bioDialog.element().find('h3'));

	tl.staggerTo(items, 1, { opacity: 1 }, 0.3);
	TweenLite.to(bioDialog.element().find('img'), 0.3, { opacity: 1 });
	TweenLite.to(bioDialog.element().find('.summary'), 0.5, { marginLeft: '0%', ease: Power2.easeOut });
	TweenLite.to(bioDialog.element().find('.similar'), 0.5, { marginLeft: '0%', ease: Power2.easeOut });

	tl.resume();
}

function show(artist) 
{
	artist.image = getImage(artist);
	artist.similar = getSimilarList(artist);
	bioDialog = new dialog(template(artist));

	bioDialog.show().then(animate);
	
	initialize();
}

function initialize() {
	bioDialog.element().css('height', 'auto');
	bioDialog.element().find('button').click(bioDialog.hide);
	bioDialog.element().find('a.navigate-to-artist').click(bioDialog.hide);
	bioDialog.element().find('a').attr('target', '_blank');
}


module.exports = {
	show: show
}