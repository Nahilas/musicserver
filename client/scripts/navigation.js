var api = require('./api.js');
var playlist = require('./playlist.js');
var library = require('./library.js');
var _ = require('./vendor/lodash.min.js');
var artistBioDialog = require('./dialogs/artist-bio.js');
var letters = [];
var templates = {
	itemDefault: require('./templates/navigation-default.js'),
	itemAlbum: require('./templates/navigation-album.js')
};

var $list, 
	$up, 
	$alphabetNavigation, 
	currentPath = [], 
	outerScroll = 0;

$(function() {
	$list = $("#list");
	$up = $("#up");
	$artist = $('h2.artist');
	$alphabetNavigation = $('#alphabet-navigation');

	$list.on('click', 'li', function() {
		var path = $(this).data('path');

		if(path && path.length === 1)
			navigate(path);
	});

	$list.on('dblclick', 'li', function() {
		var path = $(this).data('path');

		if(path && path.length !== 1)
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
	$('.artist-bio').click(function(e) {
		e.preventDefault();

		artistBioDialog.show(item);
	});

	_.each(item.items, function(x)
	{
		var cover = _.find(x.images, function(y) { return y.size === 'extralarge'; });
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
	updateSpy();
}

var deselectLetter = function(letter) 
{
	letter.removeClass('active');
	new TweenLite.to(letter, 0.2, { color: '#666', backgroundColor: '#ddd', ease: Power2.easeInOut });
}

var selectLetter = function(letter)
{
	letter.addClass('active');
	new TweenLite.to(letter, 0.2, { color: '#fff', backgroundColor: '#663366', ease: Power2.easeInOut });
}

var updateSpy = _.throttle(function() {
	//Find the on larger than current scroll
	var currScroll = $list.scrollTop() - 70;

	for(var i = 0, l = letters.length; i < l; i++) {
		if(letters[i].top > currScroll)
		{
			var index = i - 1;

			if(index < 0)
				index = 0;

			var alphabetLetter = $alphabetNavigation.find('.letter[data-id="' + letters[index].id + '"]');
			var current = $alphabetNavigation.find('.letter.active');

			if(current.data('id') !== alphabetLetter.data('id')) {
				deselectLetter(current);
				selectLetter(alphabetLetter);
			}
			break;
		}
	}
}, 100);

function initializeScrollSpy()
{
	letters = [];
	$list.find('.alphabet-letter').each(function(i,x) 
	{
		letters.push({
			id: $(x).attr('id'),
			top: $(x).position().top - $(x).height() - 30,
			positionY: $(x).position().top + 15
		});
	});

	//render navigation
	$alphabetNavigation.html('');

	var letterPercent = 100 / letters.length;
	_.each(letters, function(x) { 
		var l = '<div class="letter" style="width: ' + letterPercent + '%" data-id="' + x.id + '">' + x.id + '</div>';

		$alphabetNavigation.append(l);
	});


	$alphabetNavigation.find('.letter').click(function() {
		var id = $(this).data('id');
		var l = _.find(letters, function(x) { return x.id === id; });

		if(l)
			$list.scrollTop(l.positionY);
	});

	$list.scroll(onScroll);

	updateSpy();
}

function populateList(path)
{
	$list.html('');

	path = path || [];
	currentPath = path;

	$artist.html(path.length === 0 ? 'Library' : path[0])
	$list.scrollTop(0);

	if(currentPath.length === 1) {
		$alphabetNavigation.html('<a class="pull-right artist-bio" href="#"><span class="glyphicon glyphicon-user"></span>&nbsp;Artist bio...</a>');
		renderArtist(library.get(currentPath), currentPath.slice(0));
	}
	else 
	{
		renderDefault(library.get(currentPath), currentPath.slice(0), true);
		initializeScrollSpy();
	}

	
}

function initialize() {
	var deferred = $.Deferred();

	populateList();
	deferred.resolve();

	return deferred.promise();
}

module.exports = {
	itemDragStart: itemDragStart,
	add: add,
	populate: populateList,
	initialize: initialize
}
