var api = require('./api.js'),
	playlist = require('./playlist.js'),
	database = require('./database.js'),
	_ = require('./vendor/lodash.min.js'),
	artistBioDialog = require('./dialogs/artist-bio.js'),
	navigation = require('./library-navigation.js'),
	util = require('./util.js'),

	templates = {
		itemArtist: require('./templates/library-artist.js'),
		itemAlbum: require('./templates/library-album.js'),
	},

	$library, 
	$up, 
	$alphabetNavigation, 

	artistScrollTop = 0;

function itemDragStart(e)
{
	e.dataTransfer.setData("item", JSON.stringify($(e.srcElement).data('item')));
}


function navigateToArtist(e)
{
	e.preventDefault();

	showArtist(database.get($(this).html()));
	
	return false;
}


function showArtist(artist)
{
	artistScrollTop = $library.scrollTop();
	$library.scrollTop(0);

	$up.removeClass('hide');
	$library.html('');
	$artist.html(artist.name);

	navigation.showButtons(
		function() { artistBioDialog.show(artist); },
		function() { playlist.playSongs(database.getSongs([ artist.name ])); }
	);

	_.each(_.sortBy(artist.items, 'name'), function(x)
	{
		var cover = _.find(x.images, function(y) { return y.size === 'extralarge'; });
		x.cover = cover ? cover['#text'] : null;
		var year = new Date(x.releaseDate).getFullYear();
		x.year = isNaN(year) ? 'Unknown' : year;
		x.artist = artist.name;

		var album = $(templates.itemAlbum(x));
		$library.append(album)

		album.data('name', album.name);
	});

	hookupArtistEvents();
}

function hookupArtistEvents()
{
	$library.find('.controls .play').click(function(e) {
		e.preventDefault();

		var songs = database.getSongs([ $(this).parents('li.album').data('artist'), $(this).parents('li.album').data('name')  ])
		playlist.playSongs(songs);
	});

	$library.find('.controls .add').click(function(e) {
		e.preventDefault();

		var songs = database.getSongs([ $(this).parents('li.album').data('artist'), $(this).parents('li.album').data('name')  ])
		playlist.addSongs(songs);
	});
}

function hookupLibraryEvents() {
	$library.find('li.artist').click(function() {
		showArtist(database.get($(this).data('name')));
	});

	$library.find('.play').click(function(e) {
		e.preventDefault();
		e.stopPropagation();

		playlist.playSongs(database.getSongs([ $(this).parents('li').data('name') ]));
	});

	$library.find('.add').click(function(e) {
		e.preventDefault();
		e.stopPropagation();

		playlist.addSongs(database.getSongs([ $(this).parents('li').data('name') ]));
	});
}

function showLibrary() {
	$up.addClass('hide');
	$library.html('');
	$artist.html('Library');

	var lastLetter = null;
	$.each(database.get([]).items, function(i,x) {
		var letter = x.name.substring(0,1)
		var isThe = x.name.substring(0,4).toLowerCase() === 'the ';

		if(lastLetter !== letter && !isThe)
			$library.append('<li class="alphabet-letter" id="' + letter + '">' + letter + '</li>')

		var li = $(templates.itemArtist(x));
		$library.append(li);

		if(!isThe)
			lastLetter = x.name.substring(0,1);

		setTimeout(function() { li.addClass('enter'); }, 10);
	});

	$library.scrollTop(artistScrollTop);
	navigation.showLetters();
	hookupLibraryEvents();
}

function hookupEvents()
{
	$('body').on('click', 'a.navigate-to-artist', navigateToArtist);

	$up.click(showLibrary);
}

function initialize() {
	var deferred = $.Deferred();

	$library = $("#library");
	$up = $("#up");
	$artist = $('h2.artist');

	navigation.initialize($library);

	hookupEvents();
	showLibrary();

	deferred.resolve();
	return deferred.promise();
}

module.exports = {
	initialize: initialize
}
