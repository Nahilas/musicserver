var api = require('./api.js');
var playlist = require('./playlist.js');
var library = require('./library.js');
var _ = require('./vendor/lodash.min.js');
var letters = [];
var templates = {
	itemDefault: require('./templates/navigation-default.js'),
	itemAlbum: require('./templates/navigation-album.js')
};

var $list, $up, $alphabetNavigation, currentPath = [], outerScroll = 0;
$(function() {
	$list = $("#list");
	$up = $("#up");
	$artist = $('h2.artist');
	$alphabetNavigation = $('#alphabet-navigation');

	$list.on('click', 'li', function() {
		var path = $(this).data('path');

		if(path.length === 1)
			navigate(path);
	});

	$list.on('dblclick', 'li', function() {
		var path = $(this).data('path');

		if(path.length !== 1)
			play(path);
	});

	$list.on('click', '.add', function(e) {
		e.stopPropagation();
		add($(this).parents('li').data('path'));
	});

	$list.on('click', '.play', function(e) {
		e.stopPropagation();
		play($(this).parents('li').data('path'));
	});

	$list.scroll(onScroll);

	$up.click(up);
});

function add(path, before)
{
	playlist.addSongs(library.getSongs(path), before);
}



function play(path)
{
	playlist.playSongs(library.getSongs(path));
}

function itemDragStart(e)
{
	e.dataTransfer.setData("item", JSON.stringify($(e.srcElement).data('item')));
}


function up() {
	if(currentPath.length === 0)
		return;

	currentPath.pop();

	if(currentPath.length === 0)
		$up.addClass('hide');


	populateList(currentPath);
}

function navigate(path)
{
	$up.removeClass('hide');
	populateList(path);
}

function setBreadcrumb() {
	var str = "";
	$.each(currentPath, function(i,x) { str += x + "/"; });
	$breadcrumb.html(str.substring(0, str.length - 1));
}

function renderDefault(item, path, showAlphabet)
{
	var lastLetter = null;
	$.each(_.sortBy(item.items, 'name'), function(i,x) {
		var letter = x.name.substring(0,1)

		if(showAlphabet && lastLetter !== letter)
			$list.append('<li class="alphabet-letter" id="' + letter + '">' + letter + '</li>')

		var li = $(templates.itemDefault(x));
		$list.append(li);

		var itemPath = path.slice(0);
		itemPath.push(x.name);
		$(li).data('path', itemPath);

		lastLetter = x.name.substring(0,1);
		setTimeout(function() { li.addClass('enter'); }, 10);
	});
}

function renderArtist(item, path)
{
	_.each(item.items, function(x)
	{
		var cover = _.find(x.images, function(y) { return y.size === 'large'; });
		x.cover = cover ? cover['#text'] : null;

		var album = $(templates.itemAlbum(x));
		$list.append(album)

		var albumPath = path.slice(0);
		albumPath.push(x.name);
		album.data('path', albumPath);

		renderDefault(x, albumPath.slice(0));

		setTimeout(function() { album.find('.row').addClass('enter'); }, 10);
	});
}

function onScroll() {
	console.log('Scrolled-to: ' + $(this).scrollTop());
}

function initializeScrollSpy()
{
	letters = [];
	$list.find('.alphabet-letter').each(function(i,x) 
	{
		letters.push({
			id: $(x).attr('id'),
			top: $(x).offset().top
		});
	});

	console.log(letters);
}

function populateList(path)
{
	$list.html('');

	path = path || [];
	currentPath = path;

	$artist.html(path.length === 0 ? 'Library' : path[0])
	$list.scrollTop(0);

	if(currentPath.length === 1)
		renderArtist(library.get(currentPath), currentPath.slice(0));
	else
		renderDefault(library.get(currentPath), currentPath.slice(0), true);

	initializeScrollSpy();
}

function initialize() {
	populateList();
}

module.exports = {
	itemDragStart: itemDragStart,
	add: add,
	populate: populateList,
	initialize: initialize
}
