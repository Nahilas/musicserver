(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var db = function()
{
	return $.ajax({
		method: 'POST',
		url: '/api/db',
		cache: false,
		contentType: 'application/json',
		processData: false,
		dataType: 'json'
	});
}

var authenticate = function(username, password)
{
	return $.ajax({
		method: 'POST',
		url: '/api/authenticate',
		cache: false,
		contentType: 'application/json',
		data: JSON.stringify({ username: username, password: password }),
		processData: false,
		dataType: 'json'
	});
}


module.exports = {
	db: db,
	authenticate: authenticate
};

},{}],2:[function(require,module,exports){
var util = require('./util.js'),
	audioplayer = require('./audioplayer.js'),
	playlist = require('./playlist.js'),
	library = require('./library.js'),
	$progress, 
	$duration, 
	$position, 
	$song, 
	$artist, 
	$album, 
	$pause, 
	$next, 
	$prev,
	$cover,
	$content,
	$logo;

$(function() {
	$progress = $("#progress .indicator");
	$duration = $("#duration");
	$position = $("#position");
	$song = $("#song");
	$artist = $("#artist");
	$album = $("#album");
	$pause = $("#pause");
	$next = $("#next");
	$prev = $("#prev");
	$cover = $("#cover");
	$content = $("#player .content");
	$logo = $("#player .logo");

	audioplayer.played.add(onPlayed);
	audioplayer.updated.add(onUpdated);
	audioplayer.paused.add(onPaused);
	audioplayer.resumed.add(onResumed);

	hookupEvents();
});

function onPaused() {
	$pause.removeClass('playing');
}

function onResumed()
{
	$pause.addClass('playing');
}

function setText(item)
{
	$song.html(item.song);
	$artist.html(item.artist);
	$album.html(item.album);
	$cover.attr('src', library.getCover(item.artist, item.album, 'large'));
}

function onPlayed(item) {
	var tl = new TimelineLite();

	if($content.hasClass('hide')) //animate logo
	{

		tl.to($logo, 0.5, { rotationY: '90deg', onComplete: function() {
			$logo.addClass('hide');
			$content.removeClass('hide');
		} });
		tl.fromTo($content, 0.5, { rotationY: '-90deg' }, { rotationY: '0deg' });

		setText(item);
	}
	else { //animate next song
		tl.to([$song, $artist, $cover, $album], 0.25, { opacity: 0, onComplete: function() {
			setText(item);
		} });
		tl.to([$song, $artist, $cover, $album], 0.25, { opacity: 1 });
	}

	tl.resume();

	$pause.addClass('playing');
};


function onUpdated(duration, current, percent)
{
	$progress.css("width", percent + "%");
	$position.html(util.secondsToTime(current));
	$duration.html(util.secondsToTime(duration));
}

function hookupEvents() {
	$pause.click(function() {
		if(!audioplayer.isPlaying())
			audioplayer.play();
		else
			audioplayer.pause();
	});

	$next.click(function() { playlist.next(); });
	$prev.click(function() { playlist.prev(); });
}

module.exports = {};
},{"./audioplayer.js":3,"./library.js":7,"./playlist.js":10,"./util.js":16}],3:[function(require,module,exports){
var $jPlayer, 
	isPlaying = false, 
	currentItem = null,
	signals = require('./vendor/signals.min.js'),
	audioplayer = {
		played: new signals.Signal(),
		paused: new signals.Signal(),
		resumed: new signals.Signal(),
		updated: new signals.Signal(),
		ended: new signals.Signal(),
		play: play,
		pause: pause,
		isPlaying: function() { return isPlaying; }
	};

$(function() {
	$jPlayer = $("#jPlayer");
	
	$jPlayer.jPlayer({ 
		supplied: 'mp3',
		timeupdate: updated,
		ended: function() {
			playing = false;
			audioplayer.ended.dispatch();
		}
	});
});

function updated(e) {
	var duration = e.jPlayer.status.duration === 0 ? currentItem.duration : e.jPlayer.status.duration;
	var current = e.jPlayer.status.currentTime;
	var percent = (current / duration) * 100;

	audioplayer.updated.dispatch(duration, current, percent);
}

function play(item)
{
	if(item) {
		isPlaying = true;
		currentItem = item;
		$jPlayer.jPlayer("setMedia", {
			mp3: item.stream
		});

		$jPlayer.jPlayer("play");
		audioplayer.played.dispatch(item);
	}
	else if(currentItem)
	{
		isPlaying = true;
		audioplayer.resumed.dispatch(item);
		$jPlayer.jPlayer("play");
	}
}

function pause()
{
	isPlaying = false;
	$jPlayer.jPlayer("pause");
	audioplayer.paused.dispatch();
}


module.exports = audioplayer;
},{"./vendor/signals.min.js":21}],4:[function(require,module,exports){
module.exports = function(content) {
	var $main, 
		$dialog,
		$element;

	function initialize() 
	{
		$main = $('#main');
	}

	function show() 
	{
		initialize();

		$dialog = $('<div class="dialog"><div class="content"></div></div>');
		$dialog.insertAfter($main);

		$element = $dialog.find(".content");
		$element.html(content);

		return animateShow();
	}

	function animateShow() {
		var deferred = $.Deferred();
		
		var anim = TweenLite.fromTo($element, 
			0.5, 
			{ scaleX: 0, scaleY: 0 }, 
			{ scaleX: 1, scaleY: 1, ease: Power2.easeInOut, onComplete: function() { deferred.resolve(); } });

		return deferred.promise();
	}

	function animateHide() {
		var deferred = $.Deferred();
		
		TweenLite.fromTo($element, 
			0.3, 
			{ scaleX: 1, scaleY: 1 }, 
			{ scaleX: 0, scaleY: 0, ease: Power2.easeInOut, onComplete: function() { deferred.resolve(); } });

		TweenLite.to($dialog, 0.3, { opacity: 0 });

		return deferred.promise();
	}

	function hide()
	{
		var deferred = $.Deferred();

		animateHide().then(function() {
			$dialog.remove();	
			deferred.resolve();
		});
		
		return deferred.promise();
	}

	function shake() {
		var tl = new TimelineLite();

		tl.to($element, 0.05, {left: "-=25"});
		tl.to($element, 0.05, {left: "+=50"});
		tl.to($element, 0.05, {left: "-=50"});
		tl.to($element, 0.05, {left: "+=50"});
		tl.to($element, 0.05, {left: "-=50"});
		tl.to($element, 0.05, {left: "+=25"});

		tl.resume();
	}

	return {
		show: show,
		hide: hide,
		shake: shake,
		element: function() { return $element; }
	}
};



},{}],5:[function(require,module,exports){
var dialog = require('./dialog.js'),
	loginDialog,
	template = require('./../templates/dialog-login.js'),
	deferred,
	$form,
	$logo,
	$title,
	api = require('./../api.js');


function show() {
	deferred = $.Deferred();
	loginDialog = dialog(template({
		username: $.cookie('username'),
		password: $.cookie('password')
	}));

	loginDialog.show()
	initialize();
	
	return deferred.promise();
}


function submit() {
	var username = $(this).find('input[name="username"]').val();
	var password = $(this).find('input[name="password"]').val();

	if(username.length === 0 || password.length === 0) {
		wrongCredentials();
		return;
	}

	api.authenticate(username, password)
		.done(loggedIn)
		.fail(wrongCredentials);
}

function wrongCredentials() {
	loginDialog.shake();
}

function loggedIn()
{
	saveCredentials();
	loginDialog.hide().then(deferred.resolve);
}

function animateLogo() {
	TweenLite.to($logo, 1.5, {opacity: 1});
	TweenLite.from($logo, 1.5, {rotationY: '90deg'});

	TweenLite.from($title, 1.5, {rotationY: '90deg'});
	TweenLite.to($title, 1.5, {opacity: 1});
}

function saveCredentials()
{
	var rememberMe = $form.find('input[name="rememberMe"]').is(':checked');

	if(rememberMe)
	{
		$.cookie('username', $form.find('input[name="username"]').val(), { expires: 9999 });
		$.cookie('password', $form.find('input[name="password"]').val(), { expires: 9999 });	
	}
	else 
	{
		$.removeCookie('username');
		$.removeCookie('password');
	}
}

function initialize() {
	$form = loginDialog.element().find('form');
	$logo = loginDialog.element().find('img');
	$title = loginDialog.element().find('h2');

	if($.cookie('username'))
		$form.find('input[name="rememberMe"]').prop('checked', true);

	$form.submit(function(e) {
		e.preventDefault();

		submit.call(this);

		return false;
	});

	animateLogo();
}

module.exports = {
	show: show
};
},{"./../api.js":1,"./../templates/dialog-login.js":12,"./dialog.js":4}],6:[function(require,module,exports){
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

},{"./audiocontrols.js":2,"./dialogs/login.js":5,"./library.js":7,"./metadata.js":8,"./navigation.js":9,"./responsive.js":11}],7:[function(require,module,exports){

var database,
	_ = require('./vendor/lodash.min.js');
	api = require('./api.js');

	function initialize() {
		var deferred = $.Deferred();

		api.db().done(function(db) {
			database = {items: db};
			deferred.resolve();
		});

		return deferred.promise();
	}


	function get(path)
	{
		if(!path || path.length === 0)
			return database;
		
		var item = database; 
		_.each(path, function(x) {
			item = _.find(item.items, function(y) { return y.name === x; });
		});

		return item;
	}

	//Artist and album can be extrapolated from path.
	function setSongInfo(item, path) {
		if(path.length < 2)
		{
			if(!item.song)
				item.song = item.name;
			item.album = 'NA';
			item.artist = 'NA';
		}
		if(path.length === 2)
		{
			item.artist = path[0];
			item.album = path[1];
			if(!item.song)
				item.song = item.name;
		} 
		if(path.length >= 3)
		{
			item.artist = path[0];
			item.album = path[1];
			
			if(!item.song)
				item.song = item.name;
			
			for(var i = 2; i < path.length; i++)
			{
				item.album += ' - ' + path[i];
			}
		}

		var str = '';
		_.each(path, function(x) {
			str += x + '/'
		});
		str += item.name;
		item.stream = '/api/stream?path=' + encodeURIComponent(str);
	}

	function getMetaData() {
		var albumCount = 0;
		var totalDuration = 0.0;
		var songCount = 0;

		_.each(database.items, function(x) {
			albumCount += x.items.length;

			var songs = getSongs([x.name]);
			songCount += songs.length;

			_.each(songs, function(y) {
				if(isNaN(y.duration))
					return;

				totalDuration += parseFloat(y.duration);
			});
		});

		return {
			albums: albumCount,
			songs: songCount,
			duration: (totalDuration / 60) / 60
		};
	}

	function getCover(artist, album, size) {
		var album = _.find(_.find(database.items, function(x) { return x.name === artist; }).items, function(x) { return x.name === album; });
		var cover = _.find(album.images, function(y) { return y.size === size; });

		if(cover && cover['#text'] !== '')
		{
			return cover['#text'];
		}		

		return '/images/no-cover.png';
	}

	function getSongs(path)
	{
		var songs = [];

		var getSongsRecursive = function(item, currPath) {
			if(item.isFile)
			{
				currPath.pop();
				setSongInfo(item, currPath);
				songs.push(item)

				return;
			}

			_.each(item.items, function(x) {
				if(x.isFile) {
					setSongInfo(x, currPath);
					songs.push(x);
				} 
				else 
				{
					nextPath = currPath.slice(0);
					nextPath.push(x.name)
					getSongsRecursive(x, nextPath);
				}
			});
		}

		getSongsRecursive(get(path), path.slice(0));

		if(songs.length > 0) {
			var grouped = [];
			_.each(_.groupBy(songs, 'album'), function(x, p) { grouped.push(_.sortBy(x, 'track')) });

			var album = grouped.pop();
			var songs = _.sortBy(album.concat.apply(album, grouped), 'album');
		}

		return songs;
	}

module.exports = {
	initialize: initialize,
	get: get,
	getSongs: getSongs,
	getMetaData: getMetaData,
	getCover: getCover
};

},{"./api.js":1,"./vendor/lodash.min.js":18}],8:[function(require,module,exports){
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
},{"./library.js":7}],9:[function(require,module,exports){
var api = require('./api.js');
var playlist = require('./playlist.js');
var library = require('./library.js');
var _ = require('./vendor/lodash.min.js');
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

	if(currentPath.length === 1)
		renderArtist(library.get(currentPath), currentPath.slice(0));
	else
		renderDefault(library.get(currentPath), currentPath.slice(0), true);

	initializeScrollSpy();
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

},{"./api.js":1,"./library.js":7,"./playlist.js":10,"./templates/navigation-album.js":13,"./templates/navigation-default.js":14,"./vendor/lodash.min.js":18}],10:[function(require,module,exports){
var audioplayer = require('./audioplayer.js'),
	api = require('./api.js'),
	util = require('./util.js'),
	mousetrap = require('./vendor/mousetrap.min.js'),
	currentSongs = [],
	currentSong = null,
	currentIndex = null,
	dropIndex = null,
	$playlist, 
	currentDrag,
	selectedRows = [],
	_ = require('./vendor/lodash.min.js'),
	templates = {
		item: require('./templates/playlist-item.js')
	};

$(function() {

	$playlist = $("#playlist table tbody");

	$playlist.on('dblclick', '.item', function(e) {
		var curr = this;

		$playlist.find('.item').each(function(i,x) {
			if(x === curr)
			{
				currentIndex = i;
				return false;
			}
		});

		play();
	});

	$playlist.on('click', '.item', function(e) {
		if(e.ctrlKey)
		{
			ctrlSelect.call(this);
		}
		else if(e.shiftKey)
		{
			shiftSelect.call(this);
		}
		else {
			select([ this ]);
		}
	});

	mousetrap.bind('del', deleteSelected);

	$('#playlist table').sortable({
		containerSelector: 'table',
		itemPath: '> tbody',
		itemSelector: 'tr',
		placeholder: '<tr class="placeholder"/>',
		onDrop: function($item, container, _super)
		{
			var newOrder = [];

			$playlist.find('.item').each(function(i,x) 
			{
				if(currentSong && currentSong.stream === $(x).data('stream'))
					currentIndex = i;

				newOrder.push(_.find(currentSongs, function(y) {
					return y.stream === $(x).data('stream');
				}));
			});

			currentSongs = newOrder;
			_super($item);
		}
	});

	audioplayer.ended.add(function()  {
		next();
	});

	render();
});

function deleteSelected() 
{
	for(var i = 0; i < currentSongs.length; i++)
	{
		if(_.find(selectedRows, function(x) { return currentSongs[i].stream === $(x).data('stream'); })) {
			currentSongs.splice(i, 1);
			i--;
		}
	}

	currentIndex = 0;
	render();
}

function shiftSelect() {
	if(selectedRows.length === 0)	
		return;

	var items = $playlist.find('.item');
	var startIndex = 0;
	var endIndex = 0;
	var curr = this;

	items.each(function(i,x) 
	{
		if(x === selectedRows[0])
			startIndex = i;

		if(x === curr)
			endIndex = i;
	});

	if(startIndex > endIndex)
	{
		var n = endIndex;
		endIndex = startIndex;
		startIndex = n;
	}

	selectedRows = items.slice(startIndex, endIndex + 1);
	select(selectedRows);
}

function ctrlSelect() {
	if(!_.contains(selectedRows, this))
	{
		selectedRows.push(this);
		select(selectedRows);
	}	
}

function addSongs(songs, before)
{
	if(!before)
		currentSongs = currentSongs.concat(songs);
	else {
		var after = currentSongs.splice(before, currentSongs.length);
		currentSongs = currentSongs.concat(songs, after);
	}

	render();
}

function select(rows)
{
	selectedRows = rows;

	$playlist.find('.item').removeClass('info');

	_.each(rows, function(x) {
		$(x).addClass('info')
	});
}

function playSongs(songs)
{
	currentSongs = [];

	addSongs(songs);
	currentIndex = 0; 
	play(); 
}

function play() {
	if(currentSongs.length === 0)
		return;

	if(!currentIndex || currentIndex >= currentSongs.length)
		currentIndex = 0;

	currentSong = currentSongs[currentIndex];
	audioplayer.play(currentSong);
	
	$playlist.find('span.playing').addClass('hide');
	$playlist.find('.item').each(function(i,x) {

		if($(x).data('stream') === currentSong.stream)
		{
			$(x).find('.playing').removeClass('hide');
		}
	});
}

function next() {
	currentIndex++;
	play();
}

function prev() {
	if(currentIndex === 0)
		return;

	currentIndex--;
	play();
}

function render() {
	$playlist.html('');

	if(currentSongs.length > 0) {
		$.each(currentSongs, function(i,x) {
			var row = $(templates.item({
				stream: x.stream,
				song: x.song,
				playing: (currentSong && currentSong.stream === x.stream),
				artist: x.artist,
				album: x.album,
				duration: util.secondsToTime(x.duration)
			}));

			$playlist.append(row);
			row.data('item', x);
		});
	}
	else {
		$playlist.html('<td class="empty">Playlist is empty! Add items to start playing music.</td>');
	}
}

module.exports = {
	addSongs: addSongs,
	prev: prev,
	next: next,
	playSongs: playSongs
}
},{"./api.js":1,"./audioplayer.js":3,"./templates/playlist-item.js":15,"./util.js":16,"./vendor/lodash.min.js":18,"./vendor/mousetrap.min.js":20}],11:[function(require,module,exports){
var $libraryButton, $library, $playlist, $icon, $backButton;

function initialize() {
	var deferred = $.Deferred();

	$(function() {

		$libraryButton = $('#status .responsive-library-button');
		$library = $("#list-container");
		$playlist = $("#playlist-container");
		$icon = $("#status img");

		hookupEvents();

		deferred.resolve();
	});

	return deferred.promise();
}

function hookupEvents() {
	$libraryButton.click(function() {

		if($(this).is('.active'))
			hideLibrary();
		else
			showLibrary();
	});
}


function hideLibrary() {
	$libraryButton.removeClass('active');

	$library.removeClass('visible');
	$playlist.removeClass('hide');
}

function showLibrary() {
	$libraryButton.addClass('active');

	$library.addClass('visible');
	$playlist.addClass('hide');
}

module.exports = {
	initialize: initialize
}
},{}],12:[function(require,module,exports){
jade = require("./../vendor/jaderuntime.js");function template(locals) {
var buf = [];
var jade_mixins = {};
var locals_ = (locals || {}),username = locals_.username,password = locals_.password;
buf.push("<p class=\"text-center\"><img src=\"/images/ikon-512.png\" style=\"width: 130px; opacity: 0;\"/></p><h2 style=\"opacity: 0\" class=\"text-center\">MusicPlayer</h2><p>&nbsp;</p><div class=\"row\"><div class=\"col-md-8 col-md-offset-2\"><form><div class=\"form-group\"><label for=\"username\">Username</label><input type=\"text\" name=\"username\"" + (jade.attr("value", username, true, false)) + " class=\"form-control\"/></div><div class=\"form-group\"><label for=\"password\">Password</label><input type=\"password\" name=\"password\"" + (jade.attr("value", password, true, false)) + " class=\"form-control\"/></div><div class=\"pull-left\"><div class=\"form-group\"><div class=\"checkbox\"><label><input type=\"checkbox\" name=\"rememberMe\"/><span>Remember me</span></label></div></div></div><div class=\"pull-right\"><button class=\"btn btn-primary\">Let's rock!</button></div></form></div></div>");;return buf.join("");
}module.exports = template;
},{"./../vendor/jaderuntime.js":17}],13:[function(require,module,exports){
jade = require("./../vendor/jaderuntime.js");function template(locals) {
var buf = [];
var jade_mixins = {};
var locals_ = (locals || {}),cover = locals_.cover,name = locals_.name,items = locals_.items;
buf.push("<li class=\"album\"><div class=\"row\"><div class=\"col-xs-4 cover\"><img" + (jade.attr("src", (cover || '/images/no-cover.png'), true, false)) + "/></div><div class=\"col-xs-8 info\"><h3>" + (jade.escape(null == (jade.interp = name) ? "" : jade.interp)) + "</h3><h5>2007</h5><h5>" + (jade.escape(null == (jade.interp = (items.length + " songs")) ? "" : jade.interp)) + "</h5><div class=\"btn-group\"><button class=\"btn btn-default play\"><span class=\"glyphicon glyphicon-play\"></span></button><button class=\"btn btn-default add\"><span class=\"glyphicon glyphicon-log-in\"></span></button></div></div></div></li>");;return buf.join("");
}module.exports = template;
},{"./../vendor/jaderuntime.js":17}],14:[function(require,module,exports){
jade = require("./../vendor/jaderuntime.js");function template(locals) {
var buf = [];
var jade_mixins = {};
var locals_ = (locals || {}),isFile = locals_.isFile,song = locals_.song,name = locals_.name;
buf.push("<li class=\"generic\">");
if ( isFile)
{
buf.push("<span>" + (jade.escape(null == (jade.interp = song) ? "" : jade.interp)) + "</span>");
}
else
{
buf.push("<span>" + (jade.escape(null == (jade.interp = name) ? "" : jade.interp)) + "</span><div class=\"btn-group pull-right\"><button class=\"btn btn-default play\"><span class=\"glyphicon glyphicon-play\"></span></button><button class=\"btn btn-default add\"><span class=\"glyphicon glyphicon-log-in\"></span></button></div>");
}
buf.push("</li>");;return buf.join("");
}module.exports = template;
},{"./../vendor/jaderuntime.js":17}],15:[function(require,module,exports){
jade = require("./../vendor/jaderuntime.js");function template(locals) {
var buf = [];
var jade_mixins = {};
var locals_ = (locals || {}),stream = locals_.stream,playing = locals_.playing,song = locals_.song,artist = locals_.artist,album = locals_.album,duration = locals_.duration;
buf.push("<tr" + (jade.attr("data-stream", stream, true, false)) + " class=\"item\"><td><span" + (jade.cls(['glyphicon','glyphicon-volume-up','playing',(!playing ? 'hide' : '')], [null,null,null,true])) + "></span><span>" + (jade.escape(null == (jade.interp = song) ? "" : jade.interp)) + "</span><br/><span style=\"color: #777\"><small>" + (jade.escape(null == (jade.interp = (artist + ', ' + album)) ? "" : jade.interp)) + "</small></span></td><td style=\"width: 70px\" class=\"text-center\">" + (jade.escape(null == (jade.interp = duration) ? "" : jade.interp)) + "</td></tr>");;return buf.join("");
}module.exports = template;
},{"./../vendor/jaderuntime.js":17}],16:[function(require,module,exports){
var moment = require('./vendor/moment.js');

function secondsToTime(sec)
{
	return moment().startOf('day').add('s', sec).format('mm:ss')
}

module.exports = {
	secondsToTime: secondsToTime
};

},{"./vendor/moment.js":19}],17:[function(require,module,exports){
var global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.jade=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

/**
 * Merge two attribute objects giving precedence
 * to values in object `b`. Classes are special-cased
 * allowing for arrays and merging/joining appropriately
 * resulting in a string.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object} a
 * @api private
 */

exports.merge = function merge(a, b) {
  if (arguments.length === 1) {
    var attrs = a[0];
    for (var i = 1; i < a.length; i++) {
      attrs = merge(attrs, a[i]);
    }
    return attrs;
  }
  var ac = a['class'];
  var bc = b['class'];

  if (ac || bc) {
    ac = ac || [];
    bc = bc || [];
    if (!Array.isArray(ac)) ac = [ac];
    if (!Array.isArray(bc)) bc = [bc];
    a['class'] = ac.concat(bc).filter(nulls);
  }

  for (var key in b) {
    if (key != 'class') {
      a[key] = b[key];
    }
  }

  return a;
};

/**
 * Filter null `val`s.
 *
 * @param {*} val
 * @return {Boolean}
 * @api private
 */

function nulls(val) {
  return val != null && val !== '';
}

/**
 * join array as classes.
 *
 * @param {*} val
 * @return {String}
 */
exports.joinClasses = joinClasses;
function joinClasses(val) {
  return Array.isArray(val) ? val.map(joinClasses).filter(nulls).join(' ') : val;
}

/**
 * Render the given classes.
 *
 * @param {Array} classes
 * @param {Array.<Boolean>} escaped
 * @return {String}
 */
exports.cls = function cls(classes, escaped) {
  var buf = [];
  for (var i = 0; i < classes.length; i++) {
    if (escaped && escaped[i]) {
      buf.push(exports.escape(joinClasses([classes[i]])));
    } else {
      buf.push(joinClasses(classes[i]));
    }
  }
  var text = joinClasses(buf);
  if (text.length) {
    return ' class="' + text + '"';
  } else {
    return '';
  }
};

/**
 * Render the given attribute.
 *
 * @param {String} key
 * @param {String} val
 * @param {Boolean} escaped
 * @param {Boolean} terse
 * @return {String}
 */
exports.attr = function attr(key, val, escaped, terse) {
  if ('boolean' == typeof val || null == val) {
    if (val) {
      return ' ' + (terse ? key : key + '="' + key + '"');
    } else {
      return '';
    }
  } else if (0 == key.indexOf('data') && 'string' != typeof val) {
    return ' ' + key + "='" + JSON.stringify(val).replace(/'/g, '&apos;') + "'";
  } else if (escaped) {
    return ' ' + key + '="' + exports.escape(val) + '"';
  } else {
    return ' ' + key + '="' + val + '"';
  }
};

/**
 * Render the given attributes object.
 *
 * @param {Object} obj
 * @param {Object} escaped
 * @return {String}
 */
exports.attrs = function attrs(obj, terse){
  var buf = [];

  var keys = Object.keys(obj);

  if (keys.length) {
    for (var i = 0; i < keys.length; ++i) {
      var key = keys[i]
        , val = obj[key];

      if ('class' == key) {
        if (val = joinClasses(val)) {
          buf.push(' ' + key + '="' + val + '"');
        }
      } else {
        buf.push(exports.attr(key, val, false, terse));
      }
    }
  }

  return buf.join('');
};

/**
 * Escape the given string of `html`.
 *
 * @param {String} html
 * @return {String}
 * @api private
 */

exports.escape = function escape(html){
  var result = String(html)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  if (result === '' + html) return html;
  else return result;
};

/**
 * Re-throw the given `err` in context to the
 * the jade in `filename` at the given `lineno`.
 *
 * @param {Error} err
 * @param {String} filename
 * @param {String} lineno
 * @api private
 */

exports.rethrow = function rethrow(err, filename, lineno, str){
  if (!(err instanceof Error)) throw err;
  if ((typeof window != 'undefined' || !filename) && !str) {
    err.message += ' on line ' + lineno;
    throw err;
  }
  try {
    str =  str || require('fs').readFileSync(filename, 'utf8')
  } catch (ex) {
    rethrow(err, null, lineno)
  }
  var context = 3
    , lines = str.split('\n')
    , start = Math.max(lineno - context, 0)
    , end = Math.min(lines.length, lineno + context);

  // Error context
  var context = lines.slice(start, end).map(function(line, i){
    var curr = i + start + 1;
    return (curr == lineno ? '  > ' : '    ')
      + curr
      + '| '
      + line;
  }).join('\n');

  // Alter exception message
  err.path = filename;
  err.message = (filename || 'Jade') + ':' + lineno
    + '\n' + context + '\n\n' + err.message;
  throw err;
};

},{"fs":2}],2:[function(require,module,exports){

},{}]},{},[1])
(1)
});
},{"fs":22}],18:[function(require,module,exports){
var global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};/**
 * @license
 * Lo-Dash 2.4.1 (Custom Build) lodash.com/license | Underscore.js 1.5.2 underscorejs.org/LICENSE
 * Build: `lodash modern -o ./dist/lodash.js`
 */
;(function(){function n(n,t,e){e=(e||0)-1;for(var r=n?n.length:0;++e<r;)if(n[e]===t)return e;return-1}function t(t,e){var r=typeof e;if(t=t.l,"boolean"==r||null==e)return t[e]?0:-1;"number"!=r&&"string"!=r&&(r="object");var u="number"==r?e:m+e;return t=(t=t[r])&&t[u],"object"==r?t&&-1<n(t,e)?0:-1:t?0:-1}function e(n){var t=this.l,e=typeof n;if("boolean"==e||null==n)t[n]=true;else{"number"!=e&&"string"!=e&&(e="object");var r="number"==e?n:m+n,t=t[e]||(t[e]={});"object"==e?(t[r]||(t[r]=[])).push(n):t[r]=true
}}function r(n){return n.charCodeAt(0)}function u(n,t){for(var e=n.m,r=t.m,u=-1,o=e.length;++u<o;){var i=e[u],a=r[u];if(i!==a){if(i>a||typeof i=="undefined")return 1;if(i<a||typeof a=="undefined")return-1}}return n.n-t.n}function o(n){var t=-1,r=n.length,u=n[0],o=n[r/2|0],i=n[r-1];if(u&&typeof u=="object"&&o&&typeof o=="object"&&i&&typeof i=="object")return false;for(u=f(),u["false"]=u["null"]=u["true"]=u.undefined=false,o=f(),o.k=n,o.l=u,o.push=e;++t<r;)o.push(n[t]);return o}function i(n){return"\\"+U[n]
}function a(){return h.pop()||[]}function f(){return g.pop()||{k:null,l:null,m:null,"false":false,n:0,"null":false,number:null,object:null,push:null,string:null,"true":false,undefined:false,o:null}}function l(n){n.length=0,h.length<_&&h.push(n)}function c(n){var t=n.l;t&&c(t),n.k=n.l=n.m=n.object=n.number=n.string=n.o=null,g.length<_&&g.push(n)}function p(n,t,e){t||(t=0),typeof e=="undefined"&&(e=n?n.length:0);var r=-1;e=e-t||0;for(var u=Array(0>e?0:e);++r<e;)u[r]=n[t+r];return u}function s(e){function h(n,t,e){if(!n||!V[typeof n])return n;
t=t&&typeof e=="undefined"?t:tt(t,e,3);for(var r=-1,u=V[typeof n]&&Fe(n),o=u?u.length:0;++r<o&&(e=u[r],false!==t(n[e],e,n)););return n}function g(n,t,e){var r;if(!n||!V[typeof n])return n;t=t&&typeof e=="undefined"?t:tt(t,e,3);for(r in n)if(false===t(n[r],r,n))break;return n}function _(n,t,e){var r,u=n,o=u;if(!u)return o;for(var i=arguments,a=0,f=typeof e=="number"?2:i.length;++a<f;)if((u=i[a])&&V[typeof u])for(var l=-1,c=V[typeof u]&&Fe(u),p=c?c.length:0;++l<p;)r=c[l],"undefined"==typeof o[r]&&(o[r]=u[r]);
return o}function U(n,t,e){var r,u=n,o=u;if(!u)return o;var i=arguments,a=0,f=typeof e=="number"?2:i.length;if(3<f&&"function"==typeof i[f-2])var l=tt(i[--f-1],i[f--],2);else 2<f&&"function"==typeof i[f-1]&&(l=i[--f]);for(;++a<f;)if((u=i[a])&&V[typeof u])for(var c=-1,p=V[typeof u]&&Fe(u),s=p?p.length:0;++c<s;)r=p[c],o[r]=l?l(o[r],u[r]):u[r];return o}function H(n){var t,e=[];if(!n||!V[typeof n])return e;for(t in n)me.call(n,t)&&e.push(t);return e}function J(n){return n&&typeof n=="object"&&!Te(n)&&me.call(n,"__wrapped__")?n:new Q(n)
}function Q(n,t){this.__chain__=!!t,this.__wrapped__=n}function X(n){function t(){if(r){var n=p(r);be.apply(n,arguments)}if(this instanceof t){var o=nt(e.prototype),n=e.apply(o,n||arguments);return wt(n)?n:o}return e.apply(u,n||arguments)}var e=n[0],r=n[2],u=n[4];return $e(t,n),t}function Z(n,t,e,r,u){if(e){var o=e(n);if(typeof o!="undefined")return o}if(!wt(n))return n;var i=ce.call(n);if(!K[i])return n;var f=Ae[i];switch(i){case T:case F:return new f(+n);case W:case P:return new f(n);case z:return o=f(n.source,C.exec(n)),o.lastIndex=n.lastIndex,o
}if(i=Te(n),t){var c=!r;r||(r=a()),u||(u=a());for(var s=r.length;s--;)if(r[s]==n)return u[s];o=i?f(n.length):{}}else o=i?p(n):U({},n);return i&&(me.call(n,"index")&&(o.index=n.index),me.call(n,"input")&&(o.input=n.input)),t?(r.push(n),u.push(o),(i?St:h)(n,function(n,i){o[i]=Z(n,t,e,r,u)}),c&&(l(r),l(u)),o):o}function nt(n){return wt(n)?ke(n):{}}function tt(n,t,e){if(typeof n!="function")return Ut;if(typeof t=="undefined"||!("prototype"in n))return n;var r=n.__bindData__;if(typeof r=="undefined"&&(De.funcNames&&(r=!n.name),r=r||!De.funcDecomp,!r)){var u=ge.call(n);
De.funcNames||(r=!O.test(u)),r||(r=E.test(u),$e(n,r))}if(false===r||true!==r&&1&r[1])return n;switch(e){case 1:return function(e){return n.call(t,e)};case 2:return function(e,r){return n.call(t,e,r)};case 3:return function(e,r,u){return n.call(t,e,r,u)};case 4:return function(e,r,u,o){return n.call(t,e,r,u,o)}}return Mt(n,t)}function et(n){function t(){var n=f?i:this;if(u){var h=p(u);be.apply(h,arguments)}return(o||c)&&(h||(h=p(arguments)),o&&be.apply(h,o),c&&h.length<a)?(r|=16,et([e,s?r:-4&r,h,null,i,a])):(h||(h=arguments),l&&(e=n[v]),this instanceof t?(n=nt(e.prototype),h=e.apply(n,h),wt(h)?h:n):e.apply(n,h))
}var e=n[0],r=n[1],u=n[2],o=n[3],i=n[4],a=n[5],f=1&r,l=2&r,c=4&r,s=8&r,v=e;return $e(t,n),t}function rt(e,r){var u=-1,i=st(),a=e?e.length:0,f=a>=b&&i===n,l=[];if(f){var p=o(r);p?(i=t,r=p):f=false}for(;++u<a;)p=e[u],0>i(r,p)&&l.push(p);return f&&c(r),l}function ut(n,t,e,r){r=(r||0)-1;for(var u=n?n.length:0,o=[];++r<u;){var i=n[r];if(i&&typeof i=="object"&&typeof i.length=="number"&&(Te(i)||yt(i))){t||(i=ut(i,t,e));var a=-1,f=i.length,l=o.length;for(o.length+=f;++a<f;)o[l++]=i[a]}else e||o.push(i)}return o
}function ot(n,t,e,r,u,o){if(e){var i=e(n,t);if(typeof i!="undefined")return!!i}if(n===t)return 0!==n||1/n==1/t;if(n===n&&!(n&&V[typeof n]||t&&V[typeof t]))return false;if(null==n||null==t)return n===t;var f=ce.call(n),c=ce.call(t);if(f==D&&(f=q),c==D&&(c=q),f!=c)return false;switch(f){case T:case F:return+n==+t;case W:return n!=+n?t!=+t:0==n?1/n==1/t:n==+t;case z:case P:return n==oe(t)}if(c=f==$,!c){var p=me.call(n,"__wrapped__"),s=me.call(t,"__wrapped__");if(p||s)return ot(p?n.__wrapped__:n,s?t.__wrapped__:t,e,r,u,o);
if(f!=q)return false;if(f=n.constructor,p=t.constructor,f!=p&&!(dt(f)&&f instanceof f&&dt(p)&&p instanceof p)&&"constructor"in n&&"constructor"in t)return false}for(f=!u,u||(u=a()),o||(o=a()),p=u.length;p--;)if(u[p]==n)return o[p]==t;var v=0,i=true;if(u.push(n),o.push(t),c){if(p=n.length,v=t.length,(i=v==p)||r)for(;v--;)if(c=p,s=t[v],r)for(;c--&&!(i=ot(n[c],s,e,r,u,o)););else if(!(i=ot(n[v],s,e,r,u,o)))break}else g(t,function(t,a,f){return me.call(f,a)?(v++,i=me.call(n,a)&&ot(n[a],t,e,r,u,o)):void 0}),i&&!r&&g(n,function(n,t,e){return me.call(e,t)?i=-1<--v:void 0
});return u.pop(),o.pop(),f&&(l(u),l(o)),i}function it(n,t,e,r,u){(Te(t)?St:h)(t,function(t,o){var i,a,f=t,l=n[o];if(t&&((a=Te(t))||Pe(t))){for(f=r.length;f--;)if(i=r[f]==t){l=u[f];break}if(!i){var c;e&&(f=e(l,t),c=typeof f!="undefined")&&(l=f),c||(l=a?Te(l)?l:[]:Pe(l)?l:{}),r.push(t),u.push(l),c||it(l,t,e,r,u)}}else e&&(f=e(l,t),typeof f=="undefined"&&(f=t)),typeof f!="undefined"&&(l=f);n[o]=l})}function at(n,t){return n+he(Re()*(t-n+1))}function ft(e,r,u){var i=-1,f=st(),p=e?e.length:0,s=[],v=!r&&p>=b&&f===n,h=u||v?a():s;
for(v&&(h=o(h),f=t);++i<p;){var g=e[i],y=u?u(g,i,e):g;(r?!i||h[h.length-1]!==y:0>f(h,y))&&((u||v)&&h.push(y),s.push(g))}return v?(l(h.k),c(h)):u&&l(h),s}function lt(n){return function(t,e,r){var u={};e=J.createCallback(e,r,3),r=-1;var o=t?t.length:0;if(typeof o=="number")for(;++r<o;){var i=t[r];n(u,i,e(i,r,t),t)}else h(t,function(t,r,o){n(u,t,e(t,r,o),o)});return u}}function ct(n,t,e,r,u,o){var i=1&t,a=4&t,f=16&t,l=32&t;if(!(2&t||dt(n)))throw new ie;f&&!e.length&&(t&=-17,f=e=false),l&&!r.length&&(t&=-33,l=r=false);
var c=n&&n.__bindData__;return c&&true!==c?(c=p(c),c[2]&&(c[2]=p(c[2])),c[3]&&(c[3]=p(c[3])),!i||1&c[1]||(c[4]=u),!i&&1&c[1]&&(t|=8),!a||4&c[1]||(c[5]=o),f&&be.apply(c[2]||(c[2]=[]),e),l&&we.apply(c[3]||(c[3]=[]),r),c[1]|=t,ct.apply(null,c)):(1==t||17===t?X:et)([n,t,e,r,u,o])}function pt(n){return Be[n]}function st(){var t=(t=J.indexOf)===Wt?n:t;return t}function vt(n){return typeof n=="function"&&pe.test(n)}function ht(n){var t,e;return n&&ce.call(n)==q&&(t=n.constructor,!dt(t)||t instanceof t)?(g(n,function(n,t){e=t
}),typeof e=="undefined"||me.call(n,e)):false}function gt(n){return We[n]}function yt(n){return n&&typeof n=="object"&&typeof n.length=="number"&&ce.call(n)==D||false}function mt(n,t,e){var r=Fe(n),u=r.length;for(t=tt(t,e,3);u--&&(e=r[u],false!==t(n[e],e,n)););return n}function bt(n){var t=[];return g(n,function(n,e){dt(n)&&t.push(e)}),t.sort()}function _t(n){for(var t=-1,e=Fe(n),r=e.length,u={};++t<r;){var o=e[t];u[n[o]]=o}return u}function dt(n){return typeof n=="function"}function wt(n){return!(!n||!V[typeof n])
}function jt(n){return typeof n=="number"||n&&typeof n=="object"&&ce.call(n)==W||false}function kt(n){return typeof n=="string"||n&&typeof n=="object"&&ce.call(n)==P||false}function xt(n){for(var t=-1,e=Fe(n),r=e.length,u=Xt(r);++t<r;)u[t]=n[e[t]];return u}function Ct(n,t,e){var r=-1,u=st(),o=n?n.length:0,i=false;return e=(0>e?Ie(0,o+e):e)||0,Te(n)?i=-1<u(n,t,e):typeof o=="number"?i=-1<(kt(n)?n.indexOf(t,e):u(n,t,e)):h(n,function(n){return++r<e?void 0:!(i=n===t)}),i}function Ot(n,t,e){var r=true;t=J.createCallback(t,e,3),e=-1;
var u=n?n.length:0;if(typeof u=="number")for(;++e<u&&(r=!!t(n[e],e,n)););else h(n,function(n,e,u){return r=!!t(n,e,u)});return r}function Nt(n,t,e){var r=[];t=J.createCallback(t,e,3),e=-1;var u=n?n.length:0;if(typeof u=="number")for(;++e<u;){var o=n[e];t(o,e,n)&&r.push(o)}else h(n,function(n,e,u){t(n,e,u)&&r.push(n)});return r}function It(n,t,e){t=J.createCallback(t,e,3),e=-1;var r=n?n.length:0;if(typeof r!="number"){var u;return h(n,function(n,e,r){return t(n,e,r)?(u=n,false):void 0}),u}for(;++e<r;){var o=n[e];
if(t(o,e,n))return o}}function St(n,t,e){var r=-1,u=n?n.length:0;if(t=t&&typeof e=="undefined"?t:tt(t,e,3),typeof u=="number")for(;++r<u&&false!==t(n[r],r,n););else h(n,t);return n}function Et(n,t,e){var r=n?n.length:0;if(t=t&&typeof e=="undefined"?t:tt(t,e,3),typeof r=="number")for(;r--&&false!==t(n[r],r,n););else{var u=Fe(n),r=u.length;h(n,function(n,e,o){return e=u?u[--r]:--r,t(o[e],e,o)})}return n}function Rt(n,t,e){var r=-1,u=n?n.length:0;if(t=J.createCallback(t,e,3),typeof u=="number")for(var o=Xt(u);++r<u;)o[r]=t(n[r],r,n);
else o=[],h(n,function(n,e,u){o[++r]=t(n,e,u)});return o}function At(n,t,e){var u=-1/0,o=u;if(typeof t!="function"&&e&&e[t]===n&&(t=null),null==t&&Te(n)){e=-1;for(var i=n.length;++e<i;){var a=n[e];a>o&&(o=a)}}else t=null==t&&kt(n)?r:J.createCallback(t,e,3),St(n,function(n,e,r){e=t(n,e,r),e>u&&(u=e,o=n)});return o}function Dt(n,t,e,r){if(!n)return e;var u=3>arguments.length;t=J.createCallback(t,r,4);var o=-1,i=n.length;if(typeof i=="number")for(u&&(e=n[++o]);++o<i;)e=t(e,n[o],o,n);else h(n,function(n,r,o){e=u?(u=false,n):t(e,n,r,o)
});return e}function $t(n,t,e,r){var u=3>arguments.length;return t=J.createCallback(t,r,4),Et(n,function(n,r,o){e=u?(u=false,n):t(e,n,r,o)}),e}function Tt(n){var t=-1,e=n?n.length:0,r=Xt(typeof e=="number"?e:0);return St(n,function(n){var e=at(0,++t);r[t]=r[e],r[e]=n}),r}function Ft(n,t,e){var r;t=J.createCallback(t,e,3),e=-1;var u=n?n.length:0;if(typeof u=="number")for(;++e<u&&!(r=t(n[e],e,n)););else h(n,function(n,e,u){return!(r=t(n,e,u))});return!!r}function Bt(n,t,e){var r=0,u=n?n.length:0;if(typeof t!="number"&&null!=t){var o=-1;
for(t=J.createCallback(t,e,3);++o<u&&t(n[o],o,n);)r++}else if(r=t,null==r||e)return n?n[0]:v;return p(n,0,Se(Ie(0,r),u))}function Wt(t,e,r){if(typeof r=="number"){var u=t?t.length:0;r=0>r?Ie(0,u+r):r||0}else if(r)return r=zt(t,e),t[r]===e?r:-1;return n(t,e,r)}function qt(n,t,e){if(typeof t!="number"&&null!=t){var r=0,u=-1,o=n?n.length:0;for(t=J.createCallback(t,e,3);++u<o&&t(n[u],u,n);)r++}else r=null==t||e?1:Ie(0,t);return p(n,r)}function zt(n,t,e,r){var u=0,o=n?n.length:u;for(e=e?J.createCallback(e,r,1):Ut,t=e(t);u<o;)r=u+o>>>1,e(n[r])<t?u=r+1:o=r;
return u}function Pt(n,t,e,r){return typeof t!="boolean"&&null!=t&&(r=e,e=typeof t!="function"&&r&&r[t]===n?null:t,t=false),null!=e&&(e=J.createCallback(e,r,3)),ft(n,t,e)}function Kt(){for(var n=1<arguments.length?arguments:arguments[0],t=-1,e=n?At(Ve(n,"length")):0,r=Xt(0>e?0:e);++t<e;)r[t]=Ve(n,t);return r}function Lt(n,t){var e=-1,r=n?n.length:0,u={};for(t||!r||Te(n[0])||(t=[]);++e<r;){var o=n[e];t?u[o]=t[e]:o&&(u[o[0]]=o[1])}return u}function Mt(n,t){return 2<arguments.length?ct(n,17,p(arguments,2),null,t):ct(n,1,null,null,t)
}function Vt(n,t,e){function r(){c&&ve(c),i=c=p=v,(g||h!==t)&&(s=Ue(),a=n.apply(l,o),c||i||(o=l=null))}function u(){var e=t-(Ue()-f);0<e?c=_e(u,e):(i&&ve(i),e=p,i=c=p=v,e&&(s=Ue(),a=n.apply(l,o),c||i||(o=l=null)))}var o,i,a,f,l,c,p,s=0,h=false,g=true;if(!dt(n))throw new ie;if(t=Ie(0,t)||0,true===e)var y=true,g=false;else wt(e)&&(y=e.leading,h="maxWait"in e&&(Ie(t,e.maxWait)||0),g="trailing"in e?e.trailing:g);return function(){if(o=arguments,f=Ue(),l=this,p=g&&(c||!y),false===h)var e=y&&!c;else{i||y||(s=f);var v=h-(f-s),m=0>=v;
m?(i&&(i=ve(i)),s=f,a=n.apply(l,o)):i||(i=_e(r,v))}return m&&c?c=ve(c):c||t===h||(c=_e(u,t)),e&&(m=true,a=n.apply(l,o)),!m||c||i||(o=l=null),a}}function Ut(n){return n}function Gt(n,t,e){var r=true,u=t&&bt(t);t&&(e||u.length)||(null==e&&(e=t),o=Q,t=n,n=J,u=bt(t)),false===e?r=false:wt(e)&&"chain"in e&&(r=e.chain);var o=n,i=dt(o);St(u,function(e){var u=n[e]=t[e];i&&(o.prototype[e]=function(){var t=this.__chain__,e=this.__wrapped__,i=[e];if(be.apply(i,arguments),i=u.apply(n,i),r||t){if(e===i&&wt(i))return this;
i=new o(i),i.__chain__=t}return i})})}function Ht(){}function Jt(n){return function(t){return t[n]}}function Qt(){return this.__wrapped__}e=e?Y.defaults(G.Object(),e,Y.pick(G,A)):G;var Xt=e.Array,Yt=e.Boolean,Zt=e.Date,ne=e.Function,te=e.Math,ee=e.Number,re=e.Object,ue=e.RegExp,oe=e.String,ie=e.TypeError,ae=[],fe=re.prototype,le=e._,ce=fe.toString,pe=ue("^"+oe(ce).replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace(/toString| for [^\]]+/g,".*?")+"$"),se=te.ceil,ve=e.clearTimeout,he=te.floor,ge=ne.prototype.toString,ye=vt(ye=re.getPrototypeOf)&&ye,me=fe.hasOwnProperty,be=ae.push,_e=e.setTimeout,de=ae.splice,we=ae.unshift,je=function(){try{var n={},t=vt(t=re.defineProperty)&&t,e=t(n,n,n)&&t
}catch(r){}return e}(),ke=vt(ke=re.create)&&ke,xe=vt(xe=Xt.isArray)&&xe,Ce=e.isFinite,Oe=e.isNaN,Ne=vt(Ne=re.keys)&&Ne,Ie=te.max,Se=te.min,Ee=e.parseInt,Re=te.random,Ae={};Ae[$]=Xt,Ae[T]=Yt,Ae[F]=Zt,Ae[B]=ne,Ae[q]=re,Ae[W]=ee,Ae[z]=ue,Ae[P]=oe,Q.prototype=J.prototype;var De=J.support={};De.funcDecomp=!vt(e.a)&&E.test(s),De.funcNames=typeof ne.name=="string",J.templateSettings={escape:/<%-([\s\S]+?)%>/g,evaluate:/<%([\s\S]+?)%>/g,interpolate:N,variable:"",imports:{_:J}},ke||(nt=function(){function n(){}return function(t){if(wt(t)){n.prototype=t;
var r=new n;n.prototype=null}return r||e.Object()}}());var $e=je?function(n,t){M.value=t,je(n,"__bindData__",M)}:Ht,Te=xe||function(n){return n&&typeof n=="object"&&typeof n.length=="number"&&ce.call(n)==$||false},Fe=Ne?function(n){return wt(n)?Ne(n):[]}:H,Be={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"},We=_t(Be),qe=ue("("+Fe(We).join("|")+")","g"),ze=ue("["+Fe(Be).join("")+"]","g"),Pe=ye?function(n){if(!n||ce.call(n)!=q)return false;var t=n.valueOf,e=vt(t)&&(e=ye(t))&&ye(e);return e?n==e||ye(n)==e:ht(n)
}:ht,Ke=lt(function(n,t,e){me.call(n,e)?n[e]++:n[e]=1}),Le=lt(function(n,t,e){(me.call(n,e)?n[e]:n[e]=[]).push(t)}),Me=lt(function(n,t,e){n[e]=t}),Ve=Rt,Ue=vt(Ue=Zt.now)&&Ue||function(){return(new Zt).getTime()},Ge=8==Ee(d+"08")?Ee:function(n,t){return Ee(kt(n)?n.replace(I,""):n,t||0)};return J.after=function(n,t){if(!dt(t))throw new ie;return function(){return 1>--n?t.apply(this,arguments):void 0}},J.assign=U,J.at=function(n){for(var t=arguments,e=-1,r=ut(t,true,false,1),t=t[2]&&t[2][t[1]]===n?1:r.length,u=Xt(t);++e<t;)u[e]=n[r[e]];
return u},J.bind=Mt,J.bindAll=function(n){for(var t=1<arguments.length?ut(arguments,true,false,1):bt(n),e=-1,r=t.length;++e<r;){var u=t[e];n[u]=ct(n[u],1,null,null,n)}return n},J.bindKey=function(n,t){return 2<arguments.length?ct(t,19,p(arguments,2),null,n):ct(t,3,null,null,n)},J.chain=function(n){return n=new Q(n),n.__chain__=true,n},J.compact=function(n){for(var t=-1,e=n?n.length:0,r=[];++t<e;){var u=n[t];u&&r.push(u)}return r},J.compose=function(){for(var n=arguments,t=n.length;t--;)if(!dt(n[t]))throw new ie;
return function(){for(var t=arguments,e=n.length;e--;)t=[n[e].apply(this,t)];return t[0]}},J.constant=function(n){return function(){return n}},J.countBy=Ke,J.create=function(n,t){var e=nt(n);return t?U(e,t):e},J.createCallback=function(n,t,e){var r=typeof n;if(null==n||"function"==r)return tt(n,t,e);if("object"!=r)return Jt(n);var u=Fe(n),o=u[0],i=n[o];return 1!=u.length||i!==i||wt(i)?function(t){for(var e=u.length,r=false;e--&&(r=ot(t[u[e]],n[u[e]],null,true)););return r}:function(n){return n=n[o],i===n&&(0!==i||1/i==1/n)
}},J.curry=function(n,t){return t=typeof t=="number"?t:+t||n.length,ct(n,4,null,null,null,t)},J.debounce=Vt,J.defaults=_,J.defer=function(n){if(!dt(n))throw new ie;var t=p(arguments,1);return _e(function(){n.apply(v,t)},1)},J.delay=function(n,t){if(!dt(n))throw new ie;var e=p(arguments,2);return _e(function(){n.apply(v,e)},t)},J.difference=function(n){return rt(n,ut(arguments,true,true,1))},J.filter=Nt,J.flatten=function(n,t,e,r){return typeof t!="boolean"&&null!=t&&(r=e,e=typeof t!="function"&&r&&r[t]===n?null:t,t=false),null!=e&&(n=Rt(n,e,r)),ut(n,t)
},J.forEach=St,J.forEachRight=Et,J.forIn=g,J.forInRight=function(n,t,e){var r=[];g(n,function(n,t){r.push(t,n)});var u=r.length;for(t=tt(t,e,3);u--&&false!==t(r[u--],r[u],n););return n},J.forOwn=h,J.forOwnRight=mt,J.functions=bt,J.groupBy=Le,J.indexBy=Me,J.initial=function(n,t,e){var r=0,u=n?n.length:0;if(typeof t!="number"&&null!=t){var o=u;for(t=J.createCallback(t,e,3);o--&&t(n[o],o,n);)r++}else r=null==t||e?1:t||r;return p(n,0,Se(Ie(0,u-r),u))},J.intersection=function(){for(var e=[],r=-1,u=arguments.length,i=a(),f=st(),p=f===n,s=a();++r<u;){var v=arguments[r];
(Te(v)||yt(v))&&(e.push(v),i.push(p&&v.length>=b&&o(r?e[r]:s)))}var p=e[0],h=-1,g=p?p.length:0,y=[];n:for(;++h<g;){var m=i[0],v=p[h];if(0>(m?t(m,v):f(s,v))){for(r=u,(m||s).push(v);--r;)if(m=i[r],0>(m?t(m,v):f(e[r],v)))continue n;y.push(v)}}for(;u--;)(m=i[u])&&c(m);return l(i),l(s),y},J.invert=_t,J.invoke=function(n,t){var e=p(arguments,2),r=-1,u=typeof t=="function",o=n?n.length:0,i=Xt(typeof o=="number"?o:0);return St(n,function(n){i[++r]=(u?t:n[t]).apply(n,e)}),i},J.keys=Fe,J.map=Rt,J.mapValues=function(n,t,e){var r={};
return t=J.createCallback(t,e,3),h(n,function(n,e,u){r[e]=t(n,e,u)}),r},J.max=At,J.memoize=function(n,t){function e(){var r=e.cache,u=t?t.apply(this,arguments):m+arguments[0];return me.call(r,u)?r[u]:r[u]=n.apply(this,arguments)}if(!dt(n))throw new ie;return e.cache={},e},J.merge=function(n){var t=arguments,e=2;if(!wt(n))return n;if("number"!=typeof t[2]&&(e=t.length),3<e&&"function"==typeof t[e-2])var r=tt(t[--e-1],t[e--],2);else 2<e&&"function"==typeof t[e-1]&&(r=t[--e]);for(var t=p(arguments,1,e),u=-1,o=a(),i=a();++u<e;)it(n,t[u],r,o,i);
return l(o),l(i),n},J.min=function(n,t,e){var u=1/0,o=u;if(typeof t!="function"&&e&&e[t]===n&&(t=null),null==t&&Te(n)){e=-1;for(var i=n.length;++e<i;){var a=n[e];a<o&&(o=a)}}else t=null==t&&kt(n)?r:J.createCallback(t,e,3),St(n,function(n,e,r){e=t(n,e,r),e<u&&(u=e,o=n)});return o},J.omit=function(n,t,e){var r={};if(typeof t!="function"){var u=[];g(n,function(n,t){u.push(t)});for(var u=rt(u,ut(arguments,true,false,1)),o=-1,i=u.length;++o<i;){var a=u[o];r[a]=n[a]}}else t=J.createCallback(t,e,3),g(n,function(n,e,u){t(n,e,u)||(r[e]=n)
});return r},J.once=function(n){var t,e;if(!dt(n))throw new ie;return function(){return t?e:(t=true,e=n.apply(this,arguments),n=null,e)}},J.pairs=function(n){for(var t=-1,e=Fe(n),r=e.length,u=Xt(r);++t<r;){var o=e[t];u[t]=[o,n[o]]}return u},J.partial=function(n){return ct(n,16,p(arguments,1))},J.partialRight=function(n){return ct(n,32,null,p(arguments,1))},J.pick=function(n,t,e){var r={};if(typeof t!="function")for(var u=-1,o=ut(arguments,true,false,1),i=wt(n)?o.length:0;++u<i;){var a=o[u];a in n&&(r[a]=n[a])
}else t=J.createCallback(t,e,3),g(n,function(n,e,u){t(n,e,u)&&(r[e]=n)});return r},J.pluck=Ve,J.property=Jt,J.pull=function(n){for(var t=arguments,e=0,r=t.length,u=n?n.length:0;++e<r;)for(var o=-1,i=t[e];++o<u;)n[o]===i&&(de.call(n,o--,1),u--);return n},J.range=function(n,t,e){n=+n||0,e=typeof e=="number"?e:+e||1,null==t&&(t=n,n=0);var r=-1;t=Ie(0,se((t-n)/(e||1)));for(var u=Xt(t);++r<t;)u[r]=n,n+=e;return u},J.reject=function(n,t,e){return t=J.createCallback(t,e,3),Nt(n,function(n,e,r){return!t(n,e,r)
})},J.remove=function(n,t,e){var r=-1,u=n?n.length:0,o=[];for(t=J.createCallback(t,e,3);++r<u;)e=n[r],t(e,r,n)&&(o.push(e),de.call(n,r--,1),u--);return o},J.rest=qt,J.shuffle=Tt,J.sortBy=function(n,t,e){var r=-1,o=Te(t),i=n?n.length:0,p=Xt(typeof i=="number"?i:0);for(o||(t=J.createCallback(t,e,3)),St(n,function(n,e,u){var i=p[++r]=f();o?i.m=Rt(t,function(t){return n[t]}):(i.m=a())[0]=t(n,e,u),i.n=r,i.o=n}),i=p.length,p.sort(u);i--;)n=p[i],p[i]=n.o,o||l(n.m),c(n);return p},J.tap=function(n,t){return t(n),n
},J.throttle=function(n,t,e){var r=true,u=true;if(!dt(n))throw new ie;return false===e?r=false:wt(e)&&(r="leading"in e?e.leading:r,u="trailing"in e?e.trailing:u),L.leading=r,L.maxWait=t,L.trailing=u,Vt(n,t,L)},J.times=function(n,t,e){n=-1<(n=+n)?n:0;var r=-1,u=Xt(n);for(t=tt(t,e,1);++r<n;)u[r]=t(r);return u},J.toArray=function(n){return n&&typeof n.length=="number"?p(n):xt(n)},J.transform=function(n,t,e,r){var u=Te(n);if(null==e)if(u)e=[];else{var o=n&&n.constructor;e=nt(o&&o.prototype)}return t&&(t=J.createCallback(t,r,4),(u?St:h)(n,function(n,r,u){return t(e,n,r,u)
})),e},J.union=function(){return ft(ut(arguments,true,true))},J.uniq=Pt,J.values=xt,J.where=Nt,J.without=function(n){return rt(n,p(arguments,1))},J.wrap=function(n,t){return ct(t,16,[n])},J.xor=function(){for(var n=-1,t=arguments.length;++n<t;){var e=arguments[n];if(Te(e)||yt(e))var r=r?ft(rt(r,e).concat(rt(e,r))):e}return r||[]},J.zip=Kt,J.zipObject=Lt,J.collect=Rt,J.drop=qt,J.each=St,J.eachRight=Et,J.extend=U,J.methods=bt,J.object=Lt,J.select=Nt,J.tail=qt,J.unique=Pt,J.unzip=Kt,Gt(J),J.clone=function(n,t,e,r){return typeof t!="boolean"&&null!=t&&(r=e,e=t,t=false),Z(n,t,typeof e=="function"&&tt(e,r,1))
},J.cloneDeep=function(n,t,e){return Z(n,true,typeof t=="function"&&tt(t,e,1))},J.contains=Ct,J.escape=function(n){return null==n?"":oe(n).replace(ze,pt)},J.every=Ot,J.find=It,J.findIndex=function(n,t,e){var r=-1,u=n?n.length:0;for(t=J.createCallback(t,e,3);++r<u;)if(t(n[r],r,n))return r;return-1},J.findKey=function(n,t,e){var r;return t=J.createCallback(t,e,3),h(n,function(n,e,u){return t(n,e,u)?(r=e,false):void 0}),r},J.findLast=function(n,t,e){var r;return t=J.createCallback(t,e,3),Et(n,function(n,e,u){return t(n,e,u)?(r=n,false):void 0
}),r},J.findLastIndex=function(n,t,e){var r=n?n.length:0;for(t=J.createCallback(t,e,3);r--;)if(t(n[r],r,n))return r;return-1},J.findLastKey=function(n,t,e){var r;return t=J.createCallback(t,e,3),mt(n,function(n,e,u){return t(n,e,u)?(r=e,false):void 0}),r},J.has=function(n,t){return n?me.call(n,t):false},J.identity=Ut,J.indexOf=Wt,J.isArguments=yt,J.isArray=Te,J.isBoolean=function(n){return true===n||false===n||n&&typeof n=="object"&&ce.call(n)==T||false},J.isDate=function(n){return n&&typeof n=="object"&&ce.call(n)==F||false
},J.isElement=function(n){return n&&1===n.nodeType||false},J.isEmpty=function(n){var t=true;if(!n)return t;var e=ce.call(n),r=n.length;return e==$||e==P||e==D||e==q&&typeof r=="number"&&dt(n.splice)?!r:(h(n,function(){return t=false}),t)},J.isEqual=function(n,t,e,r){return ot(n,t,typeof e=="function"&&tt(e,r,2))},J.isFinite=function(n){return Ce(n)&&!Oe(parseFloat(n))},J.isFunction=dt,J.isNaN=function(n){return jt(n)&&n!=+n},J.isNull=function(n){return null===n},J.isNumber=jt,J.isObject=wt,J.isPlainObject=Pe,J.isRegExp=function(n){return n&&typeof n=="object"&&ce.call(n)==z||false
},J.isString=kt,J.isUndefined=function(n){return typeof n=="undefined"},J.lastIndexOf=function(n,t,e){var r=n?n.length:0;for(typeof e=="number"&&(r=(0>e?Ie(0,r+e):Se(e,r-1))+1);r--;)if(n[r]===t)return r;return-1},J.mixin=Gt,J.noConflict=function(){return e._=le,this},J.noop=Ht,J.now=Ue,J.parseInt=Ge,J.random=function(n,t,e){var r=null==n,u=null==t;return null==e&&(typeof n=="boolean"&&u?(e=n,n=1):u||typeof t!="boolean"||(e=t,u=true)),r&&u&&(t=1),n=+n||0,u?(t=n,n=0):t=+t||0,e||n%1||t%1?(e=Re(),Se(n+e*(t-n+parseFloat("1e-"+((e+"").length-1))),t)):at(n,t)
},J.reduce=Dt,J.reduceRight=$t,J.result=function(n,t){if(n){var e=n[t];return dt(e)?n[t]():e}},J.runInContext=s,J.size=function(n){var t=n?n.length:0;return typeof t=="number"?t:Fe(n).length},J.some=Ft,J.sortedIndex=zt,J.template=function(n,t,e){var r=J.templateSettings;n=oe(n||""),e=_({},e,r);var u,o=_({},e.imports,r.imports),r=Fe(o),o=xt(o),a=0,f=e.interpolate||S,l="__p+='",f=ue((e.escape||S).source+"|"+f.source+"|"+(f===N?x:S).source+"|"+(e.evaluate||S).source+"|$","g");n.replace(f,function(t,e,r,o,f,c){return r||(r=o),l+=n.slice(a,c).replace(R,i),e&&(l+="'+__e("+e+")+'"),f&&(u=true,l+="';"+f+";\n__p+='"),r&&(l+="'+((__t=("+r+"))==null?'':__t)+'"),a=c+t.length,t
}),l+="';",f=e=e.variable,f||(e="obj",l="with("+e+"){"+l+"}"),l=(u?l.replace(w,""):l).replace(j,"$1").replace(k,"$1;"),l="function("+e+"){"+(f?"":e+"||("+e+"={});")+"var __t,__p='',__e=_.escape"+(u?",__j=Array.prototype.join;function print(){__p+=__j.call(arguments,'')}":";")+l+"return __p}";try{var c=ne(r,"return "+l).apply(v,o)}catch(p){throw p.source=l,p}return t?c(t):(c.source=l,c)},J.unescape=function(n){return null==n?"":oe(n).replace(qe,gt)},J.uniqueId=function(n){var t=++y;return oe(null==n?"":n)+t
},J.all=Ot,J.any=Ft,J.detect=It,J.findWhere=It,J.foldl=Dt,J.foldr=$t,J.include=Ct,J.inject=Dt,Gt(function(){var n={};return h(J,function(t,e){J.prototype[e]||(n[e]=t)}),n}(),false),J.first=Bt,J.last=function(n,t,e){var r=0,u=n?n.length:0;if(typeof t!="number"&&null!=t){var o=u;for(t=J.createCallback(t,e,3);o--&&t(n[o],o,n);)r++}else if(r=t,null==r||e)return n?n[u-1]:v;return p(n,Ie(0,u-r))},J.sample=function(n,t,e){return n&&typeof n.length!="number"&&(n=xt(n)),null==t||e?n?n[at(0,n.length-1)]:v:(n=Tt(n),n.length=Se(Ie(0,t),n.length),n)
},J.take=Bt,J.head=Bt,h(J,function(n,t){var e="sample"!==t;J.prototype[t]||(J.prototype[t]=function(t,r){var u=this.__chain__,o=n(this.__wrapped__,t,r);return u||null!=t&&(!r||e&&typeof t=="function")?new Q(o,u):o})}),J.VERSION="2.4.1",J.prototype.chain=function(){return this.__chain__=true,this},J.prototype.toString=function(){return oe(this.__wrapped__)},J.prototype.value=Qt,J.prototype.valueOf=Qt,St(["join","pop","shift"],function(n){var t=ae[n];J.prototype[n]=function(){var n=this.__chain__,e=t.apply(this.__wrapped__,arguments);
return n?new Q(e,n):e}}),St(["push","reverse","sort","unshift"],function(n){var t=ae[n];J.prototype[n]=function(){return t.apply(this.__wrapped__,arguments),this}}),St(["concat","slice","splice"],function(n){var t=ae[n];J.prototype[n]=function(){return new Q(t.apply(this.__wrapped__,arguments),this.__chain__)}}),J}var v,h=[],g=[],y=0,m=+new Date+"",b=75,_=40,d=" \t\x0B\f\xa0\ufeff\n\r\u2028\u2029\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000",w=/\b__p\+='';/g,j=/\b(__p\+=)''\+/g,k=/(__e\(.*?\)|\b__t\))\+'';/g,x=/\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g,C=/\w*$/,O=/^\s*function[ \n\r\t]+\w/,N=/<%=([\s\S]+?)%>/g,I=RegExp("^["+d+"]*0+(?=.$)"),S=/($^)/,E=/\bthis\b/,R=/['\n\r\t\u2028\u2029\\]/g,A="Array Boolean Date Function Math Number Object RegExp String _ attachEvent clearTimeout isFinite isNaN parseInt setTimeout".split(" "),D="[object Arguments]",$="[object Array]",T="[object Boolean]",F="[object Date]",B="[object Function]",W="[object Number]",q="[object Object]",z="[object RegExp]",P="[object String]",K={};
K[B]=false,K[D]=K[$]=K[T]=K[F]=K[W]=K[q]=K[z]=K[P]=true;var L={leading:false,maxWait:0,trailing:false},M={configurable:false,enumerable:false,value:null,writable:false},V={"boolean":false,"function":true,object:true,number:false,string:false,undefined:false},U={"\\":"\\","'":"'","\n":"n","\r":"r","\t":"t","\u2028":"u2028","\u2029":"u2029"},G=V[typeof window]&&window||this,H=V[typeof exports]&&exports&&!exports.nodeType&&exports,J=V[typeof module]&&module&&!module.nodeType&&module,Q=J&&J.exports===H&&H,X=V[typeof global]&&global;!X||X.global!==X&&X.window!==X||(G=X);
var Y=s();typeof define=="function"&&typeof define.amd=="object"&&define.amd?(G._=Y, define(function(){return Y})):H&&J?Q?(J.exports=Y)._=Y:H._=Y:G._=Y}).call(this);
},{}],19:[function(require,module,exports){
//! moment.js
//! version : 2.5.1
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com
(function(a){function b(){return{empty:!1,unusedTokens:[],unusedInput:[],overflow:-2,charsLeftOver:0,nullInput:!1,invalidMonth:null,invalidFormat:!1,userInvalidated:!1,iso:!1}}function c(a,b){return function(c){return k(a.call(this,c),b)}}function d(a,b){return function(c){return this.lang().ordinal(a.call(this,c),b)}}function e(){}function f(a){w(a),h(this,a)}function g(a){var b=q(a),c=b.year||0,d=b.month||0,e=b.week||0,f=b.day||0,g=b.hour||0,h=b.minute||0,i=b.second||0,j=b.millisecond||0;this._milliseconds=+j+1e3*i+6e4*h+36e5*g,this._days=+f+7*e,this._months=+d+12*c,this._data={},this._bubble()}function h(a,b){for(var c in b)b.hasOwnProperty(c)&&(a[c]=b[c]);return b.hasOwnProperty("toString")&&(a.toString=b.toString),b.hasOwnProperty("valueOf")&&(a.valueOf=b.valueOf),a}function i(a){var b,c={};for(b in a)a.hasOwnProperty(b)&&qb.hasOwnProperty(b)&&(c[b]=a[b]);return c}function j(a){return 0>a?Math.ceil(a):Math.floor(a)}function k(a,b,c){for(var d=""+Math.abs(a),e=a>=0;d.length<b;)d="0"+d;return(e?c?"+":"":"-")+d}function l(a,b,c,d){var e,f,g=b._milliseconds,h=b._days,i=b._months;g&&a._d.setTime(+a._d+g*c),(h||i)&&(e=a.minute(),f=a.hour()),h&&a.date(a.date()+h*c),i&&a.month(a.month()+i*c),g&&!d&&db.updateOffset(a),(h||i)&&(a.minute(e),a.hour(f))}function m(a){return"[object Array]"===Object.prototype.toString.call(a)}function n(a){return"[object Date]"===Object.prototype.toString.call(a)||a instanceof Date}function o(a,b,c){var d,e=Math.min(a.length,b.length),f=Math.abs(a.length-b.length),g=0;for(d=0;e>d;d++)(c&&a[d]!==b[d]||!c&&s(a[d])!==s(b[d]))&&g++;return g+f}function p(a){if(a){var b=a.toLowerCase().replace(/(.)s$/,"$1");a=Tb[a]||Ub[b]||b}return a}function q(a){var b,c,d={};for(c in a)a.hasOwnProperty(c)&&(b=p(c),b&&(d[b]=a[c]));return d}function r(b){var c,d;if(0===b.indexOf("week"))c=7,d="day";else{if(0!==b.indexOf("month"))return;c=12,d="month"}db[b]=function(e,f){var g,h,i=db.fn._lang[b],j=[];if("number"==typeof e&&(f=e,e=a),h=function(a){var b=db().utc().set(d,a);return i.call(db.fn._lang,b,e||"")},null!=f)return h(f);for(g=0;c>g;g++)j.push(h(g));return j}}function s(a){var b=+a,c=0;return 0!==b&&isFinite(b)&&(c=b>=0?Math.floor(b):Math.ceil(b)),c}function t(a,b){return new Date(Date.UTC(a,b+1,0)).getUTCDate()}function u(a){return v(a)?366:365}function v(a){return a%4===0&&a%100!==0||a%400===0}function w(a){var b;a._a&&-2===a._pf.overflow&&(b=a._a[jb]<0||a._a[jb]>11?jb:a._a[kb]<1||a._a[kb]>t(a._a[ib],a._a[jb])?kb:a._a[lb]<0||a._a[lb]>23?lb:a._a[mb]<0||a._a[mb]>59?mb:a._a[nb]<0||a._a[nb]>59?nb:a._a[ob]<0||a._a[ob]>999?ob:-1,a._pf._overflowDayOfYear&&(ib>b||b>kb)&&(b=kb),a._pf.overflow=b)}function x(a){return null==a._isValid&&(a._isValid=!isNaN(a._d.getTime())&&a._pf.overflow<0&&!a._pf.empty&&!a._pf.invalidMonth&&!a._pf.nullInput&&!a._pf.invalidFormat&&!a._pf.userInvalidated,a._strict&&(a._isValid=a._isValid&&0===a._pf.charsLeftOver&&0===a._pf.unusedTokens.length)),a._isValid}function y(a){return a?a.toLowerCase().replace("_","-"):a}function z(a,b){return b._isUTC?db(a).zone(b._offset||0):db(a).local()}function A(a,b){return b.abbr=a,pb[a]||(pb[a]=new e),pb[a].set(b),pb[a]}function B(a){delete pb[a]}function C(a){var b,c,d,e,f=0,g=function(a){if(!pb[a]&&rb)try{require("./lang/"+a)}catch(b){}return pb[a]};if(!a)return db.fn._lang;if(!m(a)){if(c=g(a))return c;a=[a]}for(;f<a.length;){for(e=y(a[f]).split("-"),b=e.length,d=y(a[f+1]),d=d?d.split("-"):null;b>0;){if(c=g(e.slice(0,b).join("-")))return c;if(d&&d.length>=b&&o(e,d,!0)>=b-1)break;b--}f++}return db.fn._lang}function D(a){return a.match(/\[[\s\S]/)?a.replace(/^\[|\]$/g,""):a.replace(/\\/g,"")}function E(a){var b,c,d=a.match(vb);for(b=0,c=d.length;c>b;b++)d[b]=Yb[d[b]]?Yb[d[b]]:D(d[b]);return function(e){var f="";for(b=0;c>b;b++)f+=d[b]instanceof Function?d[b].call(e,a):d[b];return f}}function F(a,b){return a.isValid()?(b=G(b,a.lang()),Vb[b]||(Vb[b]=E(b)),Vb[b](a)):a.lang().invalidDate()}function G(a,b){function c(a){return b.longDateFormat(a)||a}var d=5;for(wb.lastIndex=0;d>=0&&wb.test(a);)a=a.replace(wb,c),wb.lastIndex=0,d-=1;return a}function H(a,b){var c,d=b._strict;switch(a){case"DDDD":return Ib;case"YYYY":case"GGGG":case"gggg":return d?Jb:zb;case"Y":case"G":case"g":return Lb;case"YYYYYY":case"YYYYY":case"GGGGG":case"ggggg":return d?Kb:Ab;case"S":if(d)return Gb;case"SS":if(d)return Hb;case"SSS":if(d)return Ib;case"DDD":return yb;case"MMM":case"MMMM":case"dd":case"ddd":case"dddd":return Cb;case"a":case"A":return C(b._l)._meridiemParse;case"X":return Fb;case"Z":case"ZZ":return Db;case"T":return Eb;case"SSSS":return Bb;case"MM":case"DD":case"YY":case"GG":case"gg":case"HH":case"hh":case"mm":case"ss":case"ww":case"WW":return d?Hb:xb;case"M":case"D":case"d":case"H":case"h":case"m":case"s":case"w":case"W":case"e":case"E":return xb;default:return c=new RegExp(P(O(a.replace("\\","")),"i"))}}function I(a){a=a||"";var b=a.match(Db)||[],c=b[b.length-1]||[],d=(c+"").match(Qb)||["-",0,0],e=+(60*d[1])+s(d[2]);return"+"===d[0]?-e:e}function J(a,b,c){var d,e=c._a;switch(a){case"M":case"MM":null!=b&&(e[jb]=s(b)-1);break;case"MMM":case"MMMM":d=C(c._l).monthsParse(b),null!=d?e[jb]=d:c._pf.invalidMonth=b;break;case"D":case"DD":null!=b&&(e[kb]=s(b));break;case"DDD":case"DDDD":null!=b&&(c._dayOfYear=s(b));break;case"YY":e[ib]=s(b)+(s(b)>68?1900:2e3);break;case"YYYY":case"YYYYY":case"YYYYYY":e[ib]=s(b);break;case"a":case"A":c._isPm=C(c._l).isPM(b);break;case"H":case"HH":case"h":case"hh":e[lb]=s(b);break;case"m":case"mm":e[mb]=s(b);break;case"s":case"ss":e[nb]=s(b);break;case"S":case"SS":case"SSS":case"SSSS":e[ob]=s(1e3*("0."+b));break;case"X":c._d=new Date(1e3*parseFloat(b));break;case"Z":case"ZZ":c._useUTC=!0,c._tzm=I(b);break;case"w":case"ww":case"W":case"WW":case"d":case"dd":case"ddd":case"dddd":case"e":case"E":a=a.substr(0,1);case"gg":case"gggg":case"GG":case"GGGG":case"GGGGG":a=a.substr(0,2),b&&(c._w=c._w||{},c._w[a]=b)}}function K(a){var b,c,d,e,f,g,h,i,j,k,l=[];if(!a._d){for(d=M(a),a._w&&null==a._a[kb]&&null==a._a[jb]&&(f=function(b){var c=parseInt(b,10);return b?b.length<3?c>68?1900+c:2e3+c:c:null==a._a[ib]?db().weekYear():a._a[ib]},g=a._w,null!=g.GG||null!=g.W||null!=g.E?h=Z(f(g.GG),g.W||1,g.E,4,1):(i=C(a._l),j=null!=g.d?V(g.d,i):null!=g.e?parseInt(g.e,10)+i._week.dow:0,k=parseInt(g.w,10)||1,null!=g.d&&j<i._week.dow&&k++,h=Z(f(g.gg),k,j,i._week.doy,i._week.dow)),a._a[ib]=h.year,a._dayOfYear=h.dayOfYear),a._dayOfYear&&(e=null==a._a[ib]?d[ib]:a._a[ib],a._dayOfYear>u(e)&&(a._pf._overflowDayOfYear=!0),c=U(e,0,a._dayOfYear),a._a[jb]=c.getUTCMonth(),a._a[kb]=c.getUTCDate()),b=0;3>b&&null==a._a[b];++b)a._a[b]=l[b]=d[b];for(;7>b;b++)a._a[b]=l[b]=null==a._a[b]?2===b?1:0:a._a[b];l[lb]+=s((a._tzm||0)/60),l[mb]+=s((a._tzm||0)%60),a._d=(a._useUTC?U:T).apply(null,l)}}function L(a){var b;a._d||(b=q(a._i),a._a=[b.year,b.month,b.day,b.hour,b.minute,b.second,b.millisecond],K(a))}function M(a){var b=new Date;return a._useUTC?[b.getUTCFullYear(),b.getUTCMonth(),b.getUTCDate()]:[b.getFullYear(),b.getMonth(),b.getDate()]}function N(a){a._a=[],a._pf.empty=!0;var b,c,d,e,f,g=C(a._l),h=""+a._i,i=h.length,j=0;for(d=G(a._f,g).match(vb)||[],b=0;b<d.length;b++)e=d[b],c=(h.match(H(e,a))||[])[0],c&&(f=h.substr(0,h.indexOf(c)),f.length>0&&a._pf.unusedInput.push(f),h=h.slice(h.indexOf(c)+c.length),j+=c.length),Yb[e]?(c?a._pf.empty=!1:a._pf.unusedTokens.push(e),J(e,c,a)):a._strict&&!c&&a._pf.unusedTokens.push(e);a._pf.charsLeftOver=i-j,h.length>0&&a._pf.unusedInput.push(h),a._isPm&&a._a[lb]<12&&(a._a[lb]+=12),a._isPm===!1&&12===a._a[lb]&&(a._a[lb]=0),K(a),w(a)}function O(a){return a.replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g,function(a,b,c,d,e){return b||c||d||e})}function P(a){return a.replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&")}function Q(a){var c,d,e,f,g;if(0===a._f.length)return a._pf.invalidFormat=!0,a._d=new Date(0/0),void 0;for(f=0;f<a._f.length;f++)g=0,c=h({},a),c._pf=b(),c._f=a._f[f],N(c),x(c)&&(g+=c._pf.charsLeftOver,g+=10*c._pf.unusedTokens.length,c._pf.score=g,(null==e||e>g)&&(e=g,d=c));h(a,d||c)}function R(a){var b,c,d=a._i,e=Mb.exec(d);if(e){for(a._pf.iso=!0,b=0,c=Ob.length;c>b;b++)if(Ob[b][1].exec(d)){a._f=Ob[b][0]+(e[6]||" ");break}for(b=0,c=Pb.length;c>b;b++)if(Pb[b][1].exec(d)){a._f+=Pb[b][0];break}d.match(Db)&&(a._f+="Z"),N(a)}else a._d=new Date(d)}function S(b){var c=b._i,d=sb.exec(c);c===a?b._d=new Date:d?b._d=new Date(+d[1]):"string"==typeof c?R(b):m(c)?(b._a=c.slice(0),K(b)):n(c)?b._d=new Date(+c):"object"==typeof c?L(b):b._d=new Date(c)}function T(a,b,c,d,e,f,g){var h=new Date(a,b,c,d,e,f,g);return 1970>a&&h.setFullYear(a),h}function U(a){var b=new Date(Date.UTC.apply(null,arguments));return 1970>a&&b.setUTCFullYear(a),b}function V(a,b){if("string"==typeof a)if(isNaN(a)){if(a=b.weekdaysParse(a),"number"!=typeof a)return null}else a=parseInt(a,10);return a}function W(a,b,c,d,e){return e.relativeTime(b||1,!!c,a,d)}function X(a,b,c){var d=hb(Math.abs(a)/1e3),e=hb(d/60),f=hb(e/60),g=hb(f/24),h=hb(g/365),i=45>d&&["s",d]||1===e&&["m"]||45>e&&["mm",e]||1===f&&["h"]||22>f&&["hh",f]||1===g&&["d"]||25>=g&&["dd",g]||45>=g&&["M"]||345>g&&["MM",hb(g/30)]||1===h&&["y"]||["yy",h];return i[2]=b,i[3]=a>0,i[4]=c,W.apply({},i)}function Y(a,b,c){var d,e=c-b,f=c-a.day();return f>e&&(f-=7),e-7>f&&(f+=7),d=db(a).add("d",f),{week:Math.ceil(d.dayOfYear()/7),year:d.year()}}function Z(a,b,c,d,e){var f,g,h=U(a,0,1).getUTCDay();return c=null!=c?c:e,f=e-h+(h>d?7:0)-(e>h?7:0),g=7*(b-1)+(c-e)+f+1,{year:g>0?a:a-1,dayOfYear:g>0?g:u(a-1)+g}}function $(a){var b=a._i,c=a._f;return null===b?db.invalid({nullInput:!0}):("string"==typeof b&&(a._i=b=C().preparse(b)),db.isMoment(b)?(a=i(b),a._d=new Date(+b._d)):c?m(c)?Q(a):N(a):S(a),new f(a))}function _(a,b){db.fn[a]=db.fn[a+"s"]=function(a){var c=this._isUTC?"UTC":"";return null!=a?(this._d["set"+c+b](a),db.updateOffset(this),this):this._d["get"+c+b]()}}function ab(a){db.duration.fn[a]=function(){return this._data[a]}}function bb(a,b){db.duration.fn["as"+a]=function(){return+this/b}}function cb(a){var b=!1,c=db;"undefined"==typeof ender&&(a?(gb.moment=function(){return!b&&console&&console.warn&&(b=!0,console.warn("Accessing Moment through the global scope is deprecated, and will be removed in an upcoming release.")),c.apply(null,arguments)},h(gb.moment,c)):gb.moment=db)}for(var db,eb,fb="2.5.1",gb=this,hb=Math.round,ib=0,jb=1,kb=2,lb=3,mb=4,nb=5,ob=6,pb={},qb={_isAMomentObject:null,_i:null,_f:null,_l:null,_strict:null,_isUTC:null,_offset:null,_pf:null,_lang:null},rb="undefined"!=typeof module&&module.exports&&"undefined"!=typeof require,sb=/^\/?Date\((\-?\d+)/i,tb=/(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/,ub=/^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/,vb=/(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,4}|X|zz?|ZZ?|.)/g,wb=/(\[[^\[]*\])|(\\)?(LT|LL?L?L?|l{1,4})/g,xb=/\d\d?/,yb=/\d{1,3}/,zb=/\d{1,4}/,Ab=/[+\-]?\d{1,6}/,Bb=/\d+/,Cb=/[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i,Db=/Z|[\+\-]\d\d:?\d\d/gi,Eb=/T/i,Fb=/[\+\-]?\d+(\.\d{1,3})?/,Gb=/\d/,Hb=/\d\d/,Ib=/\d{3}/,Jb=/\d{4}/,Kb=/[+-]?\d{6}/,Lb=/[+-]?\d+/,Mb=/^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,Nb="YYYY-MM-DDTHH:mm:ssZ",Ob=[["YYYYYY-MM-DD",/[+-]\d{6}-\d{2}-\d{2}/],["YYYY-MM-DD",/\d{4}-\d{2}-\d{2}/],["GGGG-[W]WW-E",/\d{4}-W\d{2}-\d/],["GGGG-[W]WW",/\d{4}-W\d{2}/],["YYYY-DDD",/\d{4}-\d{3}/]],Pb=[["HH:mm:ss.SSSS",/(T| )\d\d:\d\d:\d\d\.\d{1,3}/],["HH:mm:ss",/(T| )\d\d:\d\d:\d\d/],["HH:mm",/(T| )\d\d:\d\d/],["HH",/(T| )\d\d/]],Qb=/([\+\-]|\d\d)/gi,Rb="Date|Hours|Minutes|Seconds|Milliseconds".split("|"),Sb={Milliseconds:1,Seconds:1e3,Minutes:6e4,Hours:36e5,Days:864e5,Months:2592e6,Years:31536e6},Tb={ms:"millisecond",s:"second",m:"minute",h:"hour",d:"day",D:"date",w:"week",W:"isoWeek",M:"month",y:"year",DDD:"dayOfYear",e:"weekday",E:"isoWeekday",gg:"weekYear",GG:"isoWeekYear"},Ub={dayofyear:"dayOfYear",isoweekday:"isoWeekday",isoweek:"isoWeek",weekyear:"weekYear",isoweekyear:"isoWeekYear"},Vb={},Wb="DDD w W M D d".split(" "),Xb="M D H h m s w W".split(" "),Yb={M:function(){return this.month()+1},MMM:function(a){return this.lang().monthsShort(this,a)},MMMM:function(a){return this.lang().months(this,a)},D:function(){return this.date()},DDD:function(){return this.dayOfYear()},d:function(){return this.day()},dd:function(a){return this.lang().weekdaysMin(this,a)},ddd:function(a){return this.lang().weekdaysShort(this,a)},dddd:function(a){return this.lang().weekdays(this,a)},w:function(){return this.week()},W:function(){return this.isoWeek()},YY:function(){return k(this.year()%100,2)},YYYY:function(){return k(this.year(),4)},YYYYY:function(){return k(this.year(),5)},YYYYYY:function(){var a=this.year(),b=a>=0?"+":"-";return b+k(Math.abs(a),6)},gg:function(){return k(this.weekYear()%100,2)},gggg:function(){return k(this.weekYear(),4)},ggggg:function(){return k(this.weekYear(),5)},GG:function(){return k(this.isoWeekYear()%100,2)},GGGG:function(){return k(this.isoWeekYear(),4)},GGGGG:function(){return k(this.isoWeekYear(),5)},e:function(){return this.weekday()},E:function(){return this.isoWeekday()},a:function(){return this.lang().meridiem(this.hours(),this.minutes(),!0)},A:function(){return this.lang().meridiem(this.hours(),this.minutes(),!1)},H:function(){return this.hours()},h:function(){return this.hours()%12||12},m:function(){return this.minutes()},s:function(){return this.seconds()},S:function(){return s(this.milliseconds()/100)},SS:function(){return k(s(this.milliseconds()/10),2)},SSS:function(){return k(this.milliseconds(),3)},SSSS:function(){return k(this.milliseconds(),3)},Z:function(){var a=-this.zone(),b="+";return 0>a&&(a=-a,b="-"),b+k(s(a/60),2)+":"+k(s(a)%60,2)},ZZ:function(){var a=-this.zone(),b="+";return 0>a&&(a=-a,b="-"),b+k(s(a/60),2)+k(s(a)%60,2)},z:function(){return this.zoneAbbr()},zz:function(){return this.zoneName()},X:function(){return this.unix()},Q:function(){return this.quarter()}},Zb=["months","monthsShort","weekdays","weekdaysShort","weekdaysMin"];Wb.length;)eb=Wb.pop(),Yb[eb+"o"]=d(Yb[eb],eb);for(;Xb.length;)eb=Xb.pop(),Yb[eb+eb]=c(Yb[eb],2);for(Yb.DDDD=c(Yb.DDD,3),h(e.prototype,{set:function(a){var b,c;for(c in a)b=a[c],"function"==typeof b?this[c]=b:this["_"+c]=b},_months:"January_February_March_April_May_June_July_August_September_October_November_December".split("_"),months:function(a){return this._months[a.month()]},_monthsShort:"Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),monthsShort:function(a){return this._monthsShort[a.month()]},monthsParse:function(a){var b,c,d;for(this._monthsParse||(this._monthsParse=[]),b=0;12>b;b++)if(this._monthsParse[b]||(c=db.utc([2e3,b]),d="^"+this.months(c,"")+"|^"+this.monthsShort(c,""),this._monthsParse[b]=new RegExp(d.replace(".",""),"i")),this._monthsParse[b].test(a))return b},_weekdays:"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),weekdays:function(a){return this._weekdays[a.day()]},_weekdaysShort:"Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),weekdaysShort:function(a){return this._weekdaysShort[a.day()]},_weekdaysMin:"Su_Mo_Tu_We_Th_Fr_Sa".split("_"),weekdaysMin:function(a){return this._weekdaysMin[a.day()]},weekdaysParse:function(a){var b,c,d;for(this._weekdaysParse||(this._weekdaysParse=[]),b=0;7>b;b++)if(this._weekdaysParse[b]||(c=db([2e3,1]).day(b),d="^"+this.weekdays(c,"")+"|^"+this.weekdaysShort(c,"")+"|^"+this.weekdaysMin(c,""),this._weekdaysParse[b]=new RegExp(d.replace(".",""),"i")),this._weekdaysParse[b].test(a))return b},_longDateFormat:{LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D YYYY",LLL:"MMMM D YYYY LT",LLLL:"dddd, MMMM D YYYY LT"},longDateFormat:function(a){var b=this._longDateFormat[a];return!b&&this._longDateFormat[a.toUpperCase()]&&(b=this._longDateFormat[a.toUpperCase()].replace(/MMMM|MM|DD|dddd/g,function(a){return a.slice(1)}),this._longDateFormat[a]=b),b},isPM:function(a){return"p"===(a+"").toLowerCase().charAt(0)},_meridiemParse:/[ap]\.?m?\.?/i,meridiem:function(a,b,c){return a>11?c?"pm":"PM":c?"am":"AM"},_calendar:{sameDay:"[Today at] LT",nextDay:"[Tomorrow at] LT",nextWeek:"dddd [at] LT",lastDay:"[Yesterday at] LT",lastWeek:"[Last] dddd [at] LT",sameElse:"L"},calendar:function(a,b){var c=this._calendar[a];return"function"==typeof c?c.apply(b):c},_relativeTime:{future:"in %s",past:"%s ago",s:"a few seconds",m:"a minute",mm:"%d minutes",h:"an hour",hh:"%d hours",d:"a day",dd:"%d days",M:"a month",MM:"%d months",y:"a year",yy:"%d years"},relativeTime:function(a,b,c,d){var e=this._relativeTime[c];return"function"==typeof e?e(a,b,c,d):e.replace(/%d/i,a)},pastFuture:function(a,b){var c=this._relativeTime[a>0?"future":"past"];return"function"==typeof c?c(b):c.replace(/%s/i,b)},ordinal:function(a){return this._ordinal.replace("%d",a)},_ordinal:"%d",preparse:function(a){return a},postformat:function(a){return a},week:function(a){return Y(a,this._week.dow,this._week.doy).week},_week:{dow:0,doy:6},_invalidDate:"Invalid date",invalidDate:function(){return this._invalidDate}}),db=function(c,d,e,f){var g;return"boolean"==typeof e&&(f=e,e=a),g={},g._isAMomentObject=!0,g._i=c,g._f=d,g._l=e,g._strict=f,g._isUTC=!1,g._pf=b(),$(g)},db.utc=function(c,d,e,f){var g;return"boolean"==typeof e&&(f=e,e=a),g={},g._isAMomentObject=!0,g._useUTC=!0,g._isUTC=!0,g._l=e,g._i=c,g._f=d,g._strict=f,g._pf=b(),$(g).utc()},db.unix=function(a){return db(1e3*a)},db.duration=function(a,b){var c,d,e,f=a,h=null;return db.isDuration(a)?f={ms:a._milliseconds,d:a._days,M:a._months}:"number"==typeof a?(f={},b?f[b]=a:f.milliseconds=a):(h=tb.exec(a))?(c="-"===h[1]?-1:1,f={y:0,d:s(h[kb])*c,h:s(h[lb])*c,m:s(h[mb])*c,s:s(h[nb])*c,ms:s(h[ob])*c}):(h=ub.exec(a))&&(c="-"===h[1]?-1:1,e=function(a){var b=a&&parseFloat(a.replace(",","."));return(isNaN(b)?0:b)*c},f={y:e(h[2]),M:e(h[3]),d:e(h[4]),h:e(h[5]),m:e(h[6]),s:e(h[7]),w:e(h[8])}),d=new g(f),db.isDuration(a)&&a.hasOwnProperty("_lang")&&(d._lang=a._lang),d},db.version=fb,db.defaultFormat=Nb,db.updateOffset=function(){},db.lang=function(a,b){var c;return a?(b?A(y(a),b):null===b?(B(a),a="en"):pb[a]||C(a),c=db.duration.fn._lang=db.fn._lang=C(a),c._abbr):db.fn._lang._abbr},db.langData=function(a){return a&&a._lang&&a._lang._abbr&&(a=a._lang._abbr),C(a)},db.isMoment=function(a){return a instanceof f||null!=a&&a.hasOwnProperty("_isAMomentObject")},db.isDuration=function(a){return a instanceof g},eb=Zb.length-1;eb>=0;--eb)r(Zb[eb]);for(db.normalizeUnits=function(a){return p(a)},db.invalid=function(a){var b=db.utc(0/0);return null!=a?h(b._pf,a):b._pf.userInvalidated=!0,b},db.parseZone=function(a){return db(a).parseZone()},h(db.fn=f.prototype,{clone:function(){return db(this)},valueOf:function(){return+this._d+6e4*(this._offset||0)},unix:function(){return Math.floor(+this/1e3)},toString:function(){return this.clone().lang("en").format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ")},toDate:function(){return this._offset?new Date(+this):this._d},toISOString:function(){var a=db(this).utc();return 0<a.year()&&a.year()<=9999?F(a,"YYYY-MM-DD[T]HH:mm:ss.SSS[Z]"):F(a,"YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]")},toArray:function(){var a=this;return[a.year(),a.month(),a.date(),a.hours(),a.minutes(),a.seconds(),a.milliseconds()]},isValid:function(){return x(this)},isDSTShifted:function(){return this._a?this.isValid()&&o(this._a,(this._isUTC?db.utc(this._a):db(this._a)).toArray())>0:!1},parsingFlags:function(){return h({},this._pf)},invalidAt:function(){return this._pf.overflow},utc:function(){return this.zone(0)},local:function(){return this.zone(0),this._isUTC=!1,this},format:function(a){var b=F(this,a||db.defaultFormat);return this.lang().postformat(b)},add:function(a,b){var c;return c="string"==typeof a?db.duration(+b,a):db.duration(a,b),l(this,c,1),this},subtract:function(a,b){var c;return c="string"==typeof a?db.duration(+b,a):db.duration(a,b),l(this,c,-1),this},diff:function(a,b,c){var d,e,f=z(a,this),g=6e4*(this.zone()-f.zone());return b=p(b),"year"===b||"month"===b?(d=432e5*(this.daysInMonth()+f.daysInMonth()),e=12*(this.year()-f.year())+(this.month()-f.month()),e+=(this-db(this).startOf("month")-(f-db(f).startOf("month")))/d,e-=6e4*(this.zone()-db(this).startOf("month").zone()-(f.zone()-db(f).startOf("month").zone()))/d,"year"===b&&(e/=12)):(d=this-f,e="second"===b?d/1e3:"minute"===b?d/6e4:"hour"===b?d/36e5:"day"===b?(d-g)/864e5:"week"===b?(d-g)/6048e5:d),c?e:j(e)},from:function(a,b){return db.duration(this.diff(a)).lang(this.lang()._abbr).humanize(!b)},fromNow:function(a){return this.from(db(),a)},calendar:function(){var a=z(db(),this).startOf("day"),b=this.diff(a,"days",!0),c=-6>b?"sameElse":-1>b?"lastWeek":0>b?"lastDay":1>b?"sameDay":2>b?"nextDay":7>b?"nextWeek":"sameElse";return this.format(this.lang().calendar(c,this))},isLeapYear:function(){return v(this.year())},isDST:function(){return this.zone()<this.clone().month(0).zone()||this.zone()<this.clone().month(5).zone()},day:function(a){var b=this._isUTC?this._d.getUTCDay():this._d.getDay();return null!=a?(a=V(a,this.lang()),this.add({d:a-b})):b},month:function(a){var b,c=this._isUTC?"UTC":"";return null!=a?"string"==typeof a&&(a=this.lang().monthsParse(a),"number"!=typeof a)?this:(b=this.date(),this.date(1),this._d["set"+c+"Month"](a),this.date(Math.min(b,this.daysInMonth())),db.updateOffset(this),this):this._d["get"+c+"Month"]()},startOf:function(a){switch(a=p(a)){case"year":this.month(0);case"month":this.date(1);case"week":case"isoWeek":case"day":this.hours(0);case"hour":this.minutes(0);case"minute":this.seconds(0);case"second":this.milliseconds(0)}return"week"===a?this.weekday(0):"isoWeek"===a&&this.isoWeekday(1),this},endOf:function(a){return a=p(a),this.startOf(a).add("isoWeek"===a?"week":a,1).subtract("ms",1)},isAfter:function(a,b){return b="undefined"!=typeof b?b:"millisecond",+this.clone().startOf(b)>+db(a).startOf(b)},isBefore:function(a,b){return b="undefined"!=typeof b?b:"millisecond",+this.clone().startOf(b)<+db(a).startOf(b)},isSame:function(a,b){return b=b||"ms",+this.clone().startOf(b)===+z(a,this).startOf(b)},min:function(a){return a=db.apply(null,arguments),this>a?this:a},max:function(a){return a=db.apply(null,arguments),a>this?this:a},zone:function(a){var b=this._offset||0;return null==a?this._isUTC?b:this._d.getTimezoneOffset():("string"==typeof a&&(a=I(a)),Math.abs(a)<16&&(a=60*a),this._offset=a,this._isUTC=!0,b!==a&&l(this,db.duration(b-a,"m"),1,!0),this)},zoneAbbr:function(){return this._isUTC?"UTC":""},zoneName:function(){return this._isUTC?"Coordinated Universal Time":""},parseZone:function(){return this._tzm?this.zone(this._tzm):"string"==typeof this._i&&this.zone(this._i),this},hasAlignedHourOffset:function(a){return a=a?db(a).zone():0,(this.zone()-a)%60===0},daysInMonth:function(){return t(this.year(),this.month())},dayOfYear:function(a){var b=hb((db(this).startOf("day")-db(this).startOf("year"))/864e5)+1;return null==a?b:this.add("d",a-b)},quarter:function(){return Math.ceil((this.month()+1)/3)},weekYear:function(a){var b=Y(this,this.lang()._week.dow,this.lang()._week.doy).year;return null==a?b:this.add("y",a-b)},isoWeekYear:function(a){var b=Y(this,1,4).year;return null==a?b:this.add("y",a-b)},week:function(a){var b=this.lang().week(this);return null==a?b:this.add("d",7*(a-b))},isoWeek:function(a){var b=Y(this,1,4).week;return null==a?b:this.add("d",7*(a-b))},weekday:function(a){var b=(this.day()+7-this.lang()._week.dow)%7;return null==a?b:this.add("d",a-b)},isoWeekday:function(a){return null==a?this.day()||7:this.day(this.day()%7?a:a-7)},get:function(a){return a=p(a),this[a]()},set:function(a,b){return a=p(a),"function"==typeof this[a]&&this[a](b),this},lang:function(b){return b===a?this._lang:(this._lang=C(b),this)}}),eb=0;eb<Rb.length;eb++)_(Rb[eb].toLowerCase().replace(/s$/,""),Rb[eb]);_("year","FullYear"),db.fn.days=db.fn.day,db.fn.months=db.fn.month,db.fn.weeks=db.fn.week,db.fn.isoWeeks=db.fn.isoWeek,db.fn.toJSON=db.fn.toISOString,h(db.duration.fn=g.prototype,{_bubble:function(){var a,b,c,d,e=this._milliseconds,f=this._days,g=this._months,h=this._data;h.milliseconds=e%1e3,a=j(e/1e3),h.seconds=a%60,b=j(a/60),h.minutes=b%60,c=j(b/60),h.hours=c%24,f+=j(c/24),h.days=f%30,g+=j(f/30),h.months=g%12,d=j(g/12),h.years=d},weeks:function(){return j(this.days()/7)},valueOf:function(){return this._milliseconds+864e5*this._days+this._months%12*2592e6+31536e6*s(this._months/12)},humanize:function(a){var b=+this,c=X(b,!a,this.lang());return a&&(c=this.lang().pastFuture(b,c)),this.lang().postformat(c)},add:function(a,b){var c=db.duration(a,b);return this._milliseconds+=c._milliseconds,this._days+=c._days,this._months+=c._months,this._bubble(),this},subtract:function(a,b){var c=db.duration(a,b);return this._milliseconds-=c._milliseconds,this._days-=c._days,this._months-=c._months,this._bubble(),this},get:function(a){return a=p(a),this[a.toLowerCase()+"s"]()},as:function(a){return a=p(a),this["as"+a.charAt(0).toUpperCase()+a.slice(1)+"s"]()},lang:db.fn.lang,toIsoString:function(){var a=Math.abs(this.years()),b=Math.abs(this.months()),c=Math.abs(this.days()),d=Math.abs(this.hours()),e=Math.abs(this.minutes()),f=Math.abs(this.seconds()+this.milliseconds()/1e3);return this.asSeconds()?(this.asSeconds()<0?"-":"")+"P"+(a?a+"Y":"")+(b?b+"M":"")+(c?c+"D":"")+(d||e||f?"T":"")+(d?d+"H":"")+(e?e+"M":"")+(f?f+"S":""):"P0D"}});for(eb in Sb)Sb.hasOwnProperty(eb)&&(bb(eb,Sb[eb]),ab(eb.toLowerCase()));bb("Weeks",6048e5),db.duration.fn.asMonths=function(){return(+this-31536e6*this.years())/2592e6+12*this.years()},db.lang("en",{ordinal:function(a){var b=a%10,c=1===s(a%100/10)?"th":1===b?"st":2===b?"nd":3===b?"rd":"th";return a+c}}),rb?(module.exports=db,cb(!0)):"function"==typeof define&&define.amd?define("moment",function(b,c,d){return d.config&&d.config()&&d.config().noGlobal!==!0&&cb(d.config().noGlobal===a),db}):cb()}).call(this);
},{}],20:[function(require,module,exports){
/* mousetrap v1.4.6 craig.is/killing/mice */
(function(J,r,f){function s(a,b,d){a.addEventListener?a.addEventListener(b,d,!1):a.attachEvent("on"+b,d)}function A(a){if("keypress"==a.type){var b=String.fromCharCode(a.which);a.shiftKey||(b=b.toLowerCase());return b}return h[a.which]?h[a.which]:B[a.which]?B[a.which]:String.fromCharCode(a.which).toLowerCase()}function t(a){a=a||{};var b=!1,d;for(d in n)a[d]?b=!0:n[d]=0;b||(u=!1)}function C(a,b,d,c,e,v){var g,k,f=[],h=d.type;if(!l[a])return[];"keyup"==h&&w(a)&&(b=[a]);for(g=0;g<l[a].length;++g)if(k=
l[a][g],!(!c&&k.seq&&n[k.seq]!=k.level||h!=k.action||("keypress"!=h||d.metaKey||d.ctrlKey)&&b.sort().join(",")!==k.modifiers.sort().join(","))){var m=c&&k.seq==c&&k.level==v;(!c&&k.combo==e||m)&&l[a].splice(g,1);f.push(k)}return f}function K(a){var b=[];a.shiftKey&&b.push("shift");a.altKey&&b.push("alt");a.ctrlKey&&b.push("ctrl");a.metaKey&&b.push("meta");return b}function x(a,b,d,c){m.stopCallback(b,b.target||b.srcElement,d,c)||!1!==a(b,d)||(b.preventDefault?b.preventDefault():b.returnValue=!1,b.stopPropagation?
b.stopPropagation():b.cancelBubble=!0)}function y(a){"number"!==typeof a.which&&(a.which=a.keyCode);var b=A(a);b&&("keyup"==a.type&&z===b?z=!1:m.handleKey(b,K(a),a))}function w(a){return"shift"==a||"ctrl"==a||"alt"==a||"meta"==a}function L(a,b,d,c){function e(b){return function(){u=b;++n[a];clearTimeout(D);D=setTimeout(t,1E3)}}function v(b){x(d,b,a);"keyup"!==c&&(z=A(b));setTimeout(t,10)}for(var g=n[a]=0;g<b.length;++g){var f=g+1===b.length?v:e(c||E(b[g+1]).action);F(b[g],f,c,a,g)}}function E(a,b){var d,
c,e,f=[];d="+"===a?["+"]:a.split("+");for(e=0;e<d.length;++e)c=d[e],G[c]&&(c=G[c]),b&&"keypress"!=b&&H[c]&&(c=H[c],f.push("shift")),w(c)&&f.push(c);d=c;e=b;if(!e){if(!p){p={};for(var g in h)95<g&&112>g||h.hasOwnProperty(g)&&(p[h[g]]=g)}e=p[d]?"keydown":"keypress"}"keypress"==e&&f.length&&(e="keydown");return{key:c,modifiers:f,action:e}}function F(a,b,d,c,e){q[a+":"+d]=b;a=a.replace(/\s+/g," ");var f=a.split(" ");1<f.length?L(a,f,b,d):(d=E(a,d),l[d.key]=l[d.key]||[],C(d.key,d.modifiers,{type:d.action},
c,a,e),l[d.key][c?"unshift":"push"]({callback:b,modifiers:d.modifiers,action:d.action,seq:c,level:e,combo:a}))}var h={8:"backspace",9:"tab",13:"enter",16:"shift",17:"ctrl",18:"alt",20:"capslock",27:"esc",32:"space",33:"pageup",34:"pagedown",35:"end",36:"home",37:"left",38:"up",39:"right",40:"down",45:"ins",46:"del",91:"meta",93:"meta",224:"meta"},B={106:"*",107:"+",109:"-",110:".",111:"/",186:";",187:"=",188:",",189:"-",190:".",191:"/",192:"`",219:"[",220:"\\",221:"]",222:"'"},H={"~":"`","!":"1",
"@":"2","#":"3",$:"4","%":"5","^":"6","&":"7","*":"8","(":"9",")":"0",_:"-","+":"=",":":";",'"':"'","<":",",">":".","?":"/","|":"\\"},G={option:"alt",command:"meta","return":"enter",escape:"esc",mod:/Mac|iPod|iPhone|iPad/.test(navigator.platform)?"meta":"ctrl"},p,l={},q={},n={},D,z=!1,I=!1,u=!1;for(f=1;20>f;++f)h[111+f]="f"+f;for(f=0;9>=f;++f)h[f+96]=f;s(r,"keypress",y);s(r,"keydown",y);s(r,"keyup",y);var m={bind:function(a,b,d){a=a instanceof Array?a:[a];for(var c=0;c<a.length;++c)F(a[c],b,d);return this},
unbind:function(a,b){return m.bind(a,function(){},b)},trigger:function(a,b){if(q[a+":"+b])q[a+":"+b]({},a);return this},reset:function(){l={};q={};return this},stopCallback:function(a,b){return-1<(" "+b.className+" ").indexOf(" mousetrap ")?!1:"INPUT"==b.tagName||"SELECT"==b.tagName||"TEXTAREA"==b.tagName||b.isContentEditable},handleKey:function(a,b,d){var c=C(a,b,d),e;b={};var f=0,g=!1;for(e=0;e<c.length;++e)c[e].seq&&(f=Math.max(f,c[e].level));for(e=0;e<c.length;++e)c[e].seq?c[e].level==f&&(g=!0,
b[c[e].seq]=1,x(c[e].callback,d,c[e].combo,c[e].seq)):g||x(c[e].callback,d,c[e].combo);c="keypress"==d.type&&I;d.type!=u||w(a)||c||t(b);I=g&&"keydown"==d.type}};J.Mousetrap=m;"function"===typeof define&&define.amd&&define(m)})(window,document);

module.exports = window.Mousetrap;
window.Mousetrap = null;
},{}],21:[function(require,module,exports){
/*

 JS Signals <http://millermedeiros.github.com/js-signals/>
 Released under the MIT license
 Author: Miller Medeiros
 Version: 1.0.0 - Build: 268 (2012/11/29 05:48 PM)
*/
(function(i){function h(a,b,c,d,e){this._listener=b;this._isOnce=c;this.context=d;this._signal=a;this._priority=e||0}function g(a,b){if(typeof a!=="function")throw Error("listener is a required param of {fn}() and should be a Function.".replace("{fn}",b));}function e(){this._bindings=[];this._prevParams=null;var a=this;this.dispatch=function(){e.prototype.dispatch.apply(a,arguments)}}h.prototype={active:!0,params:null,execute:function(a){var b;this.active&&this._listener&&(a=this.params?this.params.concat(a):
a,b=this._listener.apply(this.context,a),this._isOnce&&this.detach());return b},detach:function(){return this.isBound()?this._signal.remove(this._listener,this.context):null},isBound:function(){return!!this._signal&&!!this._listener},isOnce:function(){return this._isOnce},getListener:function(){return this._listener},getSignal:function(){return this._signal},_destroy:function(){delete this._signal;delete this._listener;delete this.context},toString:function(){return"[SignalBinding isOnce:"+this._isOnce+
", isBound:"+this.isBound()+", active:"+this.active+"]"}};e.prototype={VERSION:"1.0.0",memorize:!1,_shouldPropagate:!0,active:!0,_registerListener:function(a,b,c,d){var e=this._indexOfListener(a,c);if(e!==-1){if(a=this._bindings[e],a.isOnce()!==b)throw Error("You cannot add"+(b?"":"Once")+"() then add"+(!b?"":"Once")+"() the same listener without removing the relationship first.");}else a=new h(this,a,b,c,d),this._addBinding(a);this.memorize&&this._prevParams&&a.execute(this._prevParams);return a},
_addBinding:function(a){var b=this._bindings.length;do--b;while(this._bindings[b]&&a._priority<=this._bindings[b]._priority);this._bindings.splice(b+1,0,a)},_indexOfListener:function(a,b){for(var c=this._bindings.length,d;c--;)if(d=this._bindings[c],d._listener===a&&d.context===b)return c;return-1},has:function(a,b){return this._indexOfListener(a,b)!==-1},add:function(a,b,c){g(a,"add");return this._registerListener(a,!1,b,c)},addOnce:function(a,b,c){g(a,"addOnce");return this._registerListener(a,
!0,b,c)},remove:function(a,b){g(a,"remove");var c=this._indexOfListener(a,b);c!==-1&&(this._bindings[c]._destroy(),this._bindings.splice(c,1));return a},removeAll:function(){for(var a=this._bindings.length;a--;)this._bindings[a]._destroy();this._bindings.length=0},getNumListeners:function(){return this._bindings.length},halt:function(){this._shouldPropagate=!1},dispatch:function(a){if(this.active){var b=Array.prototype.slice.call(arguments),c=this._bindings.length,d;if(this.memorize)this._prevParams=
b;if(c){d=this._bindings.slice();this._shouldPropagate=!0;do c--;while(d[c]&&this._shouldPropagate&&d[c].execute(b)!==!1)}}},forget:function(){this._prevParams=null},dispose:function(){this.removeAll();delete this._bindings;delete this._prevParams},toString:function(){return"[Signal active:"+this.active+" numListeners:"+this.getNumListeners()+"]"}};var f=e;f.Signal=e;typeof define==="function"&&define.amd?define(function(){return f}):typeof module!=="undefined"&&module.exports?module.exports=f:i.signals=
f})(this);
},{}],22:[function(require,module,exports){

},{}]},{},[6])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9uYWhpbGFzL1Byb2pla3Rlci9NdXNpY1NlcnZlci9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9uYWhpbGFzL1Byb2pla3Rlci9NdXNpY1NlcnZlci9jbGllbnQvc2NyaXB0cy9hcGkuanMiLCIvaG9tZS9uYWhpbGFzL1Byb2pla3Rlci9NdXNpY1NlcnZlci9jbGllbnQvc2NyaXB0cy9hdWRpb2NvbnRyb2xzLmpzIiwiL2hvbWUvbmFoaWxhcy9Qcm9qZWt0ZXIvTXVzaWNTZXJ2ZXIvY2xpZW50L3NjcmlwdHMvYXVkaW9wbGF5ZXIuanMiLCIvaG9tZS9uYWhpbGFzL1Byb2pla3Rlci9NdXNpY1NlcnZlci9jbGllbnQvc2NyaXB0cy9kaWFsb2dzL2RpYWxvZy5qcyIsIi9ob21lL25haGlsYXMvUHJvamVrdGVyL011c2ljU2VydmVyL2NsaWVudC9zY3JpcHRzL2RpYWxvZ3MvbG9naW4uanMiLCIvaG9tZS9uYWhpbGFzL1Byb2pla3Rlci9NdXNpY1NlcnZlci9jbGllbnQvc2NyaXB0cy9mYWtlXzk4YWQyMTk4LmpzIiwiL2hvbWUvbmFoaWxhcy9Qcm9qZWt0ZXIvTXVzaWNTZXJ2ZXIvY2xpZW50L3NjcmlwdHMvbGlicmFyeS5qcyIsIi9ob21lL25haGlsYXMvUHJvamVrdGVyL011c2ljU2VydmVyL2NsaWVudC9zY3JpcHRzL21ldGFkYXRhLmpzIiwiL2hvbWUvbmFoaWxhcy9Qcm9qZWt0ZXIvTXVzaWNTZXJ2ZXIvY2xpZW50L3NjcmlwdHMvbmF2aWdhdGlvbi5qcyIsIi9ob21lL25haGlsYXMvUHJvamVrdGVyL011c2ljU2VydmVyL2NsaWVudC9zY3JpcHRzL3BsYXlsaXN0LmpzIiwiL2hvbWUvbmFoaWxhcy9Qcm9qZWt0ZXIvTXVzaWNTZXJ2ZXIvY2xpZW50L3NjcmlwdHMvcmVzcG9uc2l2ZS5qcyIsIi9ob21lL25haGlsYXMvUHJvamVrdGVyL011c2ljU2VydmVyL2NsaWVudC9zY3JpcHRzL3RlbXBsYXRlcy9kaWFsb2ctbG9naW4uanMiLCIvaG9tZS9uYWhpbGFzL1Byb2pla3Rlci9NdXNpY1NlcnZlci9jbGllbnQvc2NyaXB0cy90ZW1wbGF0ZXMvbmF2aWdhdGlvbi1hbGJ1bS5qcyIsIi9ob21lL25haGlsYXMvUHJvamVrdGVyL011c2ljU2VydmVyL2NsaWVudC9zY3JpcHRzL3RlbXBsYXRlcy9uYXZpZ2F0aW9uLWRlZmF1bHQuanMiLCIvaG9tZS9uYWhpbGFzL1Byb2pla3Rlci9NdXNpY1NlcnZlci9jbGllbnQvc2NyaXB0cy90ZW1wbGF0ZXMvcGxheWxpc3QtaXRlbS5qcyIsIi9ob21lL25haGlsYXMvUHJvamVrdGVyL011c2ljU2VydmVyL2NsaWVudC9zY3JpcHRzL3V0aWwuanMiLCIvaG9tZS9uYWhpbGFzL1Byb2pla3Rlci9NdXNpY1NlcnZlci9jbGllbnQvc2NyaXB0cy92ZW5kb3IvamFkZXJ1bnRpbWUuanMiLCIvaG9tZS9uYWhpbGFzL1Byb2pla3Rlci9NdXNpY1NlcnZlci9jbGllbnQvc2NyaXB0cy92ZW5kb3IvbG9kYXNoLm1pbi5qcyIsIi9ob21lL25haGlsYXMvUHJvamVrdGVyL011c2ljU2VydmVyL2NsaWVudC9zY3JpcHRzL3ZlbmRvci9tb21lbnQuanMiLCIvaG9tZS9uYWhpbGFzL1Byb2pla3Rlci9NdXNpY1NlcnZlci9jbGllbnQvc2NyaXB0cy92ZW5kb3IvbW91c2V0cmFwLm1pbi5qcyIsIi9ob21lL25haGlsYXMvUHJvamVrdGVyL011c2ljU2VydmVyL2NsaWVudC9zY3JpcHRzL3ZlbmRvci9zaWduYWxzLm1pbi5qcyIsIi9ob21lL25haGlsYXMvUHJvamVrdGVyL011c2ljU2VydmVyL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbGliL19lbXB0eS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDak5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGRiID0gZnVuY3Rpb24oKVxue1xuXHRyZXR1cm4gJC5hamF4KHtcblx0XHRtZXRob2Q6ICdQT1NUJyxcblx0XHR1cmw6ICcvYXBpL2RiJyxcblx0XHRjYWNoZTogZmFsc2UsXG5cdFx0Y29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcblx0XHRwcm9jZXNzRGF0YTogZmFsc2UsXG5cdFx0ZGF0YVR5cGU6ICdqc29uJ1xuXHR9KTtcbn1cblxudmFyIGF1dGhlbnRpY2F0ZSA9IGZ1bmN0aW9uKHVzZXJuYW1lLCBwYXNzd29yZClcbntcblx0cmV0dXJuICQuYWpheCh7XG5cdFx0bWV0aG9kOiAnUE9TVCcsXG5cdFx0dXJsOiAnL2FwaS9hdXRoZW50aWNhdGUnLFxuXHRcdGNhY2hlOiBmYWxzZSxcblx0XHRjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxuXHRcdGRhdGE6IEpTT04uc3RyaW5naWZ5KHsgdXNlcm5hbWU6IHVzZXJuYW1lLCBwYXNzd29yZDogcGFzc3dvcmQgfSksXG5cdFx0cHJvY2Vzc0RhdGE6IGZhbHNlLFxuXHRcdGRhdGFUeXBlOiAnanNvbidcblx0fSk7XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdGRiOiBkYixcblx0YXV0aGVudGljYXRlOiBhdXRoZW50aWNhdGVcbn07XG4iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpLFxuXHRhdWRpb3BsYXllciA9IHJlcXVpcmUoJy4vYXVkaW9wbGF5ZXIuanMnKSxcblx0cGxheWxpc3QgPSByZXF1aXJlKCcuL3BsYXlsaXN0LmpzJyksXG5cdGxpYnJhcnkgPSByZXF1aXJlKCcuL2xpYnJhcnkuanMnKSxcblx0JHByb2dyZXNzLCBcblx0JGR1cmF0aW9uLCBcblx0JHBvc2l0aW9uLCBcblx0JHNvbmcsIFxuXHQkYXJ0aXN0LCBcblx0JGFsYnVtLCBcblx0JHBhdXNlLCBcblx0JG5leHQsIFxuXHQkcHJldixcblx0JGNvdmVyLFxuXHQkY29udGVudCxcblx0JGxvZ287XG5cbiQoZnVuY3Rpb24oKSB7XG5cdCRwcm9ncmVzcyA9ICQoXCIjcHJvZ3Jlc3MgLmluZGljYXRvclwiKTtcblx0JGR1cmF0aW9uID0gJChcIiNkdXJhdGlvblwiKTtcblx0JHBvc2l0aW9uID0gJChcIiNwb3NpdGlvblwiKTtcblx0JHNvbmcgPSAkKFwiI3NvbmdcIik7XG5cdCRhcnRpc3QgPSAkKFwiI2FydGlzdFwiKTtcblx0JGFsYnVtID0gJChcIiNhbGJ1bVwiKTtcblx0JHBhdXNlID0gJChcIiNwYXVzZVwiKTtcblx0JG5leHQgPSAkKFwiI25leHRcIik7XG5cdCRwcmV2ID0gJChcIiNwcmV2XCIpO1xuXHQkY292ZXIgPSAkKFwiI2NvdmVyXCIpO1xuXHQkY29udGVudCA9ICQoXCIjcGxheWVyIC5jb250ZW50XCIpO1xuXHQkbG9nbyA9ICQoXCIjcGxheWVyIC5sb2dvXCIpO1xuXG5cdGF1ZGlvcGxheWVyLnBsYXllZC5hZGQob25QbGF5ZWQpO1xuXHRhdWRpb3BsYXllci51cGRhdGVkLmFkZChvblVwZGF0ZWQpO1xuXHRhdWRpb3BsYXllci5wYXVzZWQuYWRkKG9uUGF1c2VkKTtcblx0YXVkaW9wbGF5ZXIucmVzdW1lZC5hZGQob25SZXN1bWVkKTtcblxuXHRob29rdXBFdmVudHMoKTtcbn0pO1xuXG5mdW5jdGlvbiBvblBhdXNlZCgpIHtcblx0JHBhdXNlLnJlbW92ZUNsYXNzKCdwbGF5aW5nJyk7XG59XG5cbmZ1bmN0aW9uIG9uUmVzdW1lZCgpXG57XG5cdCRwYXVzZS5hZGRDbGFzcygncGxheWluZycpO1xufVxuXG5mdW5jdGlvbiBzZXRUZXh0KGl0ZW0pXG57XG5cdCRzb25nLmh0bWwoaXRlbS5zb25nKTtcblx0JGFydGlzdC5odG1sKGl0ZW0uYXJ0aXN0KTtcblx0JGFsYnVtLmh0bWwoaXRlbS5hbGJ1bSk7XG5cdCRjb3Zlci5hdHRyKCdzcmMnLCBsaWJyYXJ5LmdldENvdmVyKGl0ZW0uYXJ0aXN0LCBpdGVtLmFsYnVtLCAnbGFyZ2UnKSk7XG59XG5cbmZ1bmN0aW9uIG9uUGxheWVkKGl0ZW0pIHtcblx0dmFyIHRsID0gbmV3IFRpbWVsaW5lTGl0ZSgpO1xuXG5cdGlmKCRjb250ZW50Lmhhc0NsYXNzKCdoaWRlJykpIC8vYW5pbWF0ZSBsb2dvXG5cdHtcblxuXHRcdHRsLnRvKCRsb2dvLCAwLjUsIHsgcm90YXRpb25ZOiAnOTBkZWcnLCBvbkNvbXBsZXRlOiBmdW5jdGlvbigpIHtcblx0XHRcdCRsb2dvLmFkZENsYXNzKCdoaWRlJyk7XG5cdFx0XHQkY29udGVudC5yZW1vdmVDbGFzcygnaGlkZScpO1xuXHRcdH0gfSk7XG5cdFx0dGwuZnJvbVRvKCRjb250ZW50LCAwLjUsIHsgcm90YXRpb25ZOiAnLTkwZGVnJyB9LCB7IHJvdGF0aW9uWTogJzBkZWcnIH0pO1xuXG5cdFx0c2V0VGV4dChpdGVtKTtcblx0fVxuXHRlbHNlIHsgLy9hbmltYXRlIG5leHQgc29uZ1xuXHRcdHRsLnRvKFskc29uZywgJGFydGlzdCwgJGNvdmVyLCAkYWxidW1dLCAwLjI1LCB7IG9wYWNpdHk6IDAsIG9uQ29tcGxldGU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0c2V0VGV4dChpdGVtKTtcblx0XHR9IH0pO1xuXHRcdHRsLnRvKFskc29uZywgJGFydGlzdCwgJGNvdmVyLCAkYWxidW1dLCAwLjI1LCB7IG9wYWNpdHk6IDEgfSk7XG5cdH1cblxuXHR0bC5yZXN1bWUoKTtcblxuXHQkcGF1c2UuYWRkQ2xhc3MoJ3BsYXlpbmcnKTtcbn07XG5cblxuZnVuY3Rpb24gb25VcGRhdGVkKGR1cmF0aW9uLCBjdXJyZW50LCBwZXJjZW50KVxue1xuXHQkcHJvZ3Jlc3MuY3NzKFwid2lkdGhcIiwgcGVyY2VudCArIFwiJVwiKTtcblx0JHBvc2l0aW9uLmh0bWwodXRpbC5zZWNvbmRzVG9UaW1lKGN1cnJlbnQpKTtcblx0JGR1cmF0aW9uLmh0bWwodXRpbC5zZWNvbmRzVG9UaW1lKGR1cmF0aW9uKSk7XG59XG5cbmZ1bmN0aW9uIGhvb2t1cEV2ZW50cygpIHtcblx0JHBhdXNlLmNsaWNrKGZ1bmN0aW9uKCkge1xuXHRcdGlmKCFhdWRpb3BsYXllci5pc1BsYXlpbmcoKSlcblx0XHRcdGF1ZGlvcGxheWVyLnBsYXkoKTtcblx0XHRlbHNlXG5cdFx0XHRhdWRpb3BsYXllci5wYXVzZSgpO1xuXHR9KTtcblxuXHQkbmV4dC5jbGljayhmdW5jdGlvbigpIHsgcGxheWxpc3QubmV4dCgpOyB9KTtcblx0JHByZXYuY2xpY2soZnVuY3Rpb24oKSB7IHBsYXlsaXN0LnByZXYoKTsgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge307IiwidmFyICRqUGxheWVyLCBcblx0aXNQbGF5aW5nID0gZmFsc2UsIFxuXHRjdXJyZW50SXRlbSA9IG51bGwsXG5cdHNpZ25hbHMgPSByZXF1aXJlKCcuL3ZlbmRvci9zaWduYWxzLm1pbi5qcycpLFxuXHRhdWRpb3BsYXllciA9IHtcblx0XHRwbGF5ZWQ6IG5ldyBzaWduYWxzLlNpZ25hbCgpLFxuXHRcdHBhdXNlZDogbmV3IHNpZ25hbHMuU2lnbmFsKCksXG5cdFx0cmVzdW1lZDogbmV3IHNpZ25hbHMuU2lnbmFsKCksXG5cdFx0dXBkYXRlZDogbmV3IHNpZ25hbHMuU2lnbmFsKCksXG5cdFx0ZW5kZWQ6IG5ldyBzaWduYWxzLlNpZ25hbCgpLFxuXHRcdHBsYXk6IHBsYXksXG5cdFx0cGF1c2U6IHBhdXNlLFxuXHRcdGlzUGxheWluZzogZnVuY3Rpb24oKSB7IHJldHVybiBpc1BsYXlpbmc7IH1cblx0fTtcblxuJChmdW5jdGlvbigpIHtcblx0JGpQbGF5ZXIgPSAkKFwiI2pQbGF5ZXJcIik7XG5cdFxuXHQkalBsYXllci5qUGxheWVyKHsgXG5cdFx0c3VwcGxpZWQ6ICdtcDMnLFxuXHRcdHRpbWV1cGRhdGU6IHVwZGF0ZWQsXG5cdFx0ZW5kZWQ6IGZ1bmN0aW9uKCkge1xuXHRcdFx0cGxheWluZyA9IGZhbHNlO1xuXHRcdFx0YXVkaW9wbGF5ZXIuZW5kZWQuZGlzcGF0Y2goKTtcblx0XHR9XG5cdH0pO1xufSk7XG5cbmZ1bmN0aW9uIHVwZGF0ZWQoZSkge1xuXHR2YXIgZHVyYXRpb24gPSBlLmpQbGF5ZXIuc3RhdHVzLmR1cmF0aW9uID09PSAwID8gY3VycmVudEl0ZW0uZHVyYXRpb24gOiBlLmpQbGF5ZXIuc3RhdHVzLmR1cmF0aW9uO1xuXHR2YXIgY3VycmVudCA9IGUualBsYXllci5zdGF0dXMuY3VycmVudFRpbWU7XG5cdHZhciBwZXJjZW50ID0gKGN1cnJlbnQgLyBkdXJhdGlvbikgKiAxMDA7XG5cblx0YXVkaW9wbGF5ZXIudXBkYXRlZC5kaXNwYXRjaChkdXJhdGlvbiwgY3VycmVudCwgcGVyY2VudCk7XG59XG5cbmZ1bmN0aW9uIHBsYXkoaXRlbSlcbntcblx0aWYoaXRlbSkge1xuXHRcdGlzUGxheWluZyA9IHRydWU7XG5cdFx0Y3VycmVudEl0ZW0gPSBpdGVtO1xuXHRcdCRqUGxheWVyLmpQbGF5ZXIoXCJzZXRNZWRpYVwiLCB7XG5cdFx0XHRtcDM6IGl0ZW0uc3RyZWFtXG5cdFx0fSk7XG5cblx0XHQkalBsYXllci5qUGxheWVyKFwicGxheVwiKTtcblx0XHRhdWRpb3BsYXllci5wbGF5ZWQuZGlzcGF0Y2goaXRlbSk7XG5cdH1cblx0ZWxzZSBpZihjdXJyZW50SXRlbSlcblx0e1xuXHRcdGlzUGxheWluZyA9IHRydWU7XG5cdFx0YXVkaW9wbGF5ZXIucmVzdW1lZC5kaXNwYXRjaChpdGVtKTtcblx0XHQkalBsYXllci5qUGxheWVyKFwicGxheVwiKTtcblx0fVxufVxuXG5mdW5jdGlvbiBwYXVzZSgpXG57XG5cdGlzUGxheWluZyA9IGZhbHNlO1xuXHQkalBsYXllci5qUGxheWVyKFwicGF1c2VcIik7XG5cdGF1ZGlvcGxheWVyLnBhdXNlZC5kaXNwYXRjaCgpO1xufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gYXVkaW9wbGF5ZXI7IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihjb250ZW50KSB7XG5cdHZhciAkbWFpbiwgXG5cdFx0JGRpYWxvZyxcblx0XHQkZWxlbWVudDtcblxuXHRmdW5jdGlvbiBpbml0aWFsaXplKCkgXG5cdHtcblx0XHQkbWFpbiA9ICQoJyNtYWluJyk7XG5cdH1cblxuXHRmdW5jdGlvbiBzaG93KCkgXG5cdHtcblx0XHRpbml0aWFsaXplKCk7XG5cblx0XHQkZGlhbG9nID0gJCgnPGRpdiBjbGFzcz1cImRpYWxvZ1wiPjxkaXYgY2xhc3M9XCJjb250ZW50XCI+PC9kaXY+PC9kaXY+Jyk7XG5cdFx0JGRpYWxvZy5pbnNlcnRBZnRlcigkbWFpbik7XG5cblx0XHQkZWxlbWVudCA9ICRkaWFsb2cuZmluZChcIi5jb250ZW50XCIpO1xuXHRcdCRlbGVtZW50Lmh0bWwoY29udGVudCk7XG5cblx0XHRyZXR1cm4gYW5pbWF0ZVNob3coKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGFuaW1hdGVTaG93KCkge1xuXHRcdHZhciBkZWZlcnJlZCA9ICQuRGVmZXJyZWQoKTtcblx0XHRcblx0XHR2YXIgYW5pbSA9IFR3ZWVuTGl0ZS5mcm9tVG8oJGVsZW1lbnQsIFxuXHRcdFx0MC41LCBcblx0XHRcdHsgc2NhbGVYOiAwLCBzY2FsZVk6IDAgfSwgXG5cdFx0XHR7IHNjYWxlWDogMSwgc2NhbGVZOiAxLCBlYXNlOiBQb3dlcjIuZWFzZUluT3V0LCBvbkNvbXBsZXRlOiBmdW5jdGlvbigpIHsgZGVmZXJyZWQucmVzb2x2ZSgpOyB9IH0pO1xuXG5cdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2UoKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGFuaW1hdGVIaWRlKCkge1xuXHRcdHZhciBkZWZlcnJlZCA9ICQuRGVmZXJyZWQoKTtcblx0XHRcblx0XHRUd2VlbkxpdGUuZnJvbVRvKCRlbGVtZW50LCBcblx0XHRcdDAuMywgXG5cdFx0XHR7IHNjYWxlWDogMSwgc2NhbGVZOiAxIH0sIFxuXHRcdFx0eyBzY2FsZVg6IDAsIHNjYWxlWTogMCwgZWFzZTogUG93ZXIyLmVhc2VJbk91dCwgb25Db21wbGV0ZTogZnVuY3Rpb24oKSB7IGRlZmVycmVkLnJlc29sdmUoKTsgfSB9KTtcblxuXHRcdFR3ZWVuTGl0ZS50bygkZGlhbG9nLCAwLjMsIHsgb3BhY2l0eTogMCB9KTtcblxuXHRcdHJldHVybiBkZWZlcnJlZC5wcm9taXNlKCk7XG5cdH1cblxuXHRmdW5jdGlvbiBoaWRlKClcblx0e1xuXHRcdHZhciBkZWZlcnJlZCA9ICQuRGVmZXJyZWQoKTtcblxuXHRcdGFuaW1hdGVIaWRlKCkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdCRkaWFsb2cucmVtb3ZlKCk7XHRcblx0XHRcdGRlZmVycmVkLnJlc29sdmUoKTtcblx0XHR9KTtcblx0XHRcblx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZSgpO1xuXHR9XG5cblx0ZnVuY3Rpb24gc2hha2UoKSB7XG5cdFx0dmFyIHRsID0gbmV3IFRpbWVsaW5lTGl0ZSgpO1xuXG5cdFx0dGwudG8oJGVsZW1lbnQsIDAuMDUsIHtsZWZ0OiBcIi09MjVcIn0pO1xuXHRcdHRsLnRvKCRlbGVtZW50LCAwLjA1LCB7bGVmdDogXCIrPTUwXCJ9KTtcblx0XHR0bC50bygkZWxlbWVudCwgMC4wNSwge2xlZnQ6IFwiLT01MFwifSk7XG5cdFx0dGwudG8oJGVsZW1lbnQsIDAuMDUsIHtsZWZ0OiBcIis9NTBcIn0pO1xuXHRcdHRsLnRvKCRlbGVtZW50LCAwLjA1LCB7bGVmdDogXCItPTUwXCJ9KTtcblx0XHR0bC50bygkZWxlbWVudCwgMC4wNSwge2xlZnQ6IFwiKz0yNVwifSk7XG5cblx0XHR0bC5yZXN1bWUoKTtcblx0fVxuXG5cdHJldHVybiB7XG5cdFx0c2hvdzogc2hvdyxcblx0XHRoaWRlOiBoaWRlLFxuXHRcdHNoYWtlOiBzaGFrZSxcblx0XHRlbGVtZW50OiBmdW5jdGlvbigpIHsgcmV0dXJuICRlbGVtZW50OyB9XG5cdH1cbn07XG5cblxuIiwidmFyIGRpYWxvZyA9IHJlcXVpcmUoJy4vZGlhbG9nLmpzJyksXG5cdGxvZ2luRGlhbG9nLFxuXHR0ZW1wbGF0ZSA9IHJlcXVpcmUoJy4vLi4vdGVtcGxhdGVzL2RpYWxvZy1sb2dpbi5qcycpLFxuXHRkZWZlcnJlZCxcblx0JGZvcm0sXG5cdCRsb2dvLFxuXHQkdGl0bGUsXG5cdGFwaSA9IHJlcXVpcmUoJy4vLi4vYXBpLmpzJyk7XG5cblxuZnVuY3Rpb24gc2hvdygpIHtcblx0ZGVmZXJyZWQgPSAkLkRlZmVycmVkKCk7XG5cdGxvZ2luRGlhbG9nID0gZGlhbG9nKHRlbXBsYXRlKHtcblx0XHR1c2VybmFtZTogJC5jb29raWUoJ3VzZXJuYW1lJyksXG5cdFx0cGFzc3dvcmQ6ICQuY29va2llKCdwYXNzd29yZCcpXG5cdH0pKTtcblxuXHRsb2dpbkRpYWxvZy5zaG93KClcblx0aW5pdGlhbGl6ZSgpO1xuXHRcblx0cmV0dXJuIGRlZmVycmVkLnByb21pc2UoKTtcbn1cblxuXG5mdW5jdGlvbiBzdWJtaXQoKSB7XG5cdHZhciB1c2VybmFtZSA9ICQodGhpcykuZmluZCgnaW5wdXRbbmFtZT1cInVzZXJuYW1lXCJdJykudmFsKCk7XG5cdHZhciBwYXNzd29yZCA9ICQodGhpcykuZmluZCgnaW5wdXRbbmFtZT1cInBhc3N3b3JkXCJdJykudmFsKCk7XG5cblx0aWYodXNlcm5hbWUubGVuZ3RoID09PSAwIHx8IHBhc3N3b3JkLmxlbmd0aCA9PT0gMCkge1xuXHRcdHdyb25nQ3JlZGVudGlhbHMoKTtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRhcGkuYXV0aGVudGljYXRlKHVzZXJuYW1lLCBwYXNzd29yZClcblx0XHQuZG9uZShsb2dnZWRJbilcblx0XHQuZmFpbCh3cm9uZ0NyZWRlbnRpYWxzKTtcbn1cblxuZnVuY3Rpb24gd3JvbmdDcmVkZW50aWFscygpIHtcblx0bG9naW5EaWFsb2cuc2hha2UoKTtcbn1cblxuZnVuY3Rpb24gbG9nZ2VkSW4oKVxue1xuXHRzYXZlQ3JlZGVudGlhbHMoKTtcblx0bG9naW5EaWFsb2cuaGlkZSgpLnRoZW4oZGVmZXJyZWQucmVzb2x2ZSk7XG59XG5cbmZ1bmN0aW9uIGFuaW1hdGVMb2dvKCkge1xuXHRUd2VlbkxpdGUudG8oJGxvZ28sIDEuNSwge29wYWNpdHk6IDF9KTtcblx0VHdlZW5MaXRlLmZyb20oJGxvZ28sIDEuNSwge3JvdGF0aW9uWTogJzkwZGVnJ30pO1xuXG5cdFR3ZWVuTGl0ZS5mcm9tKCR0aXRsZSwgMS41LCB7cm90YXRpb25ZOiAnOTBkZWcnfSk7XG5cdFR3ZWVuTGl0ZS50bygkdGl0bGUsIDEuNSwge29wYWNpdHk6IDF9KTtcbn1cblxuZnVuY3Rpb24gc2F2ZUNyZWRlbnRpYWxzKClcbntcblx0dmFyIHJlbWVtYmVyTWUgPSAkZm9ybS5maW5kKCdpbnB1dFtuYW1lPVwicmVtZW1iZXJNZVwiXScpLmlzKCc6Y2hlY2tlZCcpO1xuXG5cdGlmKHJlbWVtYmVyTWUpXG5cdHtcblx0XHQkLmNvb2tpZSgndXNlcm5hbWUnLCAkZm9ybS5maW5kKCdpbnB1dFtuYW1lPVwidXNlcm5hbWVcIl0nKS52YWwoKSwgeyBleHBpcmVzOiA5OTk5IH0pO1xuXHRcdCQuY29va2llKCdwYXNzd29yZCcsICRmb3JtLmZpbmQoJ2lucHV0W25hbWU9XCJwYXNzd29yZFwiXScpLnZhbCgpLCB7IGV4cGlyZXM6IDk5OTkgfSk7XHRcblx0fVxuXHRlbHNlIFxuXHR7XG5cdFx0JC5yZW1vdmVDb29raWUoJ3VzZXJuYW1lJyk7XG5cdFx0JC5yZW1vdmVDb29raWUoJ3Bhc3N3b3JkJyk7XG5cdH1cbn1cblxuZnVuY3Rpb24gaW5pdGlhbGl6ZSgpIHtcblx0JGZvcm0gPSBsb2dpbkRpYWxvZy5lbGVtZW50KCkuZmluZCgnZm9ybScpO1xuXHQkbG9nbyA9IGxvZ2luRGlhbG9nLmVsZW1lbnQoKS5maW5kKCdpbWcnKTtcblx0JHRpdGxlID0gbG9naW5EaWFsb2cuZWxlbWVudCgpLmZpbmQoJ2gyJyk7XG5cblx0aWYoJC5jb29raWUoJ3VzZXJuYW1lJykpXG5cdFx0JGZvcm0uZmluZCgnaW5wdXRbbmFtZT1cInJlbWVtYmVyTWVcIl0nKS5wcm9wKCdjaGVja2VkJywgdHJ1ZSk7XG5cblx0JGZvcm0uc3VibWl0KGZ1bmN0aW9uKGUpIHtcblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cblx0XHRzdWJtaXQuY2FsbCh0aGlzKTtcblxuXHRcdHJldHVybiBmYWxzZTtcblx0fSk7XG5cblx0YW5pbWF0ZUxvZ28oKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdHNob3c6IHNob3dcbn07IiwidmFyIG5hdmlnYXRpb24gPSByZXF1aXJlKCcuL25hdmlnYXRpb24uanMnKSxcblx0YXVkaW9jb250cm9scyA9IHJlcXVpcmUoJy4vYXVkaW9jb250cm9scy5qcycpLFxuXHRsaWJyYXJ5ID0gcmVxdWlyZSgnLi9saWJyYXJ5LmpzJyksXG5cdG1ldGFkYXRhID0gcmVxdWlyZSgnLi9tZXRhZGF0YS5qcycpLFxuXHRyZXNwb25zaXZlID0gcmVxdWlyZSgnLi9yZXNwb25zaXZlLmpzJyksXG5cdGxvZ2luID0gcmVxdWlyZSgnLi9kaWFsb2dzL2xvZ2luLmpzJyk7XG5cblxuJChmdW5jdGlvbigpIHtcblxuXHQvL1Nob3cgbG9naW4gZGlhbG9nXG5cdGxvZ2luLnNob3coKVxuXHRcdC50aGVuKGxpYnJhcnkuaW5pdGlhbGl6ZSlcblx0XHQudGhlbihuYXZpZ2F0aW9uLmluaXRpYWxpemUpXG5cdFx0LnRoZW4obWV0YWRhdGEuaW5pdGlhbGl6ZSlcblx0XHQudGhlbihyZXNwb25zaXZlLmluaXRpYWxpemUpO1xufSk7XG4iLCJcbnZhciBkYXRhYmFzZSxcblx0XyA9IHJlcXVpcmUoJy4vdmVuZG9yL2xvZGFzaC5taW4uanMnKTtcblx0YXBpID0gcmVxdWlyZSgnLi9hcGkuanMnKTtcblxuXHRmdW5jdGlvbiBpbml0aWFsaXplKCkge1xuXHRcdHZhciBkZWZlcnJlZCA9ICQuRGVmZXJyZWQoKTtcblxuXHRcdGFwaS5kYigpLmRvbmUoZnVuY3Rpb24oZGIpIHtcblx0XHRcdGRhdGFiYXNlID0ge2l0ZW1zOiBkYn07XG5cdFx0XHRkZWZlcnJlZC5yZXNvbHZlKCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZSgpO1xuXHR9XG5cblxuXHRmdW5jdGlvbiBnZXQocGF0aClcblx0e1xuXHRcdGlmKCFwYXRoIHx8IHBhdGgubGVuZ3RoID09PSAwKVxuXHRcdFx0cmV0dXJuIGRhdGFiYXNlO1xuXHRcdFxuXHRcdHZhciBpdGVtID0gZGF0YWJhc2U7IFxuXHRcdF8uZWFjaChwYXRoLCBmdW5jdGlvbih4KSB7XG5cdFx0XHRpdGVtID0gXy5maW5kKGl0ZW0uaXRlbXMsIGZ1bmN0aW9uKHkpIHsgcmV0dXJuIHkubmFtZSA9PT0geDsgfSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gaXRlbTtcblx0fVxuXG5cdC8vQXJ0aXN0IGFuZCBhbGJ1bSBjYW4gYmUgZXh0cmFwb2xhdGVkIGZyb20gcGF0aC5cblx0ZnVuY3Rpb24gc2V0U29uZ0luZm8oaXRlbSwgcGF0aCkge1xuXHRcdGlmKHBhdGgubGVuZ3RoIDwgMilcblx0XHR7XG5cdFx0XHRpZighaXRlbS5zb25nKVxuXHRcdFx0XHRpdGVtLnNvbmcgPSBpdGVtLm5hbWU7XG5cdFx0XHRpdGVtLmFsYnVtID0gJ05BJztcblx0XHRcdGl0ZW0uYXJ0aXN0ID0gJ05BJztcblx0XHR9XG5cdFx0aWYocGF0aC5sZW5ndGggPT09IDIpXG5cdFx0e1xuXHRcdFx0aXRlbS5hcnRpc3QgPSBwYXRoWzBdO1xuXHRcdFx0aXRlbS5hbGJ1bSA9IHBhdGhbMV07XG5cdFx0XHRpZighaXRlbS5zb25nKVxuXHRcdFx0XHRpdGVtLnNvbmcgPSBpdGVtLm5hbWU7XG5cdFx0fSBcblx0XHRpZihwYXRoLmxlbmd0aCA+PSAzKVxuXHRcdHtcblx0XHRcdGl0ZW0uYXJ0aXN0ID0gcGF0aFswXTtcblx0XHRcdGl0ZW0uYWxidW0gPSBwYXRoWzFdO1xuXHRcdFx0XG5cdFx0XHRpZighaXRlbS5zb25nKVxuXHRcdFx0XHRpdGVtLnNvbmcgPSBpdGVtLm5hbWU7XG5cdFx0XHRcblx0XHRcdGZvcih2YXIgaSA9IDI7IGkgPCBwYXRoLmxlbmd0aDsgaSsrKVxuXHRcdFx0e1xuXHRcdFx0XHRpdGVtLmFsYnVtICs9ICcgLSAnICsgcGF0aFtpXTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHR2YXIgc3RyID0gJyc7XG5cdFx0Xy5lYWNoKHBhdGgsIGZ1bmN0aW9uKHgpIHtcblx0XHRcdHN0ciArPSB4ICsgJy8nXG5cdFx0fSk7XG5cdFx0c3RyICs9IGl0ZW0ubmFtZTtcblx0XHRpdGVtLnN0cmVhbSA9ICcvYXBpL3N0cmVhbT9wYXRoPScgKyBlbmNvZGVVUklDb21wb25lbnQoc3RyKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGdldE1ldGFEYXRhKCkge1xuXHRcdHZhciBhbGJ1bUNvdW50ID0gMDtcblx0XHR2YXIgdG90YWxEdXJhdGlvbiA9IDAuMDtcblx0XHR2YXIgc29uZ0NvdW50ID0gMDtcblxuXHRcdF8uZWFjaChkYXRhYmFzZS5pdGVtcywgZnVuY3Rpb24oeCkge1xuXHRcdFx0YWxidW1Db3VudCArPSB4Lml0ZW1zLmxlbmd0aDtcblxuXHRcdFx0dmFyIHNvbmdzID0gZ2V0U29uZ3MoW3gubmFtZV0pO1xuXHRcdFx0c29uZ0NvdW50ICs9IHNvbmdzLmxlbmd0aDtcblxuXHRcdFx0Xy5lYWNoKHNvbmdzLCBmdW5jdGlvbih5KSB7XG5cdFx0XHRcdGlmKGlzTmFOKHkuZHVyYXRpb24pKVxuXHRcdFx0XHRcdHJldHVybjtcblxuXHRcdFx0XHR0b3RhbER1cmF0aW9uICs9IHBhcnNlRmxvYXQoeS5kdXJhdGlvbik7XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRhbGJ1bXM6IGFsYnVtQ291bnQsXG5cdFx0XHRzb25nczogc29uZ0NvdW50LFxuXHRcdFx0ZHVyYXRpb246ICh0b3RhbER1cmF0aW9uIC8gNjApIC8gNjBcblx0XHR9O1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0Q292ZXIoYXJ0aXN0LCBhbGJ1bSwgc2l6ZSkge1xuXHRcdHZhciBhbGJ1bSA9IF8uZmluZChfLmZpbmQoZGF0YWJhc2UuaXRlbXMsIGZ1bmN0aW9uKHgpIHsgcmV0dXJuIHgubmFtZSA9PT0gYXJ0aXN0OyB9KS5pdGVtcywgZnVuY3Rpb24oeCkgeyByZXR1cm4geC5uYW1lID09PSBhbGJ1bTsgfSk7XG5cdFx0dmFyIGNvdmVyID0gXy5maW5kKGFsYnVtLmltYWdlcywgZnVuY3Rpb24oeSkgeyByZXR1cm4geS5zaXplID09PSBzaXplOyB9KTtcblxuXHRcdGlmKGNvdmVyICYmIGNvdmVyWycjdGV4dCddICE9PSAnJylcblx0XHR7XG5cdFx0XHRyZXR1cm4gY292ZXJbJyN0ZXh0J107XG5cdFx0fVx0XHRcblxuXHRcdHJldHVybiAnL2ltYWdlcy9uby1jb3Zlci5wbmcnO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0U29uZ3MocGF0aClcblx0e1xuXHRcdHZhciBzb25ncyA9IFtdO1xuXG5cdFx0dmFyIGdldFNvbmdzUmVjdXJzaXZlID0gZnVuY3Rpb24oaXRlbSwgY3VyclBhdGgpIHtcblx0XHRcdGlmKGl0ZW0uaXNGaWxlKVxuXHRcdFx0e1xuXHRcdFx0XHRjdXJyUGF0aC5wb3AoKTtcblx0XHRcdFx0c2V0U29uZ0luZm8oaXRlbSwgY3VyclBhdGgpO1xuXHRcdFx0XHRzb25ncy5wdXNoKGl0ZW0pXG5cblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRfLmVhY2goaXRlbS5pdGVtcywgZnVuY3Rpb24oeCkge1xuXHRcdFx0XHRpZih4LmlzRmlsZSkge1xuXHRcdFx0XHRcdHNldFNvbmdJbmZvKHgsIGN1cnJQYXRoKTtcblx0XHRcdFx0XHRzb25ncy5wdXNoKHgpO1xuXHRcdFx0XHR9IFxuXHRcdFx0XHRlbHNlIFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bmV4dFBhdGggPSBjdXJyUGF0aC5zbGljZSgwKTtcblx0XHRcdFx0XHRuZXh0UGF0aC5wdXNoKHgubmFtZSlcblx0XHRcdFx0XHRnZXRTb25nc1JlY3Vyc2l2ZSh4LCBuZXh0UGF0aCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGdldFNvbmdzUmVjdXJzaXZlKGdldChwYXRoKSwgcGF0aC5zbGljZSgwKSk7XG5cblx0XHRpZihzb25ncy5sZW5ndGggPiAwKSB7XG5cdFx0XHR2YXIgZ3JvdXBlZCA9IFtdO1xuXHRcdFx0Xy5lYWNoKF8uZ3JvdXBCeShzb25ncywgJ2FsYnVtJyksIGZ1bmN0aW9uKHgsIHApIHsgZ3JvdXBlZC5wdXNoKF8uc29ydEJ5KHgsICd0cmFjaycpKSB9KTtcblxuXHRcdFx0dmFyIGFsYnVtID0gZ3JvdXBlZC5wb3AoKTtcblx0XHRcdHZhciBzb25ncyA9IF8uc29ydEJ5KGFsYnVtLmNvbmNhdC5hcHBseShhbGJ1bSwgZ3JvdXBlZCksICdhbGJ1bScpO1xuXHRcdH1cblxuXHRcdHJldHVybiBzb25ncztcblx0fVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0aW5pdGlhbGl6ZTogaW5pdGlhbGl6ZSxcblx0Z2V0OiBnZXQsXG5cdGdldFNvbmdzOiBnZXRTb25ncyxcblx0Z2V0TWV0YURhdGE6IGdldE1ldGFEYXRhLFxuXHRnZXRDb3ZlcjogZ2V0Q292ZXJcbn07XG4iLCJ2YXIgJG1ldGFkYXRhLFxuXHRsaWJyYXJ5ID0gcmVxdWlyZSgnLi9saWJyYXJ5LmpzJyk7XG5cbmZ1bmN0aW9uIGluaXRpYWxpemUoKSB7XG5cdCRtZXRhZGF0YSA9ICQoXCIjbWV0YWRhdGFcIik7XG5cdHZhciBtZXRhID0gbGlicmFyeS5nZXRNZXRhRGF0YSgpO1xuXG5cdCRtZXRhZGF0YS5odG1sKCdMaWJyYXJ5OiAnICsgbWV0YS5hbGJ1bXMgKyAnIGFsYnVtcywgJyArIG1ldGEuc29uZ3MgKyAnIHNvbmdzLCAnICsgbWV0YS5kdXJhdGlvbi50b0ZpeGVkKDEpICsgJyBob3VycycpO1xuXHRcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cblx0aW5pdGlhbGl6ZTogaW5pdGlhbGl6ZVxuXG59OyIsInZhciBhcGkgPSByZXF1aXJlKCcuL2FwaS5qcycpO1xudmFyIHBsYXlsaXN0ID0gcmVxdWlyZSgnLi9wbGF5bGlzdC5qcycpO1xudmFyIGxpYnJhcnkgPSByZXF1aXJlKCcuL2xpYnJhcnkuanMnKTtcbnZhciBfID0gcmVxdWlyZSgnLi92ZW5kb3IvbG9kYXNoLm1pbi5qcycpO1xudmFyIGxldHRlcnMgPSBbXTtcbnZhciB0ZW1wbGF0ZXMgPSB7XG5cdGl0ZW1EZWZhdWx0OiByZXF1aXJlKCcuL3RlbXBsYXRlcy9uYXZpZ2F0aW9uLWRlZmF1bHQuanMnKSxcblx0aXRlbUFsYnVtOiByZXF1aXJlKCcuL3RlbXBsYXRlcy9uYXZpZ2F0aW9uLWFsYnVtLmpzJylcbn07XG5cbnZhciAkbGlzdCwgXG5cdCR1cCwgXG5cdCRhbHBoYWJldE5hdmlnYXRpb24sIFxuXHRjdXJyZW50UGF0aCA9IFtdLCBcblx0b3V0ZXJTY3JvbGwgPSAwO1xuXG4kKGZ1bmN0aW9uKCkge1xuXHQkbGlzdCA9ICQoXCIjbGlzdFwiKTtcblx0JHVwID0gJChcIiN1cFwiKTtcblx0JGFydGlzdCA9ICQoJ2gyLmFydGlzdCcpO1xuXHQkYWxwaGFiZXROYXZpZ2F0aW9uID0gJCgnI2FscGhhYmV0LW5hdmlnYXRpb24nKTtcblxuXHQkbGlzdC5vbignY2xpY2snLCAnbGknLCBmdW5jdGlvbigpIHtcblx0XHR2YXIgcGF0aCA9ICQodGhpcykuZGF0YSgncGF0aCcpO1xuXG5cdFx0aWYocGF0aCAmJiBwYXRoLmxlbmd0aCA9PT0gMSlcblx0XHRcdG5hdmlnYXRlKHBhdGgpO1xuXHR9KTtcblxuXHQkbGlzdC5vbignZGJsY2xpY2snLCAnbGknLCBmdW5jdGlvbigpIHtcblx0XHR2YXIgcGF0aCA9ICQodGhpcykuZGF0YSgncGF0aCcpO1xuXG5cdFx0aWYocGF0aCAmJiBwYXRoLmxlbmd0aCAhPT0gMSlcblx0XHRcdHBsYXkocGF0aCk7XG5cdH0pO1xuXG5cdCRsaXN0Lm9uKCdjbGljaycsICcuYWRkJywgZnVuY3Rpb24oZSkge1xuXHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0YWRkKCQodGhpcykucGFyZW50cygnbGknKS5kYXRhKCdwYXRoJykpO1xuXHR9KTtcblxuXHQkbGlzdC5vbignY2xpY2snLCAnLnBsYXknLCBmdW5jdGlvbihlKSB7XG5cdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRwbGF5KCQodGhpcykucGFyZW50cygnbGknKS5kYXRhKCdwYXRoJykpO1xuXHR9KTtcblxuXHQkdXAuY2xpY2sodXApO1xufSk7XG5cbmZ1bmN0aW9uIGFkZChwYXRoLCBiZWZvcmUpXG57XG5cdHBsYXlsaXN0LmFkZFNvbmdzKGxpYnJhcnkuZ2V0U29uZ3MocGF0aCksIGJlZm9yZSk7XG59XG5cbmZ1bmN0aW9uIHBsYXkocGF0aClcbntcblx0cGxheWxpc3QucGxheVNvbmdzKGxpYnJhcnkuZ2V0U29uZ3MocGF0aCkpO1xufVxuXG5mdW5jdGlvbiBpdGVtRHJhZ1N0YXJ0KGUpXG57XG5cdGUuZGF0YVRyYW5zZmVyLnNldERhdGEoXCJpdGVtXCIsIEpTT04uc3RyaW5naWZ5KCQoZS5zcmNFbGVtZW50KS5kYXRhKCdpdGVtJykpKTtcbn1cblxuXG5mdW5jdGlvbiB1cCgpIHtcblx0aWYoY3VycmVudFBhdGgubGVuZ3RoID09PSAwKVxuXHRcdHJldHVybjtcblxuXHRjdXJyZW50UGF0aC5wb3AoKTtcblxuXHRpZihjdXJyZW50UGF0aC5sZW5ndGggPT09IDApXG5cdFx0JHVwLmFkZENsYXNzKCdoaWRlJyk7XG5cblxuXHRwb3B1bGF0ZUxpc3QoY3VycmVudFBhdGgpO1xufVxuXG5mdW5jdGlvbiBuYXZpZ2F0ZShwYXRoKVxue1xuXHQkdXAucmVtb3ZlQ2xhc3MoJ2hpZGUnKTtcblx0cG9wdWxhdGVMaXN0KHBhdGgpO1xufVxuXG5mdW5jdGlvbiBzZXRCcmVhZGNydW1iKCkge1xuXHR2YXIgc3RyID0gXCJcIjtcblx0JC5lYWNoKGN1cnJlbnRQYXRoLCBmdW5jdGlvbihpLHgpIHsgc3RyICs9IHggKyBcIi9cIjsgfSk7XG5cdCRicmVhZGNydW1iLmh0bWwoc3RyLnN1YnN0cmluZygwLCBzdHIubGVuZ3RoIC0gMSkpO1xufVxuXG5mdW5jdGlvbiByZW5kZXJEZWZhdWx0KGl0ZW0sIHBhdGgsIHNob3dBbHBoYWJldClcbntcblx0dmFyIGxhc3RMZXR0ZXIgPSBudWxsO1xuXHQkLmVhY2goXy5zb3J0QnkoaXRlbS5pdGVtcywgJ25hbWUnKSwgZnVuY3Rpb24oaSx4KSB7XG5cdFx0dmFyIGxldHRlciA9IHgubmFtZS5zdWJzdHJpbmcoMCwxKVxuXG5cdFx0aWYoc2hvd0FscGhhYmV0ICYmIGxhc3RMZXR0ZXIgIT09IGxldHRlcilcblx0XHRcdCRsaXN0LmFwcGVuZCgnPGxpIGNsYXNzPVwiYWxwaGFiZXQtbGV0dGVyXCIgaWQ9XCInICsgbGV0dGVyICsgJ1wiPicgKyBsZXR0ZXIgKyAnPC9saT4nKVxuXG5cdFx0dmFyIGxpID0gJCh0ZW1wbGF0ZXMuaXRlbURlZmF1bHQoeCkpO1xuXHRcdCRsaXN0LmFwcGVuZChsaSk7XG5cblx0XHR2YXIgaXRlbVBhdGggPSBwYXRoLnNsaWNlKDApO1xuXHRcdGl0ZW1QYXRoLnB1c2goeC5uYW1lKTtcblx0XHQkKGxpKS5kYXRhKCdwYXRoJywgaXRlbVBhdGgpO1xuXG5cdFx0bGFzdExldHRlciA9IHgubmFtZS5zdWJzdHJpbmcoMCwxKTtcblx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBsaS5hZGRDbGFzcygnZW50ZXInKTsgfSwgMTApO1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyQXJ0aXN0KGl0ZW0sIHBhdGgpXG57XG5cdF8uZWFjaChpdGVtLml0ZW1zLCBmdW5jdGlvbih4KVxuXHR7XG5cdFx0dmFyIGNvdmVyID0gXy5maW5kKHguaW1hZ2VzLCBmdW5jdGlvbih5KSB7IHJldHVybiB5LnNpemUgPT09ICdleHRyYWxhcmdlJzsgfSk7XG5cdFx0eC5jb3ZlciA9IGNvdmVyID8gY292ZXJbJyN0ZXh0J10gOiBudWxsO1xuXG5cdFx0dmFyIGFsYnVtID0gJCh0ZW1wbGF0ZXMuaXRlbUFsYnVtKHgpKTtcblx0XHQkbGlzdC5hcHBlbmQoYWxidW0pXG5cblx0XHR2YXIgYWxidW1QYXRoID0gcGF0aC5zbGljZSgwKTtcblx0XHRhbGJ1bVBhdGgucHVzaCh4Lm5hbWUpO1xuXHRcdGFsYnVtLmRhdGEoJ3BhdGgnLCBhbGJ1bVBhdGgpO1xuXG5cdFx0cmVuZGVyRGVmYXVsdCh4LCBhbGJ1bVBhdGguc2xpY2UoMCkpO1xuXG5cdFx0c2V0VGltZW91dChmdW5jdGlvbigpIHsgYWxidW0uZmluZCgnLnJvdycpLmFkZENsYXNzKCdlbnRlcicpOyB9LCAxMCk7XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBvblNjcm9sbCgpIHtcblx0dXBkYXRlU3B5KCk7XG59XG5cbnZhciBkZXNlbGVjdExldHRlciA9IGZ1bmN0aW9uKGxldHRlcikgXG57XG5cdGxldHRlci5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XG5cdG5ldyBUd2VlbkxpdGUudG8obGV0dGVyLCAwLjIsIHsgY29sb3I6ICcjNjY2JywgYmFja2dyb3VuZENvbG9yOiAnI2RkZCcsIGVhc2U6IFBvd2VyMi5lYXNlSW5PdXQgfSk7XG59XG5cbnZhciBzZWxlY3RMZXR0ZXIgPSBmdW5jdGlvbihsZXR0ZXIpXG57XG5cdGxldHRlci5hZGRDbGFzcygnYWN0aXZlJyk7XG5cdG5ldyBUd2VlbkxpdGUudG8obGV0dGVyLCAwLjIsIHsgY29sb3I6ICcjZmZmJywgYmFja2dyb3VuZENvbG9yOiAnIzY2MzM2NicsIGVhc2U6IFBvd2VyMi5lYXNlSW5PdXQgfSk7XG59XG5cbnZhciB1cGRhdGVTcHkgPSBfLnRocm90dGxlKGZ1bmN0aW9uKCkge1xuXHQvL0ZpbmQgdGhlIG9uIGxhcmdlciB0aGFuIGN1cnJlbnQgc2Nyb2xsXG5cdHZhciBjdXJyU2Nyb2xsID0gJGxpc3Quc2Nyb2xsVG9wKCkgLSA3MDtcblxuXHRmb3IodmFyIGkgPSAwLCBsID0gbGV0dGVycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcblx0XHRpZihsZXR0ZXJzW2ldLnRvcCA+IGN1cnJTY3JvbGwpXG5cdFx0e1xuXHRcdFx0dmFyIGluZGV4ID0gaSAtIDE7XG5cblx0XHRcdGlmKGluZGV4IDwgMClcblx0XHRcdFx0aW5kZXggPSAwO1xuXG5cdFx0XHR2YXIgYWxwaGFiZXRMZXR0ZXIgPSAkYWxwaGFiZXROYXZpZ2F0aW9uLmZpbmQoJy5sZXR0ZXJbZGF0YS1pZD1cIicgKyBsZXR0ZXJzW2luZGV4XS5pZCArICdcIl0nKTtcblx0XHRcdHZhciBjdXJyZW50ID0gJGFscGhhYmV0TmF2aWdhdGlvbi5maW5kKCcubGV0dGVyLmFjdGl2ZScpO1xuXG5cdFx0XHRpZihjdXJyZW50LmRhdGEoJ2lkJykgIT09IGFscGhhYmV0TGV0dGVyLmRhdGEoJ2lkJykpIHtcblx0XHRcdFx0ZGVzZWxlY3RMZXR0ZXIoY3VycmVudCk7XG5cdFx0XHRcdHNlbGVjdExldHRlcihhbHBoYWJldExldHRlcik7XG5cdFx0XHR9XG5cdFx0XHRicmVhaztcblx0XHR9XG5cdH1cbn0sIDEwMCk7XG5cbmZ1bmN0aW9uIGluaXRpYWxpemVTY3JvbGxTcHkoKVxue1xuXHRsZXR0ZXJzID0gW107XG5cdCRsaXN0LmZpbmQoJy5hbHBoYWJldC1sZXR0ZXInKS5lYWNoKGZ1bmN0aW9uKGkseCkgXG5cdHtcblx0XHRsZXR0ZXJzLnB1c2goe1xuXHRcdFx0aWQ6ICQoeCkuYXR0cignaWQnKSxcblx0XHRcdHRvcDogJCh4KS5wb3NpdGlvbigpLnRvcCAtICQoeCkuaGVpZ2h0KCkgLSAzMCxcblx0XHRcdHBvc2l0aW9uWTogJCh4KS5wb3NpdGlvbigpLnRvcCArIDE1XG5cdFx0fSk7XG5cdH0pO1xuXG5cdC8vcmVuZGVyIG5hdmlnYXRpb25cblx0JGFscGhhYmV0TmF2aWdhdGlvbi5odG1sKCcnKTtcblxuXHR2YXIgbGV0dGVyUGVyY2VudCA9IDEwMCAvIGxldHRlcnMubGVuZ3RoO1xuXHRfLmVhY2gobGV0dGVycywgZnVuY3Rpb24oeCkgeyBcblx0XHR2YXIgbCA9ICc8ZGl2IGNsYXNzPVwibGV0dGVyXCIgc3R5bGU9XCJ3aWR0aDogJyArIGxldHRlclBlcmNlbnQgKyAnJVwiIGRhdGEtaWQ9XCInICsgeC5pZCArICdcIj4nICsgeC5pZCArICc8L2Rpdj4nO1xuXG5cdFx0JGFscGhhYmV0TmF2aWdhdGlvbi5hcHBlbmQobCk7XG5cdH0pO1xuXG5cblx0JGFscGhhYmV0TmF2aWdhdGlvbi5maW5kKCcubGV0dGVyJykuY2xpY2soZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGlkID0gJCh0aGlzKS5kYXRhKCdpZCcpO1xuXHRcdHZhciBsID0gXy5maW5kKGxldHRlcnMsIGZ1bmN0aW9uKHgpIHsgcmV0dXJuIHguaWQgPT09IGlkOyB9KTtcblxuXHRcdGlmKGwpXG5cdFx0XHQkbGlzdC5zY3JvbGxUb3AobC5wb3NpdGlvblkpO1xuXHR9KTtcblxuXHQkbGlzdC5zY3JvbGwob25TY3JvbGwpO1xuXG5cdHVwZGF0ZVNweSgpO1xufVxuXG5mdW5jdGlvbiBwb3B1bGF0ZUxpc3QocGF0aClcbntcblx0JGxpc3QuaHRtbCgnJyk7XG5cblx0cGF0aCA9IHBhdGggfHwgW107XG5cdGN1cnJlbnRQYXRoID0gcGF0aDtcblxuXHQkYXJ0aXN0Lmh0bWwocGF0aC5sZW5ndGggPT09IDAgPyAnTGlicmFyeScgOiBwYXRoWzBdKVxuXHQkbGlzdC5zY3JvbGxUb3AoMCk7XG5cblx0aWYoY3VycmVudFBhdGgubGVuZ3RoID09PSAxKVxuXHRcdHJlbmRlckFydGlzdChsaWJyYXJ5LmdldChjdXJyZW50UGF0aCksIGN1cnJlbnRQYXRoLnNsaWNlKDApKTtcblx0ZWxzZVxuXHRcdHJlbmRlckRlZmF1bHQobGlicmFyeS5nZXQoY3VycmVudFBhdGgpLCBjdXJyZW50UGF0aC5zbGljZSgwKSwgdHJ1ZSk7XG5cblx0aW5pdGlhbGl6ZVNjcm9sbFNweSgpO1xufVxuXG5mdW5jdGlvbiBpbml0aWFsaXplKCkge1xuXHR2YXIgZGVmZXJyZWQgPSAkLkRlZmVycmVkKCk7XG5cblx0cG9wdWxhdGVMaXN0KCk7XG5cdGRlZmVycmVkLnJlc29sdmUoKTtcblxuXHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZSgpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0aXRlbURyYWdTdGFydDogaXRlbURyYWdTdGFydCxcblx0YWRkOiBhZGQsXG5cdHBvcHVsYXRlOiBwb3B1bGF0ZUxpc3QsXG5cdGluaXRpYWxpemU6IGluaXRpYWxpemVcbn1cbiIsInZhciBhdWRpb3BsYXllciA9IHJlcXVpcmUoJy4vYXVkaW9wbGF5ZXIuanMnKSxcblx0YXBpID0gcmVxdWlyZSgnLi9hcGkuanMnKSxcblx0dXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpLFxuXHRtb3VzZXRyYXAgPSByZXF1aXJlKCcuL3ZlbmRvci9tb3VzZXRyYXAubWluLmpzJyksXG5cdGN1cnJlbnRTb25ncyA9IFtdLFxuXHRjdXJyZW50U29uZyA9IG51bGwsXG5cdGN1cnJlbnRJbmRleCA9IG51bGwsXG5cdGRyb3BJbmRleCA9IG51bGwsXG5cdCRwbGF5bGlzdCwgXG5cdGN1cnJlbnREcmFnLFxuXHRzZWxlY3RlZFJvd3MgPSBbXSxcblx0XyA9IHJlcXVpcmUoJy4vdmVuZG9yL2xvZGFzaC5taW4uanMnKSxcblx0dGVtcGxhdGVzID0ge1xuXHRcdGl0ZW06IHJlcXVpcmUoJy4vdGVtcGxhdGVzL3BsYXlsaXN0LWl0ZW0uanMnKVxuXHR9O1xuXG4kKGZ1bmN0aW9uKCkge1xuXG5cdCRwbGF5bGlzdCA9ICQoXCIjcGxheWxpc3QgdGFibGUgdGJvZHlcIik7XG5cblx0JHBsYXlsaXN0Lm9uKCdkYmxjbGljaycsICcuaXRlbScsIGZ1bmN0aW9uKGUpIHtcblx0XHR2YXIgY3VyciA9IHRoaXM7XG5cblx0XHQkcGxheWxpc3QuZmluZCgnLml0ZW0nKS5lYWNoKGZ1bmN0aW9uKGkseCkge1xuXHRcdFx0aWYoeCA9PT0gY3Vycilcblx0XHRcdHtcblx0XHRcdFx0Y3VycmVudEluZGV4ID0gaTtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0cGxheSgpO1xuXHR9KTtcblxuXHQkcGxheWxpc3Qub24oJ2NsaWNrJywgJy5pdGVtJywgZnVuY3Rpb24oZSkge1xuXHRcdGlmKGUuY3RybEtleSlcblx0XHR7XG5cdFx0XHRjdHJsU2VsZWN0LmNhbGwodGhpcyk7XG5cdFx0fVxuXHRcdGVsc2UgaWYoZS5zaGlmdEtleSlcblx0XHR7XG5cdFx0XHRzaGlmdFNlbGVjdC5jYWxsKHRoaXMpO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHNlbGVjdChbIHRoaXMgXSk7XG5cdFx0fVxuXHR9KTtcblxuXHRtb3VzZXRyYXAuYmluZCgnZGVsJywgZGVsZXRlU2VsZWN0ZWQpO1xuXG5cdCQoJyNwbGF5bGlzdCB0YWJsZScpLnNvcnRhYmxlKHtcblx0XHRjb250YWluZXJTZWxlY3RvcjogJ3RhYmxlJyxcblx0XHRpdGVtUGF0aDogJz4gdGJvZHknLFxuXHRcdGl0ZW1TZWxlY3RvcjogJ3RyJyxcblx0XHRwbGFjZWhvbGRlcjogJzx0ciBjbGFzcz1cInBsYWNlaG9sZGVyXCIvPicsXG5cdFx0b25Ecm9wOiBmdW5jdGlvbigkaXRlbSwgY29udGFpbmVyLCBfc3VwZXIpXG5cdFx0e1xuXHRcdFx0dmFyIG5ld09yZGVyID0gW107XG5cblx0XHRcdCRwbGF5bGlzdC5maW5kKCcuaXRlbScpLmVhY2goZnVuY3Rpb24oaSx4KSBcblx0XHRcdHtcblx0XHRcdFx0aWYoY3VycmVudFNvbmcgJiYgY3VycmVudFNvbmcuc3RyZWFtID09PSAkKHgpLmRhdGEoJ3N0cmVhbScpKVxuXHRcdFx0XHRcdGN1cnJlbnRJbmRleCA9IGk7XG5cblx0XHRcdFx0bmV3T3JkZXIucHVzaChfLmZpbmQoY3VycmVudFNvbmdzLCBmdW5jdGlvbih5KSB7XG5cdFx0XHRcdFx0cmV0dXJuIHkuc3RyZWFtID09PSAkKHgpLmRhdGEoJ3N0cmVhbScpO1xuXHRcdFx0XHR9KSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0Y3VycmVudFNvbmdzID0gbmV3T3JkZXI7XG5cdFx0XHRfc3VwZXIoJGl0ZW0pO1xuXHRcdH1cblx0fSk7XG5cblx0YXVkaW9wbGF5ZXIuZW5kZWQuYWRkKGZ1bmN0aW9uKCkgIHtcblx0XHRuZXh0KCk7XG5cdH0pO1xuXG5cdHJlbmRlcigpO1xufSk7XG5cbmZ1bmN0aW9uIGRlbGV0ZVNlbGVjdGVkKCkgXG57XG5cdGZvcih2YXIgaSA9IDA7IGkgPCBjdXJyZW50U29uZ3MubGVuZ3RoOyBpKyspXG5cdHtcblx0XHRpZihfLmZpbmQoc2VsZWN0ZWRSb3dzLCBmdW5jdGlvbih4KSB7IHJldHVybiBjdXJyZW50U29uZ3NbaV0uc3RyZWFtID09PSAkKHgpLmRhdGEoJ3N0cmVhbScpOyB9KSkge1xuXHRcdFx0Y3VycmVudFNvbmdzLnNwbGljZShpLCAxKTtcblx0XHRcdGktLTtcblx0XHR9XG5cdH1cblxuXHRjdXJyZW50SW5kZXggPSAwO1xuXHRyZW5kZXIoKTtcbn1cblxuZnVuY3Rpb24gc2hpZnRTZWxlY3QoKSB7XG5cdGlmKHNlbGVjdGVkUm93cy5sZW5ndGggPT09IDApXHRcblx0XHRyZXR1cm47XG5cblx0dmFyIGl0ZW1zID0gJHBsYXlsaXN0LmZpbmQoJy5pdGVtJyk7XG5cdHZhciBzdGFydEluZGV4ID0gMDtcblx0dmFyIGVuZEluZGV4ID0gMDtcblx0dmFyIGN1cnIgPSB0aGlzO1xuXG5cdGl0ZW1zLmVhY2goZnVuY3Rpb24oaSx4KSBcblx0e1xuXHRcdGlmKHggPT09IHNlbGVjdGVkUm93c1swXSlcblx0XHRcdHN0YXJ0SW5kZXggPSBpO1xuXG5cdFx0aWYoeCA9PT0gY3Vycilcblx0XHRcdGVuZEluZGV4ID0gaTtcblx0fSk7XG5cblx0aWYoc3RhcnRJbmRleCA+IGVuZEluZGV4KVxuXHR7XG5cdFx0dmFyIG4gPSBlbmRJbmRleDtcblx0XHRlbmRJbmRleCA9IHN0YXJ0SW5kZXg7XG5cdFx0c3RhcnRJbmRleCA9IG47XG5cdH1cblxuXHRzZWxlY3RlZFJvd3MgPSBpdGVtcy5zbGljZShzdGFydEluZGV4LCBlbmRJbmRleCArIDEpO1xuXHRzZWxlY3Qoc2VsZWN0ZWRSb3dzKTtcbn1cblxuZnVuY3Rpb24gY3RybFNlbGVjdCgpIHtcblx0aWYoIV8uY29udGFpbnMoc2VsZWN0ZWRSb3dzLCB0aGlzKSlcblx0e1xuXHRcdHNlbGVjdGVkUm93cy5wdXNoKHRoaXMpO1xuXHRcdHNlbGVjdChzZWxlY3RlZFJvd3MpO1xuXHR9XHRcbn1cblxuZnVuY3Rpb24gYWRkU29uZ3Moc29uZ3MsIGJlZm9yZSlcbntcblx0aWYoIWJlZm9yZSlcblx0XHRjdXJyZW50U29uZ3MgPSBjdXJyZW50U29uZ3MuY29uY2F0KHNvbmdzKTtcblx0ZWxzZSB7XG5cdFx0dmFyIGFmdGVyID0gY3VycmVudFNvbmdzLnNwbGljZShiZWZvcmUsIGN1cnJlbnRTb25ncy5sZW5ndGgpO1xuXHRcdGN1cnJlbnRTb25ncyA9IGN1cnJlbnRTb25ncy5jb25jYXQoc29uZ3MsIGFmdGVyKTtcblx0fVxuXG5cdHJlbmRlcigpO1xufVxuXG5mdW5jdGlvbiBzZWxlY3Qocm93cylcbntcblx0c2VsZWN0ZWRSb3dzID0gcm93cztcblxuXHQkcGxheWxpc3QuZmluZCgnLml0ZW0nKS5yZW1vdmVDbGFzcygnaW5mbycpO1xuXG5cdF8uZWFjaChyb3dzLCBmdW5jdGlvbih4KSB7XG5cdFx0JCh4KS5hZGRDbGFzcygnaW5mbycpXG5cdH0pO1xufVxuXG5mdW5jdGlvbiBwbGF5U29uZ3Moc29uZ3MpXG57XG5cdGN1cnJlbnRTb25ncyA9IFtdO1xuXG5cdGFkZFNvbmdzKHNvbmdzKTtcblx0Y3VycmVudEluZGV4ID0gMDsgXG5cdHBsYXkoKTsgXG59XG5cbmZ1bmN0aW9uIHBsYXkoKSB7XG5cdGlmKGN1cnJlbnRTb25ncy5sZW5ndGggPT09IDApXG5cdFx0cmV0dXJuO1xuXG5cdGlmKCFjdXJyZW50SW5kZXggfHwgY3VycmVudEluZGV4ID49IGN1cnJlbnRTb25ncy5sZW5ndGgpXG5cdFx0Y3VycmVudEluZGV4ID0gMDtcblxuXHRjdXJyZW50U29uZyA9IGN1cnJlbnRTb25nc1tjdXJyZW50SW5kZXhdO1xuXHRhdWRpb3BsYXllci5wbGF5KGN1cnJlbnRTb25nKTtcblx0XG5cdCRwbGF5bGlzdC5maW5kKCdzcGFuLnBsYXlpbmcnKS5hZGRDbGFzcygnaGlkZScpO1xuXHQkcGxheWxpc3QuZmluZCgnLml0ZW0nKS5lYWNoKGZ1bmN0aW9uKGkseCkge1xuXG5cdFx0aWYoJCh4KS5kYXRhKCdzdHJlYW0nKSA9PT0gY3VycmVudFNvbmcuc3RyZWFtKVxuXHRcdHtcblx0XHRcdCQoeCkuZmluZCgnLnBsYXlpbmcnKS5yZW1vdmVDbGFzcygnaGlkZScpO1xuXHRcdH1cblx0fSk7XG59XG5cbmZ1bmN0aW9uIG5leHQoKSB7XG5cdGN1cnJlbnRJbmRleCsrO1xuXHRwbGF5KCk7XG59XG5cbmZ1bmN0aW9uIHByZXYoKSB7XG5cdGlmKGN1cnJlbnRJbmRleCA9PT0gMClcblx0XHRyZXR1cm47XG5cblx0Y3VycmVudEluZGV4LS07XG5cdHBsYXkoKTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyKCkge1xuXHQkcGxheWxpc3QuaHRtbCgnJyk7XG5cblx0aWYoY3VycmVudFNvbmdzLmxlbmd0aCA+IDApIHtcblx0XHQkLmVhY2goY3VycmVudFNvbmdzLCBmdW5jdGlvbihpLHgpIHtcblx0XHRcdHZhciByb3cgPSAkKHRlbXBsYXRlcy5pdGVtKHtcblx0XHRcdFx0c3RyZWFtOiB4LnN0cmVhbSxcblx0XHRcdFx0c29uZzogeC5zb25nLFxuXHRcdFx0XHRwbGF5aW5nOiAoY3VycmVudFNvbmcgJiYgY3VycmVudFNvbmcuc3RyZWFtID09PSB4LnN0cmVhbSksXG5cdFx0XHRcdGFydGlzdDogeC5hcnRpc3QsXG5cdFx0XHRcdGFsYnVtOiB4LmFsYnVtLFxuXHRcdFx0XHRkdXJhdGlvbjogdXRpbC5zZWNvbmRzVG9UaW1lKHguZHVyYXRpb24pXG5cdFx0XHR9KSk7XG5cblx0XHRcdCRwbGF5bGlzdC5hcHBlbmQocm93KTtcblx0XHRcdHJvdy5kYXRhKCdpdGVtJywgeCk7XG5cdFx0fSk7XG5cdH1cblx0ZWxzZSB7XG5cdFx0JHBsYXlsaXN0Lmh0bWwoJzx0ZCBjbGFzcz1cImVtcHR5XCI+UGxheWxpc3QgaXMgZW1wdHkhIEFkZCBpdGVtcyB0byBzdGFydCBwbGF5aW5nIG11c2ljLjwvdGQ+Jyk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdGFkZFNvbmdzOiBhZGRTb25ncyxcblx0cHJldjogcHJldixcblx0bmV4dDogbmV4dCxcblx0cGxheVNvbmdzOiBwbGF5U29uZ3Ncbn0iLCJ2YXIgJGxpYnJhcnlCdXR0b24sICRsaWJyYXJ5LCAkcGxheWxpc3QsICRpY29uLCAkYmFja0J1dHRvbjtcblxuZnVuY3Rpb24gaW5pdGlhbGl6ZSgpIHtcblx0dmFyIGRlZmVycmVkID0gJC5EZWZlcnJlZCgpO1xuXG5cdCQoZnVuY3Rpb24oKSB7XG5cblx0XHQkbGlicmFyeUJ1dHRvbiA9ICQoJyNzdGF0dXMgLnJlc3BvbnNpdmUtbGlicmFyeS1idXR0b24nKTtcblx0XHQkbGlicmFyeSA9ICQoXCIjbGlzdC1jb250YWluZXJcIik7XG5cdFx0JHBsYXlsaXN0ID0gJChcIiNwbGF5bGlzdC1jb250YWluZXJcIik7XG5cdFx0JGljb24gPSAkKFwiI3N0YXR1cyBpbWdcIik7XG5cblx0XHRob29rdXBFdmVudHMoKTtcblxuXHRcdGRlZmVycmVkLnJlc29sdmUoKTtcblx0fSk7XG5cblx0cmV0dXJuIGRlZmVycmVkLnByb21pc2UoKTtcbn1cblxuZnVuY3Rpb24gaG9va3VwRXZlbnRzKCkge1xuXHQkbGlicmFyeUJ1dHRvbi5jbGljayhmdW5jdGlvbigpIHtcblxuXHRcdGlmKCQodGhpcykuaXMoJy5hY3RpdmUnKSlcblx0XHRcdGhpZGVMaWJyYXJ5KCk7XG5cdFx0ZWxzZVxuXHRcdFx0c2hvd0xpYnJhcnkoKTtcblx0fSk7XG59XG5cblxuZnVuY3Rpb24gaGlkZUxpYnJhcnkoKSB7XG5cdCRsaWJyYXJ5QnV0dG9uLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcblxuXHQkbGlicmFyeS5yZW1vdmVDbGFzcygndmlzaWJsZScpO1xuXHQkcGxheWxpc3QucmVtb3ZlQ2xhc3MoJ2hpZGUnKTtcbn1cblxuZnVuY3Rpb24gc2hvd0xpYnJhcnkoKSB7XG5cdCRsaWJyYXJ5QnV0dG9uLmFkZENsYXNzKCdhY3RpdmUnKTtcblxuXHQkbGlicmFyeS5hZGRDbGFzcygndmlzaWJsZScpO1xuXHQkcGxheWxpc3QuYWRkQ2xhc3MoJ2hpZGUnKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdGluaXRpYWxpemU6IGluaXRpYWxpemVcbn0iLCJqYWRlID0gcmVxdWlyZShcIi4vLi4vdmVuZG9yL2phZGVydW50aW1lLmpzXCIpO2Z1bmN0aW9uIHRlbXBsYXRlKGxvY2Fscykge1xudmFyIGJ1ZiA9IFtdO1xudmFyIGphZGVfbWl4aW5zID0ge307XG52YXIgbG9jYWxzXyA9IChsb2NhbHMgfHwge30pLHVzZXJuYW1lID0gbG9jYWxzXy51c2VybmFtZSxwYXNzd29yZCA9IGxvY2Fsc18ucGFzc3dvcmQ7XG5idWYucHVzaChcIjxwIGNsYXNzPVxcXCJ0ZXh0LWNlbnRlclxcXCI+PGltZyBzcmM9XFxcIi9pbWFnZXMvaWtvbi01MTIucG5nXFxcIiBzdHlsZT1cXFwid2lkdGg6IDEzMHB4OyBvcGFjaXR5OiAwO1xcXCIvPjwvcD48aDIgc3R5bGU9XFxcIm9wYWNpdHk6IDBcXFwiIGNsYXNzPVxcXCJ0ZXh0LWNlbnRlclxcXCI+TXVzaWNQbGF5ZXI8L2gyPjxwPiZuYnNwOzwvcD48ZGl2IGNsYXNzPVxcXCJyb3dcXFwiPjxkaXYgY2xhc3M9XFxcImNvbC1tZC04IGNvbC1tZC1vZmZzZXQtMlxcXCI+PGZvcm0+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cFxcXCI+PGxhYmVsIGZvcj1cXFwidXNlcm5hbWVcXFwiPlVzZXJuYW1lPC9sYWJlbD48aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgbmFtZT1cXFwidXNlcm5hbWVcXFwiXCIgKyAoamFkZS5hdHRyKFwidmFsdWVcIiwgdXNlcm5hbWUsIHRydWUsIGZhbHNlKSkgKyBcIiBjbGFzcz1cXFwiZm9ybS1jb250cm9sXFxcIi8+PC9kaXY+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cFxcXCI+PGxhYmVsIGZvcj1cXFwicGFzc3dvcmRcXFwiPlBhc3N3b3JkPC9sYWJlbD48aW5wdXQgdHlwZT1cXFwicGFzc3dvcmRcXFwiIG5hbWU9XFxcInBhc3N3b3JkXFxcIlwiICsgKGphZGUuYXR0cihcInZhbHVlXCIsIHBhc3N3b3JkLCB0cnVlLCBmYWxzZSkpICsgXCIgY2xhc3M9XFxcImZvcm0tY29udHJvbFxcXCIvPjwvZGl2PjxkaXYgY2xhc3M9XFxcInB1bGwtbGVmdFxcXCI+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cFxcXCI+PGRpdiBjbGFzcz1cXFwiY2hlY2tib3hcXFwiPjxsYWJlbD48aW5wdXQgdHlwZT1cXFwiY2hlY2tib3hcXFwiIG5hbWU9XFxcInJlbWVtYmVyTWVcXFwiLz48c3Bhbj5SZW1lbWJlciBtZTwvc3Bhbj48L2xhYmVsPjwvZGl2PjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcInB1bGwtcmlnaHRcXFwiPjxidXR0b24gY2xhc3M9XFxcImJ0biBidG4tcHJpbWFyeVxcXCI+TGV0J3Mgcm9jayE8L2J1dHRvbj48L2Rpdj48L2Zvcm0+PC9kaXY+PC9kaXY+XCIpOztyZXR1cm4gYnVmLmpvaW4oXCJcIik7XG59bW9kdWxlLmV4cG9ydHMgPSB0ZW1wbGF0ZTsiLCJqYWRlID0gcmVxdWlyZShcIi4vLi4vdmVuZG9yL2phZGVydW50aW1lLmpzXCIpO2Z1bmN0aW9uIHRlbXBsYXRlKGxvY2Fscykge1xudmFyIGJ1ZiA9IFtdO1xudmFyIGphZGVfbWl4aW5zID0ge307XG52YXIgbG9jYWxzXyA9IChsb2NhbHMgfHwge30pLGNvdmVyID0gbG9jYWxzXy5jb3ZlcixuYW1lID0gbG9jYWxzXy5uYW1lLGl0ZW1zID0gbG9jYWxzXy5pdGVtcztcbmJ1Zi5wdXNoKFwiPGxpIGNsYXNzPVxcXCJhbGJ1bVxcXCI+PGRpdiBjbGFzcz1cXFwicm93XFxcIj48ZGl2IGNsYXNzPVxcXCJjb2wteHMtNCBjb3ZlclxcXCI+PGltZ1wiICsgKGphZGUuYXR0cihcInNyY1wiLCAoY292ZXIgfHwgJy9pbWFnZXMvbm8tY292ZXIucG5nJyksIHRydWUsIGZhbHNlKSkgKyBcIi8+PC9kaXY+PGRpdiBjbGFzcz1cXFwiY29sLXhzLTggaW5mb1xcXCI+PGgzPlwiICsgKGphZGUuZXNjYXBlKG51bGwgPT0gKGphZGUuaW50ZXJwID0gbmFtZSkgPyBcIlwiIDogamFkZS5pbnRlcnApKSArIFwiPC9oMz48aDU+MjAwNzwvaDU+PGg1PlwiICsgKGphZGUuZXNjYXBlKG51bGwgPT0gKGphZGUuaW50ZXJwID0gKGl0ZW1zLmxlbmd0aCArIFwiIHNvbmdzXCIpKSA/IFwiXCIgOiBqYWRlLmludGVycCkpICsgXCI8L2g1PjxkaXYgY2xhc3M9XFxcImJ0bi1ncm91cFxcXCI+PGJ1dHRvbiBjbGFzcz1cXFwiYnRuIGJ0bi1kZWZhdWx0IHBsYXlcXFwiPjxzcGFuIGNsYXNzPVxcXCJnbHlwaGljb24gZ2x5cGhpY29uLXBsYXlcXFwiPjwvc3Bhbj48L2J1dHRvbj48YnV0dG9uIGNsYXNzPVxcXCJidG4gYnRuLWRlZmF1bHQgYWRkXFxcIj48c3BhbiBjbGFzcz1cXFwiZ2x5cGhpY29uIGdseXBoaWNvbi1sb2ctaW5cXFwiPjwvc3Bhbj48L2J1dHRvbj48L2Rpdj48L2Rpdj48L2Rpdj48L2xpPlwiKTs7cmV0dXJuIGJ1Zi5qb2luKFwiXCIpO1xufW1vZHVsZS5leHBvcnRzID0gdGVtcGxhdGU7IiwiamFkZSA9IHJlcXVpcmUoXCIuLy4uL3ZlbmRvci9qYWRlcnVudGltZS5qc1wiKTtmdW5jdGlvbiB0ZW1wbGF0ZShsb2NhbHMpIHtcbnZhciBidWYgPSBbXTtcbnZhciBqYWRlX21peGlucyA9IHt9O1xudmFyIGxvY2Fsc18gPSAobG9jYWxzIHx8IHt9KSxpc0ZpbGUgPSBsb2NhbHNfLmlzRmlsZSxzb25nID0gbG9jYWxzXy5zb25nLG5hbWUgPSBsb2NhbHNfLm5hbWU7XG5idWYucHVzaChcIjxsaSBjbGFzcz1cXFwiZ2VuZXJpY1xcXCI+XCIpO1xuaWYgKCBpc0ZpbGUpXG57XG5idWYucHVzaChcIjxzcGFuPlwiICsgKGphZGUuZXNjYXBlKG51bGwgPT0gKGphZGUuaW50ZXJwID0gc29uZykgPyBcIlwiIDogamFkZS5pbnRlcnApKSArIFwiPC9zcGFuPlwiKTtcbn1cbmVsc2VcbntcbmJ1Zi5wdXNoKFwiPHNwYW4+XCIgKyAoamFkZS5lc2NhcGUobnVsbCA9PSAoamFkZS5pbnRlcnAgPSBuYW1lKSA/IFwiXCIgOiBqYWRlLmludGVycCkpICsgXCI8L3NwYW4+PGRpdiBjbGFzcz1cXFwiYnRuLWdyb3VwIHB1bGwtcmlnaHRcXFwiPjxidXR0b24gY2xhc3M9XFxcImJ0biBidG4tZGVmYXVsdCBwbGF5XFxcIj48c3BhbiBjbGFzcz1cXFwiZ2x5cGhpY29uIGdseXBoaWNvbi1wbGF5XFxcIj48L3NwYW4+PC9idXR0b24+PGJ1dHRvbiBjbGFzcz1cXFwiYnRuIGJ0bi1kZWZhdWx0IGFkZFxcXCI+PHNwYW4gY2xhc3M9XFxcImdseXBoaWNvbiBnbHlwaGljb24tbG9nLWluXFxcIj48L3NwYW4+PC9idXR0b24+PC9kaXY+XCIpO1xufVxuYnVmLnB1c2goXCI8L2xpPlwiKTs7cmV0dXJuIGJ1Zi5qb2luKFwiXCIpO1xufW1vZHVsZS5leHBvcnRzID0gdGVtcGxhdGU7IiwiamFkZSA9IHJlcXVpcmUoXCIuLy4uL3ZlbmRvci9qYWRlcnVudGltZS5qc1wiKTtmdW5jdGlvbiB0ZW1wbGF0ZShsb2NhbHMpIHtcbnZhciBidWYgPSBbXTtcbnZhciBqYWRlX21peGlucyA9IHt9O1xudmFyIGxvY2Fsc18gPSAobG9jYWxzIHx8IHt9KSxzdHJlYW0gPSBsb2NhbHNfLnN0cmVhbSxwbGF5aW5nID0gbG9jYWxzXy5wbGF5aW5nLHNvbmcgPSBsb2NhbHNfLnNvbmcsYXJ0aXN0ID0gbG9jYWxzXy5hcnRpc3QsYWxidW0gPSBsb2NhbHNfLmFsYnVtLGR1cmF0aW9uID0gbG9jYWxzXy5kdXJhdGlvbjtcbmJ1Zi5wdXNoKFwiPHRyXCIgKyAoamFkZS5hdHRyKFwiZGF0YS1zdHJlYW1cIiwgc3RyZWFtLCB0cnVlLCBmYWxzZSkpICsgXCIgY2xhc3M9XFxcIml0ZW1cXFwiPjx0ZD48c3BhblwiICsgKGphZGUuY2xzKFsnZ2x5cGhpY29uJywnZ2x5cGhpY29uLXZvbHVtZS11cCcsJ3BsYXlpbmcnLCghcGxheWluZyA/ICdoaWRlJyA6ICcnKV0sIFtudWxsLG51bGwsbnVsbCx0cnVlXSkpICsgXCI+PC9zcGFuPjxzcGFuPlwiICsgKGphZGUuZXNjYXBlKG51bGwgPT0gKGphZGUuaW50ZXJwID0gc29uZykgPyBcIlwiIDogamFkZS5pbnRlcnApKSArIFwiPC9zcGFuPjxici8+PHNwYW4gc3R5bGU9XFxcImNvbG9yOiAjNzc3XFxcIj48c21hbGw+XCIgKyAoamFkZS5lc2NhcGUobnVsbCA9PSAoamFkZS5pbnRlcnAgPSAoYXJ0aXN0ICsgJywgJyArIGFsYnVtKSkgPyBcIlwiIDogamFkZS5pbnRlcnApKSArIFwiPC9zbWFsbD48L3NwYW4+PC90ZD48dGQgc3R5bGU9XFxcIndpZHRoOiA3MHB4XFxcIiBjbGFzcz1cXFwidGV4dC1jZW50ZXJcXFwiPlwiICsgKGphZGUuZXNjYXBlKG51bGwgPT0gKGphZGUuaW50ZXJwID0gZHVyYXRpb24pID8gXCJcIiA6IGphZGUuaW50ZXJwKSkgKyBcIjwvdGQ+PC90cj5cIik7O3JldHVybiBidWYuam9pbihcIlwiKTtcbn1tb2R1bGUuZXhwb3J0cyA9IHRlbXBsYXRlOyIsInZhciBtb21lbnQgPSByZXF1aXJlKCcuL3ZlbmRvci9tb21lbnQuanMnKTtcblxuZnVuY3Rpb24gc2Vjb25kc1RvVGltZShzZWMpXG57XG5cdHJldHVybiBtb21lbnQoKS5zdGFydE9mKCdkYXknKS5hZGQoJ3MnLCBzZWMpLmZvcm1hdCgnbW06c3MnKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0c2Vjb25kc1RvVGltZTogc2Vjb25kc1RvVGltZVxufTtcbiIsInZhciBnbG9iYWw9dHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9OyFmdW5jdGlvbihlKXtpZihcIm9iamVjdFwiPT10eXBlb2YgZXhwb3J0cyltb2R1bGUuZXhwb3J0cz1lKCk7ZWxzZSBpZihcImZ1bmN0aW9uXCI9PXR5cGVvZiBkZWZpbmUmJmRlZmluZS5hbWQpZGVmaW5lKGUpO2Vsc2V7dmFyIGY7XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz9mPXdpbmRvdzpcInVuZGVmaW5lZFwiIT10eXBlb2YgZ2xvYmFsP2Y9Z2xvYmFsOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmJiYoZj1zZWxmKSxmLmphZGU9ZSgpfX0oZnVuY3Rpb24oKXt2YXIgZGVmaW5lLG1vZHVsZSxleHBvcnRzO3JldHVybiAoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSh7MTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogTWVyZ2UgdHdvIGF0dHJpYnV0ZSBvYmplY3RzIGdpdmluZyBwcmVjZWRlbmNlXG4gKiB0byB2YWx1ZXMgaW4gb2JqZWN0IGBiYC4gQ2xhc3NlcyBhcmUgc3BlY2lhbC1jYXNlZFxuICogYWxsb3dpbmcgZm9yIGFycmF5cyBhbmQgbWVyZ2luZy9qb2luaW5nIGFwcHJvcHJpYXRlbHlcbiAqIHJlc3VsdGluZyBpbiBhIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gYVxuICogQHBhcmFtIHtPYmplY3R9IGJcbiAqIEByZXR1cm4ge09iamVjdH0gYVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZXhwb3J0cy5tZXJnZSA9IGZ1bmN0aW9uIG1lcmdlKGEsIGIpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICB2YXIgYXR0cnMgPSBhWzBdO1xuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgYXR0cnMgPSBtZXJnZShhdHRycywgYVtpXSk7XG4gICAgfVxuICAgIHJldHVybiBhdHRycztcbiAgfVxuICB2YXIgYWMgPSBhWydjbGFzcyddO1xuICB2YXIgYmMgPSBiWydjbGFzcyddO1xuXG4gIGlmIChhYyB8fCBiYykge1xuICAgIGFjID0gYWMgfHwgW107XG4gICAgYmMgPSBiYyB8fCBbXTtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoYWMpKSBhYyA9IFthY107XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGJjKSkgYmMgPSBbYmNdO1xuICAgIGFbJ2NsYXNzJ10gPSBhYy5jb25jYXQoYmMpLmZpbHRlcihudWxscyk7XG4gIH1cblxuICBmb3IgKHZhciBrZXkgaW4gYikge1xuICAgIGlmIChrZXkgIT0gJ2NsYXNzJykge1xuICAgICAgYVtrZXldID0gYltrZXldO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhO1xufTtcblxuLyoqXG4gKiBGaWx0ZXIgbnVsbCBgdmFsYHMuXG4gKlxuICogQHBhcmFtIHsqfSB2YWxcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBudWxscyh2YWwpIHtcbiAgcmV0dXJuIHZhbCAhPSBudWxsICYmIHZhbCAhPT0gJyc7XG59XG5cbi8qKlxuICogam9pbiBhcnJheSBhcyBjbGFzc2VzLlxuICpcbiAqIEBwYXJhbSB7Kn0gdmFsXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cbmV4cG9ydHMuam9pbkNsYXNzZXMgPSBqb2luQ2xhc3NlcztcbmZ1bmN0aW9uIGpvaW5DbGFzc2VzKHZhbCkge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheSh2YWwpID8gdmFsLm1hcChqb2luQ2xhc3NlcykuZmlsdGVyKG51bGxzKS5qb2luKCcgJykgOiB2YWw7XG59XG5cbi8qKlxuICogUmVuZGVyIHRoZSBnaXZlbiBjbGFzc2VzLlxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IGNsYXNzZXNcbiAqIEBwYXJhbSB7QXJyYXkuPEJvb2xlYW4+fSBlc2NhcGVkXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cbmV4cG9ydHMuY2xzID0gZnVuY3Rpb24gY2xzKGNsYXNzZXMsIGVzY2FwZWQpIHtcbiAgdmFyIGJ1ZiA9IFtdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGNsYXNzZXMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoZXNjYXBlZCAmJiBlc2NhcGVkW2ldKSB7XG4gICAgICBidWYucHVzaChleHBvcnRzLmVzY2FwZShqb2luQ2xhc3NlcyhbY2xhc3Nlc1tpXV0pKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJ1Zi5wdXNoKGpvaW5DbGFzc2VzKGNsYXNzZXNbaV0pKTtcbiAgICB9XG4gIH1cbiAgdmFyIHRleHQgPSBqb2luQ2xhc3NlcyhidWYpO1xuICBpZiAodGV4dC5sZW5ndGgpIHtcbiAgICByZXR1cm4gJyBjbGFzcz1cIicgKyB0ZXh0ICsgJ1wiJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gJyc7XG4gIH1cbn07XG5cbi8qKlxuICogUmVuZGVyIHRoZSBnaXZlbiBhdHRyaWJ1dGUuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGtleVxuICogQHBhcmFtIHtTdHJpbmd9IHZhbFxuICogQHBhcmFtIHtCb29sZWFufSBlc2NhcGVkXG4gKiBAcGFyYW0ge0Jvb2xlYW59IHRlcnNlXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cbmV4cG9ydHMuYXR0ciA9IGZ1bmN0aW9uIGF0dHIoa2V5LCB2YWwsIGVzY2FwZWQsIHRlcnNlKSB7XG4gIGlmICgnYm9vbGVhbicgPT0gdHlwZW9mIHZhbCB8fCBudWxsID09IHZhbCkge1xuICAgIGlmICh2YWwpIHtcbiAgICAgIHJldHVybiAnICcgKyAodGVyc2UgPyBrZXkgOiBrZXkgKyAnPVwiJyArIGtleSArICdcIicpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gJyc7XG4gICAgfVxuICB9IGVsc2UgaWYgKDAgPT0ga2V5LmluZGV4T2YoJ2RhdGEnKSAmJiAnc3RyaW5nJyAhPSB0eXBlb2YgdmFsKSB7XG4gICAgcmV0dXJuICcgJyArIGtleSArIFwiPSdcIiArIEpTT04uc3RyaW5naWZ5KHZhbCkucmVwbGFjZSgvJy9nLCAnJmFwb3M7JykgKyBcIidcIjtcbiAgfSBlbHNlIGlmIChlc2NhcGVkKSB7XG4gICAgcmV0dXJuICcgJyArIGtleSArICc9XCInICsgZXhwb3J0cy5lc2NhcGUodmFsKSArICdcIic7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuICcgJyArIGtleSArICc9XCInICsgdmFsICsgJ1wiJztcbiAgfVxufTtcblxuLyoqXG4gKiBSZW5kZXIgdGhlIGdpdmVuIGF0dHJpYnV0ZXMgb2JqZWN0LlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEBwYXJhbSB7T2JqZWN0fSBlc2NhcGVkXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cbmV4cG9ydHMuYXR0cnMgPSBmdW5jdGlvbiBhdHRycyhvYmosIHRlcnNlKXtcbiAgdmFyIGJ1ZiA9IFtdO1xuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMob2JqKTtcblxuICBpZiAoa2V5cy5sZW5ndGgpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpIHtcbiAgICAgIHZhciBrZXkgPSBrZXlzW2ldXG4gICAgICAgICwgdmFsID0gb2JqW2tleV07XG5cbiAgICAgIGlmICgnY2xhc3MnID09IGtleSkge1xuICAgICAgICBpZiAodmFsID0gam9pbkNsYXNzZXModmFsKSkge1xuICAgICAgICAgIGJ1Zi5wdXNoKCcgJyArIGtleSArICc9XCInICsgdmFsICsgJ1wiJyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJ1Zi5wdXNoKGV4cG9ydHMuYXR0cihrZXksIHZhbCwgZmFsc2UsIHRlcnNlKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJ1Zi5qb2luKCcnKTtcbn07XG5cbi8qKlxuICogRXNjYXBlIHRoZSBnaXZlbiBzdHJpbmcgb2YgYGh0bWxgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBodG1sXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5leHBvcnRzLmVzY2FwZSA9IGZ1bmN0aW9uIGVzY2FwZShodG1sKXtcbiAgdmFyIHJlc3VsdCA9IFN0cmluZyhodG1sKVxuICAgIC5yZXBsYWNlKC8mL2csICcmYW1wOycpXG4gICAgLnJlcGxhY2UoLzwvZywgJyZsdDsnKVxuICAgIC5yZXBsYWNlKC8+L2csICcmZ3Q7JylcbiAgICAucmVwbGFjZSgvXCIvZywgJyZxdW90OycpO1xuICBpZiAocmVzdWx0ID09PSAnJyArIGh0bWwpIHJldHVybiBodG1sO1xuICBlbHNlIHJldHVybiByZXN1bHQ7XG59O1xuXG4vKipcbiAqIFJlLXRocm93IHRoZSBnaXZlbiBgZXJyYCBpbiBjb250ZXh0IHRvIHRoZVxuICogdGhlIGphZGUgaW4gYGZpbGVuYW1lYCBhdCB0aGUgZ2l2ZW4gYGxpbmVub2AuXG4gKlxuICogQHBhcmFtIHtFcnJvcn0gZXJyXG4gKiBAcGFyYW0ge1N0cmluZ30gZmlsZW5hbWVcbiAqIEBwYXJhbSB7U3RyaW5nfSBsaW5lbm9cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmV4cG9ydHMucmV0aHJvdyA9IGZ1bmN0aW9uIHJldGhyb3coZXJyLCBmaWxlbmFtZSwgbGluZW5vLCBzdHIpe1xuICBpZiAoIShlcnIgaW5zdGFuY2VvZiBFcnJvcikpIHRocm93IGVycjtcbiAgaWYgKCh0eXBlb2Ygd2luZG93ICE9ICd1bmRlZmluZWQnIHx8ICFmaWxlbmFtZSkgJiYgIXN0cikge1xuICAgIGVyci5tZXNzYWdlICs9ICcgb24gbGluZSAnICsgbGluZW5vO1xuICAgIHRocm93IGVycjtcbiAgfVxuICB0cnkge1xuICAgIHN0ciA9ICBzdHIgfHwgcmVxdWlyZSgnZnMnKS5yZWFkRmlsZVN5bmMoZmlsZW5hbWUsICd1dGY4JylcbiAgfSBjYXRjaCAoZXgpIHtcbiAgICByZXRocm93KGVyciwgbnVsbCwgbGluZW5vKVxuICB9XG4gIHZhciBjb250ZXh0ID0gM1xuICAgICwgbGluZXMgPSBzdHIuc3BsaXQoJ1xcbicpXG4gICAgLCBzdGFydCA9IE1hdGgubWF4KGxpbmVubyAtIGNvbnRleHQsIDApXG4gICAgLCBlbmQgPSBNYXRoLm1pbihsaW5lcy5sZW5ndGgsIGxpbmVubyArIGNvbnRleHQpO1xuXG4gIC8vIEVycm9yIGNvbnRleHRcbiAgdmFyIGNvbnRleHQgPSBsaW5lcy5zbGljZShzdGFydCwgZW5kKS5tYXAoZnVuY3Rpb24obGluZSwgaSl7XG4gICAgdmFyIGN1cnIgPSBpICsgc3RhcnQgKyAxO1xuICAgIHJldHVybiAoY3VyciA9PSBsaW5lbm8gPyAnICA+ICcgOiAnICAgICcpXG4gICAgICArIGN1cnJcbiAgICAgICsgJ3wgJ1xuICAgICAgKyBsaW5lO1xuICB9KS5qb2luKCdcXG4nKTtcblxuICAvLyBBbHRlciBleGNlcHRpb24gbWVzc2FnZVxuICBlcnIucGF0aCA9IGZpbGVuYW1lO1xuICBlcnIubWVzc2FnZSA9IChmaWxlbmFtZSB8fCAnSmFkZScpICsgJzonICsgbGluZW5vXG4gICAgKyAnXFxuJyArIGNvbnRleHQgKyAnXFxuXFxuJyArIGVyci5tZXNzYWdlO1xuICB0aHJvdyBlcnI7XG59O1xuXG59LHtcImZzXCI6Mn1dLDI6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXG59LHt9XX0se30sWzFdKVxuKDEpXG59KTsiLCJ2YXIgZ2xvYmFsPXR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fTsvKipcbiAqIEBsaWNlbnNlXG4gKiBMby1EYXNoIDIuNC4xIChDdXN0b20gQnVpbGQpIGxvZGFzaC5jb20vbGljZW5zZSB8IFVuZGVyc2NvcmUuanMgMS41LjIgdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFXG4gKiBCdWlsZDogYGxvZGFzaCBtb2Rlcm4gLW8gLi9kaXN0L2xvZGFzaC5qc2BcbiAqL1xuOyhmdW5jdGlvbigpe2Z1bmN0aW9uIG4obix0LGUpe2U9KGV8fDApLTE7Zm9yKHZhciByPW4/bi5sZW5ndGg6MDsrK2U8cjspaWYobltlXT09PXQpcmV0dXJuIGU7cmV0dXJuLTF9ZnVuY3Rpb24gdCh0LGUpe3ZhciByPXR5cGVvZiBlO2lmKHQ9dC5sLFwiYm9vbGVhblwiPT1yfHxudWxsPT1lKXJldHVybiB0W2VdPzA6LTE7XCJudW1iZXJcIiE9ciYmXCJzdHJpbmdcIiE9ciYmKHI9XCJvYmplY3RcIik7dmFyIHU9XCJudW1iZXJcIj09cj9lOm0rZTtyZXR1cm4gdD0odD10W3JdKSYmdFt1XSxcIm9iamVjdFwiPT1yP3QmJi0xPG4odCxlKT8wOi0xOnQ/MDotMX1mdW5jdGlvbiBlKG4pe3ZhciB0PXRoaXMubCxlPXR5cGVvZiBuO2lmKFwiYm9vbGVhblwiPT1lfHxudWxsPT1uKXRbbl09dHJ1ZTtlbHNle1wibnVtYmVyXCIhPWUmJlwic3RyaW5nXCIhPWUmJihlPVwib2JqZWN0XCIpO3ZhciByPVwibnVtYmVyXCI9PWU/bjptK24sdD10W2VdfHwodFtlXT17fSk7XCJvYmplY3RcIj09ZT8odFtyXXx8KHRbcl09W10pKS5wdXNoKG4pOnRbcl09dHJ1ZVxufX1mdW5jdGlvbiByKG4pe3JldHVybiBuLmNoYXJDb2RlQXQoMCl9ZnVuY3Rpb24gdShuLHQpe2Zvcih2YXIgZT1uLm0scj10Lm0sdT0tMSxvPWUubGVuZ3RoOysrdTxvOyl7dmFyIGk9ZVt1XSxhPXJbdV07aWYoaSE9PWEpe2lmKGk+YXx8dHlwZW9mIGk9PVwidW5kZWZpbmVkXCIpcmV0dXJuIDE7aWYoaTxhfHx0eXBlb2YgYT09XCJ1bmRlZmluZWRcIilyZXR1cm4tMX19cmV0dXJuIG4ubi10Lm59ZnVuY3Rpb24gbyhuKXt2YXIgdD0tMSxyPW4ubGVuZ3RoLHU9blswXSxvPW5bci8yfDBdLGk9bltyLTFdO2lmKHUmJnR5cGVvZiB1PT1cIm9iamVjdFwiJiZvJiZ0eXBlb2Ygbz09XCJvYmplY3RcIiYmaSYmdHlwZW9mIGk9PVwib2JqZWN0XCIpcmV0dXJuIGZhbHNlO2Zvcih1PWYoKSx1W1wiZmFsc2VcIl09dVtcIm51bGxcIl09dVtcInRydWVcIl09dS51bmRlZmluZWQ9ZmFsc2Usbz1mKCksby5rPW4sby5sPXUsby5wdXNoPWU7Kyt0PHI7KW8ucHVzaChuW3RdKTtyZXR1cm4gb31mdW5jdGlvbiBpKG4pe3JldHVyblwiXFxcXFwiK1Vbbl1cbn1mdW5jdGlvbiBhKCl7cmV0dXJuIGgucG9wKCl8fFtdfWZ1bmN0aW9uIGYoKXtyZXR1cm4gZy5wb3AoKXx8e2s6bnVsbCxsOm51bGwsbTpudWxsLFwiZmFsc2VcIjpmYWxzZSxuOjAsXCJudWxsXCI6ZmFsc2UsbnVtYmVyOm51bGwsb2JqZWN0Om51bGwscHVzaDpudWxsLHN0cmluZzpudWxsLFwidHJ1ZVwiOmZhbHNlLHVuZGVmaW5lZDpmYWxzZSxvOm51bGx9fWZ1bmN0aW9uIGwobil7bi5sZW5ndGg9MCxoLmxlbmd0aDxfJiZoLnB1c2gobil9ZnVuY3Rpb24gYyhuKXt2YXIgdD1uLmw7dCYmYyh0KSxuLms9bi5sPW4ubT1uLm9iamVjdD1uLm51bWJlcj1uLnN0cmluZz1uLm89bnVsbCxnLmxlbmd0aDxfJiZnLnB1c2gobil9ZnVuY3Rpb24gcChuLHQsZSl7dHx8KHQ9MCksdHlwZW9mIGU9PVwidW5kZWZpbmVkXCImJihlPW4/bi5sZW5ndGg6MCk7dmFyIHI9LTE7ZT1lLXR8fDA7Zm9yKHZhciB1PUFycmF5KDA+ZT8wOmUpOysrcjxlOyl1W3JdPW5bdCtyXTtyZXR1cm4gdX1mdW5jdGlvbiBzKGUpe2Z1bmN0aW9uIGgobix0LGUpe2lmKCFufHwhVlt0eXBlb2Ygbl0pcmV0dXJuIG47XG50PXQmJnR5cGVvZiBlPT1cInVuZGVmaW5lZFwiP3Q6dHQodCxlLDMpO2Zvcih2YXIgcj0tMSx1PVZbdHlwZW9mIG5dJiZGZShuKSxvPXU/dS5sZW5ndGg6MDsrK3I8byYmKGU9dVtyXSxmYWxzZSE9PXQobltlXSxlLG4pKTspO3JldHVybiBufWZ1bmN0aW9uIGcobix0LGUpe3ZhciByO2lmKCFufHwhVlt0eXBlb2Ygbl0pcmV0dXJuIG47dD10JiZ0eXBlb2YgZT09XCJ1bmRlZmluZWRcIj90OnR0KHQsZSwzKTtmb3IociBpbiBuKWlmKGZhbHNlPT09dChuW3JdLHIsbikpYnJlYWs7cmV0dXJuIG59ZnVuY3Rpb24gXyhuLHQsZSl7dmFyIHIsdT1uLG89dTtpZighdSlyZXR1cm4gbztmb3IodmFyIGk9YXJndW1lbnRzLGE9MCxmPXR5cGVvZiBlPT1cIm51bWJlclwiPzI6aS5sZW5ndGg7KythPGY7KWlmKCh1PWlbYV0pJiZWW3R5cGVvZiB1XSlmb3IodmFyIGw9LTEsYz1WW3R5cGVvZiB1XSYmRmUodSkscD1jP2MubGVuZ3RoOjA7KytsPHA7KXI9Y1tsXSxcInVuZGVmaW5lZFwiPT10eXBlb2Ygb1tyXSYmKG9bcl09dVtyXSk7XG5yZXR1cm4gb31mdW5jdGlvbiBVKG4sdCxlKXt2YXIgcix1PW4sbz11O2lmKCF1KXJldHVybiBvO3ZhciBpPWFyZ3VtZW50cyxhPTAsZj10eXBlb2YgZT09XCJudW1iZXJcIj8yOmkubGVuZ3RoO2lmKDM8ZiYmXCJmdW5jdGlvblwiPT10eXBlb2YgaVtmLTJdKXZhciBsPXR0KGlbLS1mLTFdLGlbZi0tXSwyKTtlbHNlIDI8ZiYmXCJmdW5jdGlvblwiPT10eXBlb2YgaVtmLTFdJiYobD1pWy0tZl0pO2Zvcig7KythPGY7KWlmKCh1PWlbYV0pJiZWW3R5cGVvZiB1XSlmb3IodmFyIGM9LTEscD1WW3R5cGVvZiB1XSYmRmUodSkscz1wP3AubGVuZ3RoOjA7KytjPHM7KXI9cFtjXSxvW3JdPWw/bChvW3JdLHVbcl0pOnVbcl07cmV0dXJuIG99ZnVuY3Rpb24gSChuKXt2YXIgdCxlPVtdO2lmKCFufHwhVlt0eXBlb2Ygbl0pcmV0dXJuIGU7Zm9yKHQgaW4gbiltZS5jYWxsKG4sdCkmJmUucHVzaCh0KTtyZXR1cm4gZX1mdW5jdGlvbiBKKG4pe3JldHVybiBuJiZ0eXBlb2Ygbj09XCJvYmplY3RcIiYmIVRlKG4pJiZtZS5jYWxsKG4sXCJfX3dyYXBwZWRfX1wiKT9uOm5ldyBRKG4pXG59ZnVuY3Rpb24gUShuLHQpe3RoaXMuX19jaGFpbl9fPSEhdCx0aGlzLl9fd3JhcHBlZF9fPW59ZnVuY3Rpb24gWChuKXtmdW5jdGlvbiB0KCl7aWYocil7dmFyIG49cChyKTtiZS5hcHBseShuLGFyZ3VtZW50cyl9aWYodGhpcyBpbnN0YW5jZW9mIHQpe3ZhciBvPW50KGUucHJvdG90eXBlKSxuPWUuYXBwbHkobyxufHxhcmd1bWVudHMpO3JldHVybiB3dChuKT9uOm99cmV0dXJuIGUuYXBwbHkodSxufHxhcmd1bWVudHMpfXZhciBlPW5bMF0scj1uWzJdLHU9bls0XTtyZXR1cm4gJGUodCxuKSx0fWZ1bmN0aW9uIFoobix0LGUscix1KXtpZihlKXt2YXIgbz1lKG4pO2lmKHR5cGVvZiBvIT1cInVuZGVmaW5lZFwiKXJldHVybiBvfWlmKCF3dChuKSlyZXR1cm4gbjt2YXIgaT1jZS5jYWxsKG4pO2lmKCFLW2ldKXJldHVybiBuO3ZhciBmPUFlW2ldO3N3aXRjaChpKXtjYXNlIFQ6Y2FzZSBGOnJldHVybiBuZXcgZigrbik7Y2FzZSBXOmNhc2UgUDpyZXR1cm4gbmV3IGYobik7Y2FzZSB6OnJldHVybiBvPWYobi5zb3VyY2UsQy5leGVjKG4pKSxvLmxhc3RJbmRleD1uLmxhc3RJbmRleCxvXG59aWYoaT1UZShuKSx0KXt2YXIgYz0hcjtyfHwocj1hKCkpLHV8fCh1PWEoKSk7Zm9yKHZhciBzPXIubGVuZ3RoO3MtLTspaWYocltzXT09bilyZXR1cm4gdVtzXTtvPWk/ZihuLmxlbmd0aCk6e319ZWxzZSBvPWk/cChuKTpVKHt9LG4pO3JldHVybiBpJiYobWUuY2FsbChuLFwiaW5kZXhcIikmJihvLmluZGV4PW4uaW5kZXgpLG1lLmNhbGwobixcImlucHV0XCIpJiYoby5pbnB1dD1uLmlucHV0KSksdD8oci5wdXNoKG4pLHUucHVzaChvKSwoaT9TdDpoKShuLGZ1bmN0aW9uKG4saSl7b1tpXT1aKG4sdCxlLHIsdSl9KSxjJiYobChyKSxsKHUpKSxvKTpvfWZ1bmN0aW9uIG50KG4pe3JldHVybiB3dChuKT9rZShuKTp7fX1mdW5jdGlvbiB0dChuLHQsZSl7aWYodHlwZW9mIG4hPVwiZnVuY3Rpb25cIilyZXR1cm4gVXQ7aWYodHlwZW9mIHQ9PVwidW5kZWZpbmVkXCJ8fCEoXCJwcm90b3R5cGVcImluIG4pKXJldHVybiBuO3ZhciByPW4uX19iaW5kRGF0YV9fO2lmKHR5cGVvZiByPT1cInVuZGVmaW5lZFwiJiYoRGUuZnVuY05hbWVzJiYocj0hbi5uYW1lKSxyPXJ8fCFEZS5mdW5jRGVjb21wLCFyKSl7dmFyIHU9Z2UuY2FsbChuKTtcbkRlLmZ1bmNOYW1lc3x8KHI9IU8udGVzdCh1KSkscnx8KHI9RS50ZXN0KHUpLCRlKG4scikpfWlmKGZhbHNlPT09cnx8dHJ1ZSE9PXImJjEmclsxXSlyZXR1cm4gbjtzd2l0Y2goZSl7Y2FzZSAxOnJldHVybiBmdW5jdGlvbihlKXtyZXR1cm4gbi5jYWxsKHQsZSl9O2Nhc2UgMjpyZXR1cm4gZnVuY3Rpb24oZSxyKXtyZXR1cm4gbi5jYWxsKHQsZSxyKX07Y2FzZSAzOnJldHVybiBmdW5jdGlvbihlLHIsdSl7cmV0dXJuIG4uY2FsbCh0LGUscix1KX07Y2FzZSA0OnJldHVybiBmdW5jdGlvbihlLHIsdSxvKXtyZXR1cm4gbi5jYWxsKHQsZSxyLHUsbyl9fXJldHVybiBNdChuLHQpfWZ1bmN0aW9uIGV0KG4pe2Z1bmN0aW9uIHQoKXt2YXIgbj1mP2k6dGhpcztpZih1KXt2YXIgaD1wKHUpO2JlLmFwcGx5KGgsYXJndW1lbnRzKX1yZXR1cm4ob3x8YykmJihofHwoaD1wKGFyZ3VtZW50cykpLG8mJmJlLmFwcGx5KGgsbyksYyYmaC5sZW5ndGg8YSk/KHJ8PTE2LGV0KFtlLHM/cjotNCZyLGgsbnVsbCxpLGFdKSk6KGh8fChoPWFyZ3VtZW50cyksbCYmKGU9blt2XSksdGhpcyBpbnN0YW5jZW9mIHQ/KG49bnQoZS5wcm90b3R5cGUpLGg9ZS5hcHBseShuLGgpLHd0KGgpP2g6bik6ZS5hcHBseShuLGgpKVxufXZhciBlPW5bMF0scj1uWzFdLHU9blsyXSxvPW5bM10saT1uWzRdLGE9bls1XSxmPTEmcixsPTImcixjPTQmcixzPTgmcix2PWU7cmV0dXJuICRlKHQsbiksdH1mdW5jdGlvbiBydChlLHIpe3ZhciB1PS0xLGk9c3QoKSxhPWU/ZS5sZW5ndGg6MCxmPWE+PWImJmk9PT1uLGw9W107aWYoZil7dmFyIHA9byhyKTtwPyhpPXQscj1wKTpmPWZhbHNlfWZvcig7Kyt1PGE7KXA9ZVt1XSwwPmkocixwKSYmbC5wdXNoKHApO3JldHVybiBmJiZjKHIpLGx9ZnVuY3Rpb24gdXQobix0LGUscil7cj0ocnx8MCktMTtmb3IodmFyIHU9bj9uLmxlbmd0aDowLG89W107KytyPHU7KXt2YXIgaT1uW3JdO2lmKGkmJnR5cGVvZiBpPT1cIm9iamVjdFwiJiZ0eXBlb2YgaS5sZW5ndGg9PVwibnVtYmVyXCImJihUZShpKXx8eXQoaSkpKXt0fHwoaT11dChpLHQsZSkpO3ZhciBhPS0xLGY9aS5sZW5ndGgsbD1vLmxlbmd0aDtmb3Ioby5sZW5ndGgrPWY7KythPGY7KW9bbCsrXT1pW2FdfWVsc2UgZXx8by5wdXNoKGkpfXJldHVybiBvXG59ZnVuY3Rpb24gb3Qobix0LGUscix1LG8pe2lmKGUpe3ZhciBpPWUobix0KTtpZih0eXBlb2YgaSE9XCJ1bmRlZmluZWRcIilyZXR1cm4hIWl9aWYobj09PXQpcmV0dXJuIDAhPT1ufHwxL249PTEvdDtpZihuPT09biYmIShuJiZWW3R5cGVvZiBuXXx8dCYmVlt0eXBlb2YgdF0pKXJldHVybiBmYWxzZTtpZihudWxsPT1ufHxudWxsPT10KXJldHVybiBuPT09dDt2YXIgZj1jZS5jYWxsKG4pLGM9Y2UuY2FsbCh0KTtpZihmPT1EJiYoZj1xKSxjPT1EJiYoYz1xKSxmIT1jKXJldHVybiBmYWxzZTtzd2l0Y2goZil7Y2FzZSBUOmNhc2UgRjpyZXR1cm4rbj09K3Q7Y2FzZSBXOnJldHVybiBuIT0rbj90IT0rdDowPT1uPzEvbj09MS90Om49PSt0O2Nhc2UgejpjYXNlIFA6cmV0dXJuIG49PW9lKHQpfWlmKGM9Zj09JCwhYyl7dmFyIHA9bWUuY2FsbChuLFwiX193cmFwcGVkX19cIikscz1tZS5jYWxsKHQsXCJfX3dyYXBwZWRfX1wiKTtpZihwfHxzKXJldHVybiBvdChwP24uX193cmFwcGVkX186bixzP3QuX193cmFwcGVkX186dCxlLHIsdSxvKTtcbmlmKGYhPXEpcmV0dXJuIGZhbHNlO2lmKGY9bi5jb25zdHJ1Y3RvcixwPXQuY29uc3RydWN0b3IsZiE9cCYmIShkdChmKSYmZiBpbnN0YW5jZW9mIGYmJmR0KHApJiZwIGluc3RhbmNlb2YgcCkmJlwiY29uc3RydWN0b3JcImluIG4mJlwiY29uc3RydWN0b3JcImluIHQpcmV0dXJuIGZhbHNlfWZvcihmPSF1LHV8fCh1PWEoKSksb3x8KG89YSgpKSxwPXUubGVuZ3RoO3AtLTspaWYodVtwXT09bilyZXR1cm4gb1twXT09dDt2YXIgdj0wLGk9dHJ1ZTtpZih1LnB1c2gobiksby5wdXNoKHQpLGMpe2lmKHA9bi5sZW5ndGgsdj10Lmxlbmd0aCwoaT12PT1wKXx8cilmb3IoO3YtLTspaWYoYz1wLHM9dFt2XSxyKWZvcig7Yy0tJiYhKGk9b3QobltjXSxzLGUscix1LG8pKTspO2Vsc2UgaWYoIShpPW90KG5bdl0scyxlLHIsdSxvKSkpYnJlYWt9ZWxzZSBnKHQsZnVuY3Rpb24odCxhLGYpe3JldHVybiBtZS5jYWxsKGYsYSk/KHYrKyxpPW1lLmNhbGwobixhKSYmb3QoblthXSx0LGUscix1LG8pKTp2b2lkIDB9KSxpJiYhciYmZyhuLGZ1bmN0aW9uKG4sdCxlKXtyZXR1cm4gbWUuY2FsbChlLHQpP2k9LTE8LS12OnZvaWQgMFxufSk7cmV0dXJuIHUucG9wKCksby5wb3AoKSxmJiYobCh1KSxsKG8pKSxpfWZ1bmN0aW9uIGl0KG4sdCxlLHIsdSl7KFRlKHQpP1N0OmgpKHQsZnVuY3Rpb24odCxvKXt2YXIgaSxhLGY9dCxsPW5bb107aWYodCYmKChhPVRlKHQpKXx8UGUodCkpKXtmb3IoZj1yLmxlbmd0aDtmLS07KWlmKGk9cltmXT09dCl7bD11W2ZdO2JyZWFrfWlmKCFpKXt2YXIgYztlJiYoZj1lKGwsdCksYz10eXBlb2YgZiE9XCJ1bmRlZmluZWRcIikmJihsPWYpLGN8fChsPWE/VGUobCk/bDpbXTpQZShsKT9sOnt9KSxyLnB1c2godCksdS5wdXNoKGwpLGN8fGl0KGwsdCxlLHIsdSl9fWVsc2UgZSYmKGY9ZShsLHQpLHR5cGVvZiBmPT1cInVuZGVmaW5lZFwiJiYoZj10KSksdHlwZW9mIGYhPVwidW5kZWZpbmVkXCImJihsPWYpO25bb109bH0pfWZ1bmN0aW9uIGF0KG4sdCl7cmV0dXJuIG4raGUoUmUoKSoodC1uKzEpKX1mdW5jdGlvbiBmdChlLHIsdSl7dmFyIGk9LTEsZj1zdCgpLHA9ZT9lLmxlbmd0aDowLHM9W10sdj0hciYmcD49YiYmZj09PW4saD11fHx2P2EoKTpzO1xuZm9yKHYmJihoPW8oaCksZj10KTsrK2k8cDspe3ZhciBnPWVbaV0seT11P3UoZyxpLGUpOmc7KHI/IWl8fGhbaC5sZW5ndGgtMV0hPT15OjA+ZihoLHkpKSYmKCh1fHx2KSYmaC5wdXNoKHkpLHMucHVzaChnKSl9cmV0dXJuIHY/KGwoaC5rKSxjKGgpKTp1JiZsKGgpLHN9ZnVuY3Rpb24gbHQobil7cmV0dXJuIGZ1bmN0aW9uKHQsZSxyKXt2YXIgdT17fTtlPUouY3JlYXRlQ2FsbGJhY2soZSxyLDMpLHI9LTE7dmFyIG89dD90Lmxlbmd0aDowO2lmKHR5cGVvZiBvPT1cIm51bWJlclwiKWZvcig7KytyPG87KXt2YXIgaT10W3JdO24odSxpLGUoaSxyLHQpLHQpfWVsc2UgaCh0LGZ1bmN0aW9uKHQscixvKXtuKHUsdCxlKHQscixvKSxvKX0pO3JldHVybiB1fX1mdW5jdGlvbiBjdChuLHQsZSxyLHUsbyl7dmFyIGk9MSZ0LGE9NCZ0LGY9MTYmdCxsPTMyJnQ7aWYoISgyJnR8fGR0KG4pKSl0aHJvdyBuZXcgaWU7ZiYmIWUubGVuZ3RoJiYodCY9LTE3LGY9ZT1mYWxzZSksbCYmIXIubGVuZ3RoJiYodCY9LTMzLGw9cj1mYWxzZSk7XG52YXIgYz1uJiZuLl9fYmluZERhdGFfXztyZXR1cm4gYyYmdHJ1ZSE9PWM/KGM9cChjKSxjWzJdJiYoY1syXT1wKGNbMl0pKSxjWzNdJiYoY1szXT1wKGNbM10pKSwhaXx8MSZjWzFdfHwoY1s0XT11KSwhaSYmMSZjWzFdJiYodHw9OCksIWF8fDQmY1sxXXx8KGNbNV09byksZiYmYmUuYXBwbHkoY1syXXx8KGNbMl09W10pLGUpLGwmJndlLmFwcGx5KGNbM118fChjWzNdPVtdKSxyKSxjWzFdfD10LGN0LmFwcGx5KG51bGwsYykpOigxPT10fHwxNz09PXQ/WDpldCkoW24sdCxlLHIsdSxvXSl9ZnVuY3Rpb24gcHQobil7cmV0dXJuIEJlW25dfWZ1bmN0aW9uIHN0KCl7dmFyIHQ9KHQ9Si5pbmRleE9mKT09PVd0P246dDtyZXR1cm4gdH1mdW5jdGlvbiB2dChuKXtyZXR1cm4gdHlwZW9mIG49PVwiZnVuY3Rpb25cIiYmcGUudGVzdChuKX1mdW5jdGlvbiBodChuKXt2YXIgdCxlO3JldHVybiBuJiZjZS5jYWxsKG4pPT1xJiYodD1uLmNvbnN0cnVjdG9yLCFkdCh0KXx8dCBpbnN0YW5jZW9mIHQpPyhnKG4sZnVuY3Rpb24obix0KXtlPXRcbn0pLHR5cGVvZiBlPT1cInVuZGVmaW5lZFwifHxtZS5jYWxsKG4sZSkpOmZhbHNlfWZ1bmN0aW9uIGd0KG4pe3JldHVybiBXZVtuXX1mdW5jdGlvbiB5dChuKXtyZXR1cm4gbiYmdHlwZW9mIG49PVwib2JqZWN0XCImJnR5cGVvZiBuLmxlbmd0aD09XCJudW1iZXJcIiYmY2UuY2FsbChuKT09RHx8ZmFsc2V9ZnVuY3Rpb24gbXQobix0LGUpe3ZhciByPUZlKG4pLHU9ci5sZW5ndGg7Zm9yKHQ9dHQodCxlLDMpO3UtLSYmKGU9clt1XSxmYWxzZSE9PXQobltlXSxlLG4pKTspO3JldHVybiBufWZ1bmN0aW9uIGJ0KG4pe3ZhciB0PVtdO3JldHVybiBnKG4sZnVuY3Rpb24obixlKXtkdChuKSYmdC5wdXNoKGUpfSksdC5zb3J0KCl9ZnVuY3Rpb24gX3Qobil7Zm9yKHZhciB0PS0xLGU9RmUobikscj1lLmxlbmd0aCx1PXt9OysrdDxyOyl7dmFyIG89ZVt0XTt1W25bb11dPW99cmV0dXJuIHV9ZnVuY3Rpb24gZHQobil7cmV0dXJuIHR5cGVvZiBuPT1cImZ1bmN0aW9uXCJ9ZnVuY3Rpb24gd3Qobil7cmV0dXJuISghbnx8IVZbdHlwZW9mIG5dKVxufWZ1bmN0aW9uIGp0KG4pe3JldHVybiB0eXBlb2Ygbj09XCJudW1iZXJcInx8biYmdHlwZW9mIG49PVwib2JqZWN0XCImJmNlLmNhbGwobik9PVd8fGZhbHNlfWZ1bmN0aW9uIGt0KG4pe3JldHVybiB0eXBlb2Ygbj09XCJzdHJpbmdcInx8biYmdHlwZW9mIG49PVwib2JqZWN0XCImJmNlLmNhbGwobik9PVB8fGZhbHNlfWZ1bmN0aW9uIHh0KG4pe2Zvcih2YXIgdD0tMSxlPUZlKG4pLHI9ZS5sZW5ndGgsdT1YdChyKTsrK3Q8cjspdVt0XT1uW2VbdF1dO3JldHVybiB1fWZ1bmN0aW9uIEN0KG4sdCxlKXt2YXIgcj0tMSx1PXN0KCksbz1uP24ubGVuZ3RoOjAsaT1mYWxzZTtyZXR1cm4gZT0oMD5lP0llKDAsbytlKTplKXx8MCxUZShuKT9pPS0xPHUobix0LGUpOnR5cGVvZiBvPT1cIm51bWJlclwiP2k9LTE8KGt0KG4pP24uaW5kZXhPZih0LGUpOnUobix0LGUpKTpoKG4sZnVuY3Rpb24obil7cmV0dXJuKytyPGU/dm9pZCAwOiEoaT1uPT09dCl9KSxpfWZ1bmN0aW9uIE90KG4sdCxlKXt2YXIgcj10cnVlO3Q9Si5jcmVhdGVDYWxsYmFjayh0LGUsMyksZT0tMTtcbnZhciB1PW4/bi5sZW5ndGg6MDtpZih0eXBlb2YgdT09XCJudW1iZXJcIilmb3IoOysrZTx1JiYocj0hIXQobltlXSxlLG4pKTspO2Vsc2UgaChuLGZ1bmN0aW9uKG4sZSx1KXtyZXR1cm4gcj0hIXQobixlLHUpfSk7cmV0dXJuIHJ9ZnVuY3Rpb24gTnQobix0LGUpe3ZhciByPVtdO3Q9Si5jcmVhdGVDYWxsYmFjayh0LGUsMyksZT0tMTt2YXIgdT1uP24ubGVuZ3RoOjA7aWYodHlwZW9mIHU9PVwibnVtYmVyXCIpZm9yKDsrK2U8dTspe3ZhciBvPW5bZV07dChvLGUsbikmJnIucHVzaChvKX1lbHNlIGgobixmdW5jdGlvbihuLGUsdSl7dChuLGUsdSkmJnIucHVzaChuKX0pO3JldHVybiByfWZ1bmN0aW9uIEl0KG4sdCxlKXt0PUouY3JlYXRlQ2FsbGJhY2sodCxlLDMpLGU9LTE7dmFyIHI9bj9uLmxlbmd0aDowO2lmKHR5cGVvZiByIT1cIm51bWJlclwiKXt2YXIgdTtyZXR1cm4gaChuLGZ1bmN0aW9uKG4sZSxyKXtyZXR1cm4gdChuLGUscik/KHU9bixmYWxzZSk6dm9pZCAwfSksdX1mb3IoOysrZTxyOyl7dmFyIG89bltlXTtcbmlmKHQobyxlLG4pKXJldHVybiBvfX1mdW5jdGlvbiBTdChuLHQsZSl7dmFyIHI9LTEsdT1uP24ubGVuZ3RoOjA7aWYodD10JiZ0eXBlb2YgZT09XCJ1bmRlZmluZWRcIj90OnR0KHQsZSwzKSx0eXBlb2YgdT09XCJudW1iZXJcIilmb3IoOysrcjx1JiZmYWxzZSE9PXQobltyXSxyLG4pOyk7ZWxzZSBoKG4sdCk7cmV0dXJuIG59ZnVuY3Rpb24gRXQobix0LGUpe3ZhciByPW4/bi5sZW5ndGg6MDtpZih0PXQmJnR5cGVvZiBlPT1cInVuZGVmaW5lZFwiP3Q6dHQodCxlLDMpLHR5cGVvZiByPT1cIm51bWJlclwiKWZvcig7ci0tJiZmYWxzZSE9PXQobltyXSxyLG4pOyk7ZWxzZXt2YXIgdT1GZShuKSxyPXUubGVuZ3RoO2gobixmdW5jdGlvbihuLGUsbyl7cmV0dXJuIGU9dT91Wy0tcl06LS1yLHQob1tlXSxlLG8pfSl9cmV0dXJuIG59ZnVuY3Rpb24gUnQobix0LGUpe3ZhciByPS0xLHU9bj9uLmxlbmd0aDowO2lmKHQ9Si5jcmVhdGVDYWxsYmFjayh0LGUsMyksdHlwZW9mIHU9PVwibnVtYmVyXCIpZm9yKHZhciBvPVh0KHUpOysrcjx1OylvW3JdPXQobltyXSxyLG4pO1xuZWxzZSBvPVtdLGgobixmdW5jdGlvbihuLGUsdSl7b1srK3JdPXQobixlLHUpfSk7cmV0dXJuIG99ZnVuY3Rpb24gQXQobix0LGUpe3ZhciB1PS0xLzAsbz11O2lmKHR5cGVvZiB0IT1cImZ1bmN0aW9uXCImJmUmJmVbdF09PT1uJiYodD1udWxsKSxudWxsPT10JiZUZShuKSl7ZT0tMTtmb3IodmFyIGk9bi5sZW5ndGg7KytlPGk7KXt2YXIgYT1uW2VdO2E+byYmKG89YSl9fWVsc2UgdD1udWxsPT10JiZrdChuKT9yOkouY3JlYXRlQ2FsbGJhY2sodCxlLDMpLFN0KG4sZnVuY3Rpb24obixlLHIpe2U9dChuLGUsciksZT51JiYodT1lLG89bil9KTtyZXR1cm4gb31mdW5jdGlvbiBEdChuLHQsZSxyKXtpZighbilyZXR1cm4gZTt2YXIgdT0zPmFyZ3VtZW50cy5sZW5ndGg7dD1KLmNyZWF0ZUNhbGxiYWNrKHQsciw0KTt2YXIgbz0tMSxpPW4ubGVuZ3RoO2lmKHR5cGVvZiBpPT1cIm51bWJlclwiKWZvcih1JiYoZT1uWysrb10pOysrbzxpOyllPXQoZSxuW29dLG8sbik7ZWxzZSBoKG4sZnVuY3Rpb24obixyLG8pe2U9dT8odT1mYWxzZSxuKTp0KGUsbixyLG8pXG59KTtyZXR1cm4gZX1mdW5jdGlvbiAkdChuLHQsZSxyKXt2YXIgdT0zPmFyZ3VtZW50cy5sZW5ndGg7cmV0dXJuIHQ9Si5jcmVhdGVDYWxsYmFjayh0LHIsNCksRXQobixmdW5jdGlvbihuLHIsbyl7ZT11Pyh1PWZhbHNlLG4pOnQoZSxuLHIsbyl9KSxlfWZ1bmN0aW9uIFR0KG4pe3ZhciB0PS0xLGU9bj9uLmxlbmd0aDowLHI9WHQodHlwZW9mIGU9PVwibnVtYmVyXCI/ZTowKTtyZXR1cm4gU3QobixmdW5jdGlvbihuKXt2YXIgZT1hdCgwLCsrdCk7clt0XT1yW2VdLHJbZV09bn0pLHJ9ZnVuY3Rpb24gRnQobix0LGUpe3ZhciByO3Q9Si5jcmVhdGVDYWxsYmFjayh0LGUsMyksZT0tMTt2YXIgdT1uP24ubGVuZ3RoOjA7aWYodHlwZW9mIHU9PVwibnVtYmVyXCIpZm9yKDsrK2U8dSYmIShyPXQobltlXSxlLG4pKTspO2Vsc2UgaChuLGZ1bmN0aW9uKG4sZSx1KXtyZXR1cm4hKHI9dChuLGUsdSkpfSk7cmV0dXJuISFyfWZ1bmN0aW9uIEJ0KG4sdCxlKXt2YXIgcj0wLHU9bj9uLmxlbmd0aDowO2lmKHR5cGVvZiB0IT1cIm51bWJlclwiJiZudWxsIT10KXt2YXIgbz0tMTtcbmZvcih0PUouY3JlYXRlQ2FsbGJhY2sodCxlLDMpOysrbzx1JiZ0KG5bb10sbyxuKTspcisrfWVsc2UgaWYocj10LG51bGw9PXJ8fGUpcmV0dXJuIG4/blswXTp2O3JldHVybiBwKG4sMCxTZShJZSgwLHIpLHUpKX1mdW5jdGlvbiBXdCh0LGUscil7aWYodHlwZW9mIHI9PVwibnVtYmVyXCIpe3ZhciB1PXQ/dC5sZW5ndGg6MDtyPTA+cj9JZSgwLHUrcik6cnx8MH1lbHNlIGlmKHIpcmV0dXJuIHI9enQodCxlKSx0W3JdPT09ZT9yOi0xO3JldHVybiBuKHQsZSxyKX1mdW5jdGlvbiBxdChuLHQsZSl7aWYodHlwZW9mIHQhPVwibnVtYmVyXCImJm51bGwhPXQpe3ZhciByPTAsdT0tMSxvPW4/bi5sZW5ndGg6MDtmb3IodD1KLmNyZWF0ZUNhbGxiYWNrKHQsZSwzKTsrK3U8byYmdChuW3VdLHUsbik7KXIrK31lbHNlIHI9bnVsbD09dHx8ZT8xOkllKDAsdCk7cmV0dXJuIHAobixyKX1mdW5jdGlvbiB6dChuLHQsZSxyKXt2YXIgdT0wLG89bj9uLmxlbmd0aDp1O2ZvcihlPWU/Si5jcmVhdGVDYWxsYmFjayhlLHIsMSk6VXQsdD1lKHQpO3U8bzspcj11K28+Pj4xLGUobltyXSk8dD91PXIrMTpvPXI7XG5yZXR1cm4gdX1mdW5jdGlvbiBQdChuLHQsZSxyKXtyZXR1cm4gdHlwZW9mIHQhPVwiYm9vbGVhblwiJiZudWxsIT10JiYocj1lLGU9dHlwZW9mIHQhPVwiZnVuY3Rpb25cIiYmciYmclt0XT09PW4/bnVsbDp0LHQ9ZmFsc2UpLG51bGwhPWUmJihlPUouY3JlYXRlQ2FsbGJhY2soZSxyLDMpKSxmdChuLHQsZSl9ZnVuY3Rpb24gS3QoKXtmb3IodmFyIG49MTxhcmd1bWVudHMubGVuZ3RoP2FyZ3VtZW50czphcmd1bWVudHNbMF0sdD0tMSxlPW4/QXQoVmUobixcImxlbmd0aFwiKSk6MCxyPVh0KDA+ZT8wOmUpOysrdDxlOylyW3RdPVZlKG4sdCk7cmV0dXJuIHJ9ZnVuY3Rpb24gTHQobix0KXt2YXIgZT0tMSxyPW4/bi5sZW5ndGg6MCx1PXt9O2Zvcih0fHwhcnx8VGUoblswXSl8fCh0PVtdKTsrK2U8cjspe3ZhciBvPW5bZV07dD91W29dPXRbZV06byYmKHVbb1swXV09b1sxXSl9cmV0dXJuIHV9ZnVuY3Rpb24gTXQobix0KXtyZXR1cm4gMjxhcmd1bWVudHMubGVuZ3RoP2N0KG4sMTcscChhcmd1bWVudHMsMiksbnVsbCx0KTpjdChuLDEsbnVsbCxudWxsLHQpXG59ZnVuY3Rpb24gVnQobix0LGUpe2Z1bmN0aW9uIHIoKXtjJiZ2ZShjKSxpPWM9cD12LChnfHxoIT09dCkmJihzPVVlKCksYT1uLmFwcGx5KGwsbyksY3x8aXx8KG89bD1udWxsKSl9ZnVuY3Rpb24gdSgpe3ZhciBlPXQtKFVlKCktZik7MDxlP2M9X2UodSxlKTooaSYmdmUoaSksZT1wLGk9Yz1wPXYsZSYmKHM9VWUoKSxhPW4uYXBwbHkobCxvKSxjfHxpfHwobz1sPW51bGwpKSl9dmFyIG8saSxhLGYsbCxjLHAscz0wLGg9ZmFsc2UsZz10cnVlO2lmKCFkdChuKSl0aHJvdyBuZXcgaWU7aWYodD1JZSgwLHQpfHwwLHRydWU9PT1lKXZhciB5PXRydWUsZz1mYWxzZTtlbHNlIHd0KGUpJiYoeT1lLmxlYWRpbmcsaD1cIm1heFdhaXRcImluIGUmJihJZSh0LGUubWF4V2FpdCl8fDApLGc9XCJ0cmFpbGluZ1wiaW4gZT9lLnRyYWlsaW5nOmcpO3JldHVybiBmdW5jdGlvbigpe2lmKG89YXJndW1lbnRzLGY9VWUoKSxsPXRoaXMscD1nJiYoY3x8IXkpLGZhbHNlPT09aCl2YXIgZT15JiYhYztlbHNle2l8fHl8fChzPWYpO3ZhciB2PWgtKGYtcyksbT0wPj12O1xubT8oaSYmKGk9dmUoaSkpLHM9ZixhPW4uYXBwbHkobCxvKSk6aXx8KGk9X2Uocix2KSl9cmV0dXJuIG0mJmM/Yz12ZShjKTpjfHx0PT09aHx8KGM9X2UodSx0KSksZSYmKG09dHJ1ZSxhPW4uYXBwbHkobCxvKSksIW18fGN8fGl8fChvPWw9bnVsbCksYX19ZnVuY3Rpb24gVXQobil7cmV0dXJuIG59ZnVuY3Rpb24gR3Qobix0LGUpe3ZhciByPXRydWUsdT10JiZidCh0KTt0JiYoZXx8dS5sZW5ndGgpfHwobnVsbD09ZSYmKGU9dCksbz1RLHQ9bixuPUosdT1idCh0KSksZmFsc2U9PT1lP3I9ZmFsc2U6d3QoZSkmJlwiY2hhaW5cImluIGUmJihyPWUuY2hhaW4pO3ZhciBvPW4saT1kdChvKTtTdCh1LGZ1bmN0aW9uKGUpe3ZhciB1PW5bZV09dFtlXTtpJiYoby5wcm90b3R5cGVbZV09ZnVuY3Rpb24oKXt2YXIgdD10aGlzLl9fY2hhaW5fXyxlPXRoaXMuX193cmFwcGVkX18saT1bZV07aWYoYmUuYXBwbHkoaSxhcmd1bWVudHMpLGk9dS5hcHBseShuLGkpLHJ8fHQpe2lmKGU9PT1pJiZ3dChpKSlyZXR1cm4gdGhpcztcbmk9bmV3IG8oaSksaS5fX2NoYWluX189dH1yZXR1cm4gaX0pfSl9ZnVuY3Rpb24gSHQoKXt9ZnVuY3Rpb24gSnQobil7cmV0dXJuIGZ1bmN0aW9uKHQpe3JldHVybiB0W25dfX1mdW5jdGlvbiBRdCgpe3JldHVybiB0aGlzLl9fd3JhcHBlZF9ffWU9ZT9ZLmRlZmF1bHRzKEcuT2JqZWN0KCksZSxZLnBpY2soRyxBKSk6Rzt2YXIgWHQ9ZS5BcnJheSxZdD1lLkJvb2xlYW4sWnQ9ZS5EYXRlLG5lPWUuRnVuY3Rpb24sdGU9ZS5NYXRoLGVlPWUuTnVtYmVyLHJlPWUuT2JqZWN0LHVlPWUuUmVnRXhwLG9lPWUuU3RyaW5nLGllPWUuVHlwZUVycm9yLGFlPVtdLGZlPXJlLnByb3RvdHlwZSxsZT1lLl8sY2U9ZmUudG9TdHJpbmcscGU9dWUoXCJeXCIrb2UoY2UpLnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXF1cXFxcXS9nLFwiXFxcXCQmXCIpLnJlcGxhY2UoL3RvU3RyaW5nfCBmb3IgW15cXF1dKy9nLFwiLio/XCIpK1wiJFwiKSxzZT10ZS5jZWlsLHZlPWUuY2xlYXJUaW1lb3V0LGhlPXRlLmZsb29yLGdlPW5lLnByb3RvdHlwZS50b1N0cmluZyx5ZT12dCh5ZT1yZS5nZXRQcm90b3R5cGVPZikmJnllLG1lPWZlLmhhc093blByb3BlcnR5LGJlPWFlLnB1c2gsX2U9ZS5zZXRUaW1lb3V0LGRlPWFlLnNwbGljZSx3ZT1hZS51bnNoaWZ0LGplPWZ1bmN0aW9uKCl7dHJ5e3ZhciBuPXt9LHQ9dnQodD1yZS5kZWZpbmVQcm9wZXJ0eSkmJnQsZT10KG4sbixuKSYmdFxufWNhdGNoKHIpe31yZXR1cm4gZX0oKSxrZT12dChrZT1yZS5jcmVhdGUpJiZrZSx4ZT12dCh4ZT1YdC5pc0FycmF5KSYmeGUsQ2U9ZS5pc0Zpbml0ZSxPZT1lLmlzTmFOLE5lPXZ0KE5lPXJlLmtleXMpJiZOZSxJZT10ZS5tYXgsU2U9dGUubWluLEVlPWUucGFyc2VJbnQsUmU9dGUucmFuZG9tLEFlPXt9O0FlWyRdPVh0LEFlW1RdPVl0LEFlW0ZdPVp0LEFlW0JdPW5lLEFlW3FdPXJlLEFlW1ddPWVlLEFlW3pdPXVlLEFlW1BdPW9lLFEucHJvdG90eXBlPUoucHJvdG90eXBlO3ZhciBEZT1KLnN1cHBvcnQ9e307RGUuZnVuY0RlY29tcD0hdnQoZS5hKSYmRS50ZXN0KHMpLERlLmZ1bmNOYW1lcz10eXBlb2YgbmUubmFtZT09XCJzdHJpbmdcIixKLnRlbXBsYXRlU2V0dGluZ3M9e2VzY2FwZTovPCUtKFtcXHNcXFNdKz8pJT4vZyxldmFsdWF0ZTovPCUoW1xcc1xcU10rPyklPi9nLGludGVycG9sYXRlOk4sdmFyaWFibGU6XCJcIixpbXBvcnRzOntfOkp9fSxrZXx8KG50PWZ1bmN0aW9uKCl7ZnVuY3Rpb24gbigpe31yZXR1cm4gZnVuY3Rpb24odCl7aWYod3QodCkpe24ucHJvdG90eXBlPXQ7XG52YXIgcj1uZXcgbjtuLnByb3RvdHlwZT1udWxsfXJldHVybiByfHxlLk9iamVjdCgpfX0oKSk7dmFyICRlPWplP2Z1bmN0aW9uKG4sdCl7TS52YWx1ZT10LGplKG4sXCJfX2JpbmREYXRhX19cIixNKX06SHQsVGU9eGV8fGZ1bmN0aW9uKG4pe3JldHVybiBuJiZ0eXBlb2Ygbj09XCJvYmplY3RcIiYmdHlwZW9mIG4ubGVuZ3RoPT1cIm51bWJlclwiJiZjZS5jYWxsKG4pPT0kfHxmYWxzZX0sRmU9TmU/ZnVuY3Rpb24obil7cmV0dXJuIHd0KG4pP05lKG4pOltdfTpILEJlPXtcIiZcIjpcIiZhbXA7XCIsXCI8XCI6XCImbHQ7XCIsXCI+XCI6XCImZ3Q7XCIsJ1wiJzpcIiZxdW90O1wiLFwiJ1wiOlwiJiMzOTtcIn0sV2U9X3QoQmUpLHFlPXVlKFwiKFwiK0ZlKFdlKS5qb2luKFwifFwiKStcIilcIixcImdcIiksemU9dWUoXCJbXCIrRmUoQmUpLmpvaW4oXCJcIikrXCJdXCIsXCJnXCIpLFBlPXllP2Z1bmN0aW9uKG4pe2lmKCFufHxjZS5jYWxsKG4pIT1xKXJldHVybiBmYWxzZTt2YXIgdD1uLnZhbHVlT2YsZT12dCh0KSYmKGU9eWUodCkpJiZ5ZShlKTtyZXR1cm4gZT9uPT1lfHx5ZShuKT09ZTpodChuKVxufTpodCxLZT1sdChmdW5jdGlvbihuLHQsZSl7bWUuY2FsbChuLGUpP25bZV0rKzpuW2VdPTF9KSxMZT1sdChmdW5jdGlvbihuLHQsZSl7KG1lLmNhbGwobixlKT9uW2VdOm5bZV09W10pLnB1c2godCl9KSxNZT1sdChmdW5jdGlvbihuLHQsZSl7bltlXT10fSksVmU9UnQsVWU9dnQoVWU9WnQubm93KSYmVWV8fGZ1bmN0aW9uKCl7cmV0dXJuKG5ldyBadCkuZ2V0VGltZSgpfSxHZT04PT1FZShkK1wiMDhcIik/RWU6ZnVuY3Rpb24obix0KXtyZXR1cm4gRWUoa3Qobik/bi5yZXBsYWNlKEksXCJcIik6bix0fHwwKX07cmV0dXJuIEouYWZ0ZXI9ZnVuY3Rpb24obix0KXtpZighZHQodCkpdGhyb3cgbmV3IGllO3JldHVybiBmdW5jdGlvbigpe3JldHVybiAxPi0tbj90LmFwcGx5KHRoaXMsYXJndW1lbnRzKTp2b2lkIDB9fSxKLmFzc2lnbj1VLEouYXQ9ZnVuY3Rpb24obil7Zm9yKHZhciB0PWFyZ3VtZW50cyxlPS0xLHI9dXQodCx0cnVlLGZhbHNlLDEpLHQ9dFsyXSYmdFsyXVt0WzFdXT09PW4/MTpyLmxlbmd0aCx1PVh0KHQpOysrZTx0Oyl1W2VdPW5bcltlXV07XG5yZXR1cm4gdX0sSi5iaW5kPU10LEouYmluZEFsbD1mdW5jdGlvbihuKXtmb3IodmFyIHQ9MTxhcmd1bWVudHMubGVuZ3RoP3V0KGFyZ3VtZW50cyx0cnVlLGZhbHNlLDEpOmJ0KG4pLGU9LTEscj10Lmxlbmd0aDsrK2U8cjspe3ZhciB1PXRbZV07blt1XT1jdChuW3VdLDEsbnVsbCxudWxsLG4pfXJldHVybiBufSxKLmJpbmRLZXk9ZnVuY3Rpb24obix0KXtyZXR1cm4gMjxhcmd1bWVudHMubGVuZ3RoP2N0KHQsMTkscChhcmd1bWVudHMsMiksbnVsbCxuKTpjdCh0LDMsbnVsbCxudWxsLG4pfSxKLmNoYWluPWZ1bmN0aW9uKG4pe3JldHVybiBuPW5ldyBRKG4pLG4uX19jaGFpbl9fPXRydWUsbn0sSi5jb21wYWN0PWZ1bmN0aW9uKG4pe2Zvcih2YXIgdD0tMSxlPW4/bi5sZW5ndGg6MCxyPVtdOysrdDxlOyl7dmFyIHU9blt0XTt1JiZyLnB1c2godSl9cmV0dXJuIHJ9LEouY29tcG9zZT1mdW5jdGlvbigpe2Zvcih2YXIgbj1hcmd1bWVudHMsdD1uLmxlbmd0aDt0LS07KWlmKCFkdChuW3RdKSl0aHJvdyBuZXcgaWU7XG5yZXR1cm4gZnVuY3Rpb24oKXtmb3IodmFyIHQ9YXJndW1lbnRzLGU9bi5sZW5ndGg7ZS0tOyl0PVtuW2VdLmFwcGx5KHRoaXMsdCldO3JldHVybiB0WzBdfX0sSi5jb25zdGFudD1mdW5jdGlvbihuKXtyZXR1cm4gZnVuY3Rpb24oKXtyZXR1cm4gbn19LEouY291bnRCeT1LZSxKLmNyZWF0ZT1mdW5jdGlvbihuLHQpe3ZhciBlPW50KG4pO3JldHVybiB0P1UoZSx0KTplfSxKLmNyZWF0ZUNhbGxiYWNrPWZ1bmN0aW9uKG4sdCxlKXt2YXIgcj10eXBlb2YgbjtpZihudWxsPT1ufHxcImZ1bmN0aW9uXCI9PXIpcmV0dXJuIHR0KG4sdCxlKTtpZihcIm9iamVjdFwiIT1yKXJldHVybiBKdChuKTt2YXIgdT1GZShuKSxvPXVbMF0saT1uW29dO3JldHVybiAxIT11Lmxlbmd0aHx8aSE9PWl8fHd0KGkpP2Z1bmN0aW9uKHQpe2Zvcih2YXIgZT11Lmxlbmd0aCxyPWZhbHNlO2UtLSYmKHI9b3QodFt1W2VdXSxuW3VbZV1dLG51bGwsdHJ1ZSkpOyk7cmV0dXJuIHJ9OmZ1bmN0aW9uKG4pe3JldHVybiBuPW5bb10saT09PW4mJigwIT09aXx8MS9pPT0xL24pXG59fSxKLmN1cnJ5PWZ1bmN0aW9uKG4sdCl7cmV0dXJuIHQ9dHlwZW9mIHQ9PVwibnVtYmVyXCI/dDordHx8bi5sZW5ndGgsY3Qobiw0LG51bGwsbnVsbCxudWxsLHQpfSxKLmRlYm91bmNlPVZ0LEouZGVmYXVsdHM9XyxKLmRlZmVyPWZ1bmN0aW9uKG4pe2lmKCFkdChuKSl0aHJvdyBuZXcgaWU7dmFyIHQ9cChhcmd1bWVudHMsMSk7cmV0dXJuIF9lKGZ1bmN0aW9uKCl7bi5hcHBseSh2LHQpfSwxKX0sSi5kZWxheT1mdW5jdGlvbihuLHQpe2lmKCFkdChuKSl0aHJvdyBuZXcgaWU7dmFyIGU9cChhcmd1bWVudHMsMik7cmV0dXJuIF9lKGZ1bmN0aW9uKCl7bi5hcHBseSh2LGUpfSx0KX0sSi5kaWZmZXJlbmNlPWZ1bmN0aW9uKG4pe3JldHVybiBydChuLHV0KGFyZ3VtZW50cyx0cnVlLHRydWUsMSkpfSxKLmZpbHRlcj1OdCxKLmZsYXR0ZW49ZnVuY3Rpb24obix0LGUscil7cmV0dXJuIHR5cGVvZiB0IT1cImJvb2xlYW5cIiYmbnVsbCE9dCYmKHI9ZSxlPXR5cGVvZiB0IT1cImZ1bmN0aW9uXCImJnImJnJbdF09PT1uP251bGw6dCx0PWZhbHNlKSxudWxsIT1lJiYobj1SdChuLGUscikpLHV0KG4sdClcbn0sSi5mb3JFYWNoPVN0LEouZm9yRWFjaFJpZ2h0PUV0LEouZm9ySW49ZyxKLmZvckluUmlnaHQ9ZnVuY3Rpb24obix0LGUpe3ZhciByPVtdO2cobixmdW5jdGlvbihuLHQpe3IucHVzaCh0LG4pfSk7dmFyIHU9ci5sZW5ndGg7Zm9yKHQ9dHQodCxlLDMpO3UtLSYmZmFsc2UhPT10KHJbdS0tXSxyW3VdLG4pOyk7cmV0dXJuIG59LEouZm9yT3duPWgsSi5mb3JPd25SaWdodD1tdCxKLmZ1bmN0aW9ucz1idCxKLmdyb3VwQnk9TGUsSi5pbmRleEJ5PU1lLEouaW5pdGlhbD1mdW5jdGlvbihuLHQsZSl7dmFyIHI9MCx1PW4/bi5sZW5ndGg6MDtpZih0eXBlb2YgdCE9XCJudW1iZXJcIiYmbnVsbCE9dCl7dmFyIG89dTtmb3IodD1KLmNyZWF0ZUNhbGxiYWNrKHQsZSwzKTtvLS0mJnQobltvXSxvLG4pOylyKyt9ZWxzZSByPW51bGw9PXR8fGU/MTp0fHxyO3JldHVybiBwKG4sMCxTZShJZSgwLHUtciksdSkpfSxKLmludGVyc2VjdGlvbj1mdW5jdGlvbigpe2Zvcih2YXIgZT1bXSxyPS0xLHU9YXJndW1lbnRzLmxlbmd0aCxpPWEoKSxmPXN0KCkscD1mPT09bixzPWEoKTsrK3I8dTspe3ZhciB2PWFyZ3VtZW50c1tyXTtcbihUZSh2KXx8eXQodikpJiYoZS5wdXNoKHYpLGkucHVzaChwJiZ2Lmxlbmd0aD49YiYmbyhyP2Vbcl06cykpKX12YXIgcD1lWzBdLGg9LTEsZz1wP3AubGVuZ3RoOjAseT1bXTtuOmZvcig7KytoPGc7KXt2YXIgbT1pWzBdLHY9cFtoXTtpZigwPihtP3QobSx2KTpmKHMsdikpKXtmb3Iocj11LChtfHxzKS5wdXNoKHYpOy0tcjspaWYobT1pW3JdLDA+KG0/dChtLHYpOmYoZVtyXSx2KSkpY29udGludWUgbjt5LnB1c2godil9fWZvcig7dS0tOykobT1pW3VdKSYmYyhtKTtyZXR1cm4gbChpKSxsKHMpLHl9LEouaW52ZXJ0PV90LEouaW52b2tlPWZ1bmN0aW9uKG4sdCl7dmFyIGU9cChhcmd1bWVudHMsMikscj0tMSx1PXR5cGVvZiB0PT1cImZ1bmN0aW9uXCIsbz1uP24ubGVuZ3RoOjAsaT1YdCh0eXBlb2Ygbz09XCJudW1iZXJcIj9vOjApO3JldHVybiBTdChuLGZ1bmN0aW9uKG4pe2lbKytyXT0odT90Om5bdF0pLmFwcGx5KG4sZSl9KSxpfSxKLmtleXM9RmUsSi5tYXA9UnQsSi5tYXBWYWx1ZXM9ZnVuY3Rpb24obix0LGUpe3ZhciByPXt9O1xucmV0dXJuIHQ9Si5jcmVhdGVDYWxsYmFjayh0LGUsMyksaChuLGZ1bmN0aW9uKG4sZSx1KXtyW2VdPXQobixlLHUpfSkscn0sSi5tYXg9QXQsSi5tZW1vaXplPWZ1bmN0aW9uKG4sdCl7ZnVuY3Rpb24gZSgpe3ZhciByPWUuY2FjaGUsdT10P3QuYXBwbHkodGhpcyxhcmd1bWVudHMpOm0rYXJndW1lbnRzWzBdO3JldHVybiBtZS5jYWxsKHIsdSk/clt1XTpyW3VdPW4uYXBwbHkodGhpcyxhcmd1bWVudHMpfWlmKCFkdChuKSl0aHJvdyBuZXcgaWU7cmV0dXJuIGUuY2FjaGU9e30sZX0sSi5tZXJnZT1mdW5jdGlvbihuKXt2YXIgdD1hcmd1bWVudHMsZT0yO2lmKCF3dChuKSlyZXR1cm4gbjtpZihcIm51bWJlclwiIT10eXBlb2YgdFsyXSYmKGU9dC5sZW5ndGgpLDM8ZSYmXCJmdW5jdGlvblwiPT10eXBlb2YgdFtlLTJdKXZhciByPXR0KHRbLS1lLTFdLHRbZS0tXSwyKTtlbHNlIDI8ZSYmXCJmdW5jdGlvblwiPT10eXBlb2YgdFtlLTFdJiYocj10Wy0tZV0pO2Zvcih2YXIgdD1wKGFyZ3VtZW50cywxLGUpLHU9LTEsbz1hKCksaT1hKCk7Kyt1PGU7KWl0KG4sdFt1XSxyLG8saSk7XG5yZXR1cm4gbChvKSxsKGkpLG59LEoubWluPWZ1bmN0aW9uKG4sdCxlKXt2YXIgdT0xLzAsbz11O2lmKHR5cGVvZiB0IT1cImZ1bmN0aW9uXCImJmUmJmVbdF09PT1uJiYodD1udWxsKSxudWxsPT10JiZUZShuKSl7ZT0tMTtmb3IodmFyIGk9bi5sZW5ndGg7KytlPGk7KXt2YXIgYT1uW2VdO2E8byYmKG89YSl9fWVsc2UgdD1udWxsPT10JiZrdChuKT9yOkouY3JlYXRlQ2FsbGJhY2sodCxlLDMpLFN0KG4sZnVuY3Rpb24obixlLHIpe2U9dChuLGUsciksZTx1JiYodT1lLG89bil9KTtyZXR1cm4gb30sSi5vbWl0PWZ1bmN0aW9uKG4sdCxlKXt2YXIgcj17fTtpZih0eXBlb2YgdCE9XCJmdW5jdGlvblwiKXt2YXIgdT1bXTtnKG4sZnVuY3Rpb24obix0KXt1LnB1c2godCl9KTtmb3IodmFyIHU9cnQodSx1dChhcmd1bWVudHMsdHJ1ZSxmYWxzZSwxKSksbz0tMSxpPXUubGVuZ3RoOysrbzxpOyl7dmFyIGE9dVtvXTtyW2FdPW5bYV19fWVsc2UgdD1KLmNyZWF0ZUNhbGxiYWNrKHQsZSwzKSxnKG4sZnVuY3Rpb24obixlLHUpe3QobixlLHUpfHwocltlXT1uKVxufSk7cmV0dXJuIHJ9LEoub25jZT1mdW5jdGlvbihuKXt2YXIgdCxlO2lmKCFkdChuKSl0aHJvdyBuZXcgaWU7cmV0dXJuIGZ1bmN0aW9uKCl7cmV0dXJuIHQ/ZToodD10cnVlLGU9bi5hcHBseSh0aGlzLGFyZ3VtZW50cyksbj1udWxsLGUpfX0sSi5wYWlycz1mdW5jdGlvbihuKXtmb3IodmFyIHQ9LTEsZT1GZShuKSxyPWUubGVuZ3RoLHU9WHQocik7Kyt0PHI7KXt2YXIgbz1lW3RdO3VbdF09W28sbltvXV19cmV0dXJuIHV9LEoucGFydGlhbD1mdW5jdGlvbihuKXtyZXR1cm4gY3QobiwxNixwKGFyZ3VtZW50cywxKSl9LEoucGFydGlhbFJpZ2h0PWZ1bmN0aW9uKG4pe3JldHVybiBjdChuLDMyLG51bGwscChhcmd1bWVudHMsMSkpfSxKLnBpY2s9ZnVuY3Rpb24obix0LGUpe3ZhciByPXt9O2lmKHR5cGVvZiB0IT1cImZ1bmN0aW9uXCIpZm9yKHZhciB1PS0xLG89dXQoYXJndW1lbnRzLHRydWUsZmFsc2UsMSksaT13dChuKT9vLmxlbmd0aDowOysrdTxpOyl7dmFyIGE9b1t1XTthIGluIG4mJihyW2FdPW5bYV0pXG59ZWxzZSB0PUouY3JlYXRlQ2FsbGJhY2sodCxlLDMpLGcobixmdW5jdGlvbihuLGUsdSl7dChuLGUsdSkmJihyW2VdPW4pfSk7cmV0dXJuIHJ9LEoucGx1Y2s9VmUsSi5wcm9wZXJ0eT1KdCxKLnB1bGw9ZnVuY3Rpb24obil7Zm9yKHZhciB0PWFyZ3VtZW50cyxlPTAscj10Lmxlbmd0aCx1PW4/bi5sZW5ndGg6MDsrK2U8cjspZm9yKHZhciBvPS0xLGk9dFtlXTsrK288dTspbltvXT09PWkmJihkZS5jYWxsKG4sby0tLDEpLHUtLSk7cmV0dXJuIG59LEoucmFuZ2U9ZnVuY3Rpb24obix0LGUpe249K258fDAsZT10eXBlb2YgZT09XCJudW1iZXJcIj9lOitlfHwxLG51bGw9PXQmJih0PW4sbj0wKTt2YXIgcj0tMTt0PUllKDAsc2UoKHQtbikvKGV8fDEpKSk7Zm9yKHZhciB1PVh0KHQpOysrcjx0Oyl1W3JdPW4sbis9ZTtyZXR1cm4gdX0sSi5yZWplY3Q9ZnVuY3Rpb24obix0LGUpe3JldHVybiB0PUouY3JlYXRlQ2FsbGJhY2sodCxlLDMpLE50KG4sZnVuY3Rpb24obixlLHIpe3JldHVybiF0KG4sZSxyKVxufSl9LEoucmVtb3ZlPWZ1bmN0aW9uKG4sdCxlKXt2YXIgcj0tMSx1PW4/bi5sZW5ndGg6MCxvPVtdO2Zvcih0PUouY3JlYXRlQ2FsbGJhY2sodCxlLDMpOysrcjx1OyllPW5bcl0sdChlLHIsbikmJihvLnB1c2goZSksZGUuY2FsbChuLHItLSwxKSx1LS0pO3JldHVybiBvfSxKLnJlc3Q9cXQsSi5zaHVmZmxlPVR0LEouc29ydEJ5PWZ1bmN0aW9uKG4sdCxlKXt2YXIgcj0tMSxvPVRlKHQpLGk9bj9uLmxlbmd0aDowLHA9WHQodHlwZW9mIGk9PVwibnVtYmVyXCI/aTowKTtmb3Iob3x8KHQ9Si5jcmVhdGVDYWxsYmFjayh0LGUsMykpLFN0KG4sZnVuY3Rpb24obixlLHUpe3ZhciBpPXBbKytyXT1mKCk7bz9pLm09UnQodCxmdW5jdGlvbih0KXtyZXR1cm4gblt0XX0pOihpLm09YSgpKVswXT10KG4sZSx1KSxpLm49cixpLm89bn0pLGk9cC5sZW5ndGgscC5zb3J0KHUpO2ktLTspbj1wW2ldLHBbaV09bi5vLG98fGwobi5tKSxjKG4pO3JldHVybiBwfSxKLnRhcD1mdW5jdGlvbihuLHQpe3JldHVybiB0KG4pLG5cbn0sSi50aHJvdHRsZT1mdW5jdGlvbihuLHQsZSl7dmFyIHI9dHJ1ZSx1PXRydWU7aWYoIWR0KG4pKXRocm93IG5ldyBpZTtyZXR1cm4gZmFsc2U9PT1lP3I9ZmFsc2U6d3QoZSkmJihyPVwibGVhZGluZ1wiaW4gZT9lLmxlYWRpbmc6cix1PVwidHJhaWxpbmdcImluIGU/ZS50cmFpbGluZzp1KSxMLmxlYWRpbmc9cixMLm1heFdhaXQ9dCxMLnRyYWlsaW5nPXUsVnQobix0LEwpfSxKLnRpbWVzPWZ1bmN0aW9uKG4sdCxlKXtuPS0xPChuPStuKT9uOjA7dmFyIHI9LTEsdT1YdChuKTtmb3IodD10dCh0LGUsMSk7KytyPG47KXVbcl09dChyKTtyZXR1cm4gdX0sSi50b0FycmF5PWZ1bmN0aW9uKG4pe3JldHVybiBuJiZ0eXBlb2Ygbi5sZW5ndGg9PVwibnVtYmVyXCI/cChuKTp4dChuKX0sSi50cmFuc2Zvcm09ZnVuY3Rpb24obix0LGUscil7dmFyIHU9VGUobik7aWYobnVsbD09ZSlpZih1KWU9W107ZWxzZXt2YXIgbz1uJiZuLmNvbnN0cnVjdG9yO2U9bnQobyYmby5wcm90b3R5cGUpfXJldHVybiB0JiYodD1KLmNyZWF0ZUNhbGxiYWNrKHQsciw0KSwodT9TdDpoKShuLGZ1bmN0aW9uKG4scix1KXtyZXR1cm4gdChlLG4scix1KVxufSkpLGV9LEoudW5pb249ZnVuY3Rpb24oKXtyZXR1cm4gZnQodXQoYXJndW1lbnRzLHRydWUsdHJ1ZSkpfSxKLnVuaXE9UHQsSi52YWx1ZXM9eHQsSi53aGVyZT1OdCxKLndpdGhvdXQ9ZnVuY3Rpb24obil7cmV0dXJuIHJ0KG4scChhcmd1bWVudHMsMSkpfSxKLndyYXA9ZnVuY3Rpb24obix0KXtyZXR1cm4gY3QodCwxNixbbl0pfSxKLnhvcj1mdW5jdGlvbigpe2Zvcih2YXIgbj0tMSx0PWFyZ3VtZW50cy5sZW5ndGg7KytuPHQ7KXt2YXIgZT1hcmd1bWVudHNbbl07aWYoVGUoZSl8fHl0KGUpKXZhciByPXI/ZnQocnQocixlKS5jb25jYXQocnQoZSxyKSkpOmV9cmV0dXJuIHJ8fFtdfSxKLnppcD1LdCxKLnppcE9iamVjdD1MdCxKLmNvbGxlY3Q9UnQsSi5kcm9wPXF0LEouZWFjaD1TdCxKLmVhY2hSaWdodD1FdCxKLmV4dGVuZD1VLEoubWV0aG9kcz1idCxKLm9iamVjdD1MdCxKLnNlbGVjdD1OdCxKLnRhaWw9cXQsSi51bmlxdWU9UHQsSi51bnppcD1LdCxHdChKKSxKLmNsb25lPWZ1bmN0aW9uKG4sdCxlLHIpe3JldHVybiB0eXBlb2YgdCE9XCJib29sZWFuXCImJm51bGwhPXQmJihyPWUsZT10LHQ9ZmFsc2UpLFoobix0LHR5cGVvZiBlPT1cImZ1bmN0aW9uXCImJnR0KGUsciwxKSlcbn0sSi5jbG9uZURlZXA9ZnVuY3Rpb24obix0LGUpe3JldHVybiBaKG4sdHJ1ZSx0eXBlb2YgdD09XCJmdW5jdGlvblwiJiZ0dCh0LGUsMSkpfSxKLmNvbnRhaW5zPUN0LEouZXNjYXBlPWZ1bmN0aW9uKG4pe3JldHVybiBudWxsPT1uP1wiXCI6b2UobikucmVwbGFjZSh6ZSxwdCl9LEouZXZlcnk9T3QsSi5maW5kPUl0LEouZmluZEluZGV4PWZ1bmN0aW9uKG4sdCxlKXt2YXIgcj0tMSx1PW4/bi5sZW5ndGg6MDtmb3IodD1KLmNyZWF0ZUNhbGxiYWNrKHQsZSwzKTsrK3I8dTspaWYodChuW3JdLHIsbikpcmV0dXJuIHI7cmV0dXJuLTF9LEouZmluZEtleT1mdW5jdGlvbihuLHQsZSl7dmFyIHI7cmV0dXJuIHQ9Si5jcmVhdGVDYWxsYmFjayh0LGUsMyksaChuLGZ1bmN0aW9uKG4sZSx1KXtyZXR1cm4gdChuLGUsdSk/KHI9ZSxmYWxzZSk6dm9pZCAwfSkscn0sSi5maW5kTGFzdD1mdW5jdGlvbihuLHQsZSl7dmFyIHI7cmV0dXJuIHQ9Si5jcmVhdGVDYWxsYmFjayh0LGUsMyksRXQobixmdW5jdGlvbihuLGUsdSl7cmV0dXJuIHQobixlLHUpPyhyPW4sZmFsc2UpOnZvaWQgMFxufSkscn0sSi5maW5kTGFzdEluZGV4PWZ1bmN0aW9uKG4sdCxlKXt2YXIgcj1uP24ubGVuZ3RoOjA7Zm9yKHQ9Si5jcmVhdGVDYWxsYmFjayh0LGUsMyk7ci0tOylpZih0KG5bcl0scixuKSlyZXR1cm4gcjtyZXR1cm4tMX0sSi5maW5kTGFzdEtleT1mdW5jdGlvbihuLHQsZSl7dmFyIHI7cmV0dXJuIHQ9Si5jcmVhdGVDYWxsYmFjayh0LGUsMyksbXQobixmdW5jdGlvbihuLGUsdSl7cmV0dXJuIHQobixlLHUpPyhyPWUsZmFsc2UpOnZvaWQgMH0pLHJ9LEouaGFzPWZ1bmN0aW9uKG4sdCl7cmV0dXJuIG4/bWUuY2FsbChuLHQpOmZhbHNlfSxKLmlkZW50aXR5PVV0LEouaW5kZXhPZj1XdCxKLmlzQXJndW1lbnRzPXl0LEouaXNBcnJheT1UZSxKLmlzQm9vbGVhbj1mdW5jdGlvbihuKXtyZXR1cm4gdHJ1ZT09PW58fGZhbHNlPT09bnx8biYmdHlwZW9mIG49PVwib2JqZWN0XCImJmNlLmNhbGwobik9PVR8fGZhbHNlfSxKLmlzRGF0ZT1mdW5jdGlvbihuKXtyZXR1cm4gbiYmdHlwZW9mIG49PVwib2JqZWN0XCImJmNlLmNhbGwobik9PUZ8fGZhbHNlXG59LEouaXNFbGVtZW50PWZ1bmN0aW9uKG4pe3JldHVybiBuJiYxPT09bi5ub2RlVHlwZXx8ZmFsc2V9LEouaXNFbXB0eT1mdW5jdGlvbihuKXt2YXIgdD10cnVlO2lmKCFuKXJldHVybiB0O3ZhciBlPWNlLmNhbGwobikscj1uLmxlbmd0aDtyZXR1cm4gZT09JHx8ZT09UHx8ZT09RHx8ZT09cSYmdHlwZW9mIHI9PVwibnVtYmVyXCImJmR0KG4uc3BsaWNlKT8hcjooaChuLGZ1bmN0aW9uKCl7cmV0dXJuIHQ9ZmFsc2V9KSx0KX0sSi5pc0VxdWFsPWZ1bmN0aW9uKG4sdCxlLHIpe3JldHVybiBvdChuLHQsdHlwZW9mIGU9PVwiZnVuY3Rpb25cIiYmdHQoZSxyLDIpKX0sSi5pc0Zpbml0ZT1mdW5jdGlvbihuKXtyZXR1cm4gQ2UobikmJiFPZShwYXJzZUZsb2F0KG4pKX0sSi5pc0Z1bmN0aW9uPWR0LEouaXNOYU49ZnVuY3Rpb24obil7cmV0dXJuIGp0KG4pJiZuIT0rbn0sSi5pc051bGw9ZnVuY3Rpb24obil7cmV0dXJuIG51bGw9PT1ufSxKLmlzTnVtYmVyPWp0LEouaXNPYmplY3Q9d3QsSi5pc1BsYWluT2JqZWN0PVBlLEouaXNSZWdFeHA9ZnVuY3Rpb24obil7cmV0dXJuIG4mJnR5cGVvZiBuPT1cIm9iamVjdFwiJiZjZS5jYWxsKG4pPT16fHxmYWxzZVxufSxKLmlzU3RyaW5nPWt0LEouaXNVbmRlZmluZWQ9ZnVuY3Rpb24obil7cmV0dXJuIHR5cGVvZiBuPT1cInVuZGVmaW5lZFwifSxKLmxhc3RJbmRleE9mPWZ1bmN0aW9uKG4sdCxlKXt2YXIgcj1uP24ubGVuZ3RoOjA7Zm9yKHR5cGVvZiBlPT1cIm51bWJlclwiJiYocj0oMD5lP0llKDAscitlKTpTZShlLHItMSkpKzEpO3ItLTspaWYobltyXT09PXQpcmV0dXJuIHI7cmV0dXJuLTF9LEoubWl4aW49R3QsSi5ub0NvbmZsaWN0PWZ1bmN0aW9uKCl7cmV0dXJuIGUuXz1sZSx0aGlzfSxKLm5vb3A9SHQsSi5ub3c9VWUsSi5wYXJzZUludD1HZSxKLnJhbmRvbT1mdW5jdGlvbihuLHQsZSl7dmFyIHI9bnVsbD09bix1PW51bGw9PXQ7cmV0dXJuIG51bGw9PWUmJih0eXBlb2Ygbj09XCJib29sZWFuXCImJnU/KGU9bixuPTEpOnV8fHR5cGVvZiB0IT1cImJvb2xlYW5cInx8KGU9dCx1PXRydWUpKSxyJiZ1JiYodD0xKSxuPStufHwwLHU/KHQ9bixuPTApOnQ9K3R8fDAsZXx8biUxfHx0JTE/KGU9UmUoKSxTZShuK2UqKHQtbitwYXJzZUZsb2F0KFwiMWUtXCIrKChlK1wiXCIpLmxlbmd0aC0xKSkpLHQpKTphdChuLHQpXG59LEoucmVkdWNlPUR0LEoucmVkdWNlUmlnaHQ9JHQsSi5yZXN1bHQ9ZnVuY3Rpb24obix0KXtpZihuKXt2YXIgZT1uW3RdO3JldHVybiBkdChlKT9uW3RdKCk6ZX19LEoucnVuSW5Db250ZXh0PXMsSi5zaXplPWZ1bmN0aW9uKG4pe3ZhciB0PW4/bi5sZW5ndGg6MDtyZXR1cm4gdHlwZW9mIHQ9PVwibnVtYmVyXCI/dDpGZShuKS5sZW5ndGh9LEouc29tZT1GdCxKLnNvcnRlZEluZGV4PXp0LEoudGVtcGxhdGU9ZnVuY3Rpb24obix0LGUpe3ZhciByPUoudGVtcGxhdGVTZXR0aW5ncztuPW9lKG58fFwiXCIpLGU9Xyh7fSxlLHIpO3ZhciB1LG89Xyh7fSxlLmltcG9ydHMsci5pbXBvcnRzKSxyPUZlKG8pLG89eHQobyksYT0wLGY9ZS5pbnRlcnBvbGF0ZXx8UyxsPVwiX19wKz0nXCIsZj11ZSgoZS5lc2NhcGV8fFMpLnNvdXJjZStcInxcIitmLnNvdXJjZStcInxcIisoZj09PU4/eDpTKS5zb3VyY2UrXCJ8XCIrKGUuZXZhbHVhdGV8fFMpLnNvdXJjZStcInwkXCIsXCJnXCIpO24ucmVwbGFjZShmLGZ1bmN0aW9uKHQsZSxyLG8sZixjKXtyZXR1cm4gcnx8KHI9byksbCs9bi5zbGljZShhLGMpLnJlcGxhY2UoUixpKSxlJiYobCs9XCInK19fZShcIitlK1wiKSsnXCIpLGYmJih1PXRydWUsbCs9XCInO1wiK2YrXCI7XFxuX19wKz0nXCIpLHImJihsKz1cIicrKChfX3Q9KFwiK3IrXCIpKT09bnVsbD8nJzpfX3QpKydcIiksYT1jK3QubGVuZ3RoLHRcbn0pLGwrPVwiJztcIixmPWU9ZS52YXJpYWJsZSxmfHwoZT1cIm9ialwiLGw9XCJ3aXRoKFwiK2UrXCIpe1wiK2wrXCJ9XCIpLGw9KHU/bC5yZXBsYWNlKHcsXCJcIik6bCkucmVwbGFjZShqLFwiJDFcIikucmVwbGFjZShrLFwiJDE7XCIpLGw9XCJmdW5jdGlvbihcIitlK1wiKXtcIisoZj9cIlwiOmUrXCJ8fChcIitlK1wiPXt9KTtcIikrXCJ2YXIgX190LF9fcD0nJyxfX2U9Xy5lc2NhcGVcIisodT9cIixfX2o9QXJyYXkucHJvdG90eXBlLmpvaW47ZnVuY3Rpb24gcHJpbnQoKXtfX3ArPV9fai5jYWxsKGFyZ3VtZW50cywnJyl9XCI6XCI7XCIpK2wrXCJyZXR1cm4gX19wfVwiO3RyeXt2YXIgYz1uZShyLFwicmV0dXJuIFwiK2wpLmFwcGx5KHYsbyl9Y2F0Y2gocCl7dGhyb3cgcC5zb3VyY2U9bCxwfXJldHVybiB0P2ModCk6KGMuc291cmNlPWwsYyl9LEoudW5lc2NhcGU9ZnVuY3Rpb24obil7cmV0dXJuIG51bGw9PW4/XCJcIjpvZShuKS5yZXBsYWNlKHFlLGd0KX0sSi51bmlxdWVJZD1mdW5jdGlvbihuKXt2YXIgdD0rK3k7cmV0dXJuIG9lKG51bGw9PW4/XCJcIjpuKSt0XG59LEouYWxsPU90LEouYW55PUZ0LEouZGV0ZWN0PUl0LEouZmluZFdoZXJlPUl0LEouZm9sZGw9RHQsSi5mb2xkcj0kdCxKLmluY2x1ZGU9Q3QsSi5pbmplY3Q9RHQsR3QoZnVuY3Rpb24oKXt2YXIgbj17fTtyZXR1cm4gaChKLGZ1bmN0aW9uKHQsZSl7Si5wcm90b3R5cGVbZV18fChuW2VdPXQpfSksbn0oKSxmYWxzZSksSi5maXJzdD1CdCxKLmxhc3Q9ZnVuY3Rpb24obix0LGUpe3ZhciByPTAsdT1uP24ubGVuZ3RoOjA7aWYodHlwZW9mIHQhPVwibnVtYmVyXCImJm51bGwhPXQpe3ZhciBvPXU7Zm9yKHQ9Si5jcmVhdGVDYWxsYmFjayh0LGUsMyk7by0tJiZ0KG5bb10sbyxuKTspcisrfWVsc2UgaWYocj10LG51bGw9PXJ8fGUpcmV0dXJuIG4/blt1LTFdOnY7cmV0dXJuIHAobixJZSgwLHUtcikpfSxKLnNhbXBsZT1mdW5jdGlvbihuLHQsZSl7cmV0dXJuIG4mJnR5cGVvZiBuLmxlbmd0aCE9XCJudW1iZXJcIiYmKG49eHQobikpLG51bGw9PXR8fGU/bj9uW2F0KDAsbi5sZW5ndGgtMSldOnY6KG49VHQobiksbi5sZW5ndGg9U2UoSWUoMCx0KSxuLmxlbmd0aCksbilcbn0sSi50YWtlPUJ0LEouaGVhZD1CdCxoKEosZnVuY3Rpb24obix0KXt2YXIgZT1cInNhbXBsZVwiIT09dDtKLnByb3RvdHlwZVt0XXx8KEoucHJvdG90eXBlW3RdPWZ1bmN0aW9uKHQscil7dmFyIHU9dGhpcy5fX2NoYWluX18sbz1uKHRoaXMuX193cmFwcGVkX18sdCxyKTtyZXR1cm4gdXx8bnVsbCE9dCYmKCFyfHxlJiZ0eXBlb2YgdD09XCJmdW5jdGlvblwiKT9uZXcgUShvLHUpOm99KX0pLEouVkVSU0lPTj1cIjIuNC4xXCIsSi5wcm90b3R5cGUuY2hhaW49ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5fX2NoYWluX189dHJ1ZSx0aGlzfSxKLnByb3RvdHlwZS50b1N0cmluZz1mdW5jdGlvbigpe3JldHVybiBvZSh0aGlzLl9fd3JhcHBlZF9fKX0sSi5wcm90b3R5cGUudmFsdWU9UXQsSi5wcm90b3R5cGUudmFsdWVPZj1RdCxTdChbXCJqb2luXCIsXCJwb3BcIixcInNoaWZ0XCJdLGZ1bmN0aW9uKG4pe3ZhciB0PWFlW25dO0oucHJvdG90eXBlW25dPWZ1bmN0aW9uKCl7dmFyIG49dGhpcy5fX2NoYWluX18sZT10LmFwcGx5KHRoaXMuX193cmFwcGVkX18sYXJndW1lbnRzKTtcbnJldHVybiBuP25ldyBRKGUsbik6ZX19KSxTdChbXCJwdXNoXCIsXCJyZXZlcnNlXCIsXCJzb3J0XCIsXCJ1bnNoaWZ0XCJdLGZ1bmN0aW9uKG4pe3ZhciB0PWFlW25dO0oucHJvdG90eXBlW25dPWZ1bmN0aW9uKCl7cmV0dXJuIHQuYXBwbHkodGhpcy5fX3dyYXBwZWRfXyxhcmd1bWVudHMpLHRoaXN9fSksU3QoW1wiY29uY2F0XCIsXCJzbGljZVwiLFwic3BsaWNlXCJdLGZ1bmN0aW9uKG4pe3ZhciB0PWFlW25dO0oucHJvdG90eXBlW25dPWZ1bmN0aW9uKCl7cmV0dXJuIG5ldyBRKHQuYXBwbHkodGhpcy5fX3dyYXBwZWRfXyxhcmd1bWVudHMpLHRoaXMuX19jaGFpbl9fKX19KSxKfXZhciB2LGg9W10sZz1bXSx5PTAsbT0rbmV3IERhdGUrXCJcIixiPTc1LF89NDAsZD1cIiBcXHRcXHgwQlxcZlxceGEwXFx1ZmVmZlxcblxcclxcdTIwMjhcXHUyMDI5XFx1MTY4MFxcdTE4MGVcXHUyMDAwXFx1MjAwMVxcdTIwMDJcXHUyMDAzXFx1MjAwNFxcdTIwMDVcXHUyMDA2XFx1MjAwN1xcdTIwMDhcXHUyMDA5XFx1MjAwYVxcdTIwMmZcXHUyMDVmXFx1MzAwMFwiLHc9L1xcYl9fcFxcKz0nJzsvZyxqPS9cXGIoX19wXFwrPSknJ1xcKy9nLGs9LyhfX2VcXCguKj9cXCl8XFxiX190XFwpKVxcKycnOy9nLHg9L1xcJFxceyhbXlxcXFx9XSooPzpcXFxcLlteXFxcXH1dKikqKVxcfS9nLEM9L1xcdyokLyxPPS9eXFxzKmZ1bmN0aW9uWyBcXG5cXHJcXHRdK1xcdy8sTj0vPCU9KFtcXHNcXFNdKz8pJT4vZyxJPVJlZ0V4cChcIl5bXCIrZCtcIl0qMCsoPz0uJClcIiksUz0vKCReKS8sRT0vXFxidGhpc1xcYi8sUj0vWydcXG5cXHJcXHRcXHUyMDI4XFx1MjAyOVxcXFxdL2csQT1cIkFycmF5IEJvb2xlYW4gRGF0ZSBGdW5jdGlvbiBNYXRoIE51bWJlciBPYmplY3QgUmVnRXhwIFN0cmluZyBfIGF0dGFjaEV2ZW50IGNsZWFyVGltZW91dCBpc0Zpbml0ZSBpc05hTiBwYXJzZUludCBzZXRUaW1lb3V0XCIuc3BsaXQoXCIgXCIpLEQ9XCJbb2JqZWN0IEFyZ3VtZW50c11cIiwkPVwiW29iamVjdCBBcnJheV1cIixUPVwiW29iamVjdCBCb29sZWFuXVwiLEY9XCJbb2JqZWN0IERhdGVdXCIsQj1cIltvYmplY3QgRnVuY3Rpb25dXCIsVz1cIltvYmplY3QgTnVtYmVyXVwiLHE9XCJbb2JqZWN0IE9iamVjdF1cIix6PVwiW29iamVjdCBSZWdFeHBdXCIsUD1cIltvYmplY3QgU3RyaW5nXVwiLEs9e307XG5LW0JdPWZhbHNlLEtbRF09S1skXT1LW1RdPUtbRl09S1tXXT1LW3FdPUtbel09S1tQXT10cnVlO3ZhciBMPXtsZWFkaW5nOmZhbHNlLG1heFdhaXQ6MCx0cmFpbGluZzpmYWxzZX0sTT17Y29uZmlndXJhYmxlOmZhbHNlLGVudW1lcmFibGU6ZmFsc2UsdmFsdWU6bnVsbCx3cml0YWJsZTpmYWxzZX0sVj17XCJib29sZWFuXCI6ZmFsc2UsXCJmdW5jdGlvblwiOnRydWUsb2JqZWN0OnRydWUsbnVtYmVyOmZhbHNlLHN0cmluZzpmYWxzZSx1bmRlZmluZWQ6ZmFsc2V9LFU9e1wiXFxcXFwiOlwiXFxcXFwiLFwiJ1wiOlwiJ1wiLFwiXFxuXCI6XCJuXCIsXCJcXHJcIjpcInJcIixcIlxcdFwiOlwidFwiLFwiXFx1MjAyOFwiOlwidTIwMjhcIixcIlxcdTIwMjlcIjpcInUyMDI5XCJ9LEc9Vlt0eXBlb2Ygd2luZG93XSYmd2luZG93fHx0aGlzLEg9Vlt0eXBlb2YgZXhwb3J0c10mJmV4cG9ydHMmJiFleHBvcnRzLm5vZGVUeXBlJiZleHBvcnRzLEo9Vlt0eXBlb2YgbW9kdWxlXSYmbW9kdWxlJiYhbW9kdWxlLm5vZGVUeXBlJiZtb2R1bGUsUT1KJiZKLmV4cG9ydHM9PT1IJiZILFg9Vlt0eXBlb2YgZ2xvYmFsXSYmZ2xvYmFsOyFYfHxYLmdsb2JhbCE9PVgmJlgud2luZG93IT09WHx8KEc9WCk7XG52YXIgWT1zKCk7dHlwZW9mIGRlZmluZT09XCJmdW5jdGlvblwiJiZ0eXBlb2YgZGVmaW5lLmFtZD09XCJvYmplY3RcIiYmZGVmaW5lLmFtZD8oRy5fPVksIGRlZmluZShmdW5jdGlvbigpe3JldHVybiBZfSkpOkgmJko/UT8oSi5leHBvcnRzPVkpLl89WTpILl89WTpHLl89WX0pLmNhbGwodGhpcyk7IiwiLy8hIG1vbWVudC5qc1xuLy8hIHZlcnNpb24gOiAyLjUuMVxuLy8hIGF1dGhvcnMgOiBUaW0gV29vZCwgSXNrcmVuIENoZXJuZXYsIE1vbWVudC5qcyBjb250cmlidXRvcnNcbi8vISBsaWNlbnNlIDogTUlUXG4vLyEgbW9tZW50anMuY29tXG4oZnVuY3Rpb24oYSl7ZnVuY3Rpb24gYigpe3JldHVybntlbXB0eTohMSx1bnVzZWRUb2tlbnM6W10sdW51c2VkSW5wdXQ6W10sb3ZlcmZsb3c6LTIsY2hhcnNMZWZ0T3ZlcjowLG51bGxJbnB1dDohMSxpbnZhbGlkTW9udGg6bnVsbCxpbnZhbGlkRm9ybWF0OiExLHVzZXJJbnZhbGlkYXRlZDohMSxpc286ITF9fWZ1bmN0aW9uIGMoYSxiKXtyZXR1cm4gZnVuY3Rpb24oYyl7cmV0dXJuIGsoYS5jYWxsKHRoaXMsYyksYil9fWZ1bmN0aW9uIGQoYSxiKXtyZXR1cm4gZnVuY3Rpb24oYyl7cmV0dXJuIHRoaXMubGFuZygpLm9yZGluYWwoYS5jYWxsKHRoaXMsYyksYil9fWZ1bmN0aW9uIGUoKXt9ZnVuY3Rpb24gZihhKXt3KGEpLGgodGhpcyxhKX1mdW5jdGlvbiBnKGEpe3ZhciBiPXEoYSksYz1iLnllYXJ8fDAsZD1iLm1vbnRofHwwLGU9Yi53ZWVrfHwwLGY9Yi5kYXl8fDAsZz1iLmhvdXJ8fDAsaD1iLm1pbnV0ZXx8MCxpPWIuc2Vjb25kfHwwLGo9Yi5taWxsaXNlY29uZHx8MDt0aGlzLl9taWxsaXNlY29uZHM9K2orMWUzKmkrNmU0KmgrMzZlNSpnLHRoaXMuX2RheXM9K2YrNyplLHRoaXMuX21vbnRocz0rZCsxMipjLHRoaXMuX2RhdGE9e30sdGhpcy5fYnViYmxlKCl9ZnVuY3Rpb24gaChhLGIpe2Zvcih2YXIgYyBpbiBiKWIuaGFzT3duUHJvcGVydHkoYykmJihhW2NdPWJbY10pO3JldHVybiBiLmhhc093blByb3BlcnR5KFwidG9TdHJpbmdcIikmJihhLnRvU3RyaW5nPWIudG9TdHJpbmcpLGIuaGFzT3duUHJvcGVydHkoXCJ2YWx1ZU9mXCIpJiYoYS52YWx1ZU9mPWIudmFsdWVPZiksYX1mdW5jdGlvbiBpKGEpe3ZhciBiLGM9e307Zm9yKGIgaW4gYSlhLmhhc093blByb3BlcnR5KGIpJiZxYi5oYXNPd25Qcm9wZXJ0eShiKSYmKGNbYl09YVtiXSk7cmV0dXJuIGN9ZnVuY3Rpb24gaihhKXtyZXR1cm4gMD5hP01hdGguY2VpbChhKTpNYXRoLmZsb29yKGEpfWZ1bmN0aW9uIGsoYSxiLGMpe2Zvcih2YXIgZD1cIlwiK01hdGguYWJzKGEpLGU9YT49MDtkLmxlbmd0aDxiOylkPVwiMFwiK2Q7cmV0dXJuKGU/Yz9cIitcIjpcIlwiOlwiLVwiKStkfWZ1bmN0aW9uIGwoYSxiLGMsZCl7dmFyIGUsZixnPWIuX21pbGxpc2Vjb25kcyxoPWIuX2RheXMsaT1iLl9tb250aHM7ZyYmYS5fZC5zZXRUaW1lKCthLl9kK2cqYyksKGh8fGkpJiYoZT1hLm1pbnV0ZSgpLGY9YS5ob3VyKCkpLGgmJmEuZGF0ZShhLmRhdGUoKStoKmMpLGkmJmEubW9udGgoYS5tb250aCgpK2kqYyksZyYmIWQmJmRiLnVwZGF0ZU9mZnNldChhKSwoaHx8aSkmJihhLm1pbnV0ZShlKSxhLmhvdXIoZikpfWZ1bmN0aW9uIG0oYSl7cmV0dXJuXCJbb2JqZWN0IEFycmF5XVwiPT09T2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGEpfWZ1bmN0aW9uIG4oYSl7cmV0dXJuXCJbb2JqZWN0IERhdGVdXCI9PT1PYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYSl8fGEgaW5zdGFuY2VvZiBEYXRlfWZ1bmN0aW9uIG8oYSxiLGMpe3ZhciBkLGU9TWF0aC5taW4oYS5sZW5ndGgsYi5sZW5ndGgpLGY9TWF0aC5hYnMoYS5sZW5ndGgtYi5sZW5ndGgpLGc9MDtmb3IoZD0wO2U+ZDtkKyspKGMmJmFbZF0hPT1iW2RdfHwhYyYmcyhhW2RdKSE9PXMoYltkXSkpJiZnKys7cmV0dXJuIGcrZn1mdW5jdGlvbiBwKGEpe2lmKGEpe3ZhciBiPWEudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC8oLilzJC8sXCIkMVwiKTthPVRiW2FdfHxVYltiXXx8Yn1yZXR1cm4gYX1mdW5jdGlvbiBxKGEpe3ZhciBiLGMsZD17fTtmb3IoYyBpbiBhKWEuaGFzT3duUHJvcGVydHkoYykmJihiPXAoYyksYiYmKGRbYl09YVtjXSkpO3JldHVybiBkfWZ1bmN0aW9uIHIoYil7dmFyIGMsZDtpZigwPT09Yi5pbmRleE9mKFwid2Vla1wiKSljPTcsZD1cImRheVwiO2Vsc2V7aWYoMCE9PWIuaW5kZXhPZihcIm1vbnRoXCIpKXJldHVybjtjPTEyLGQ9XCJtb250aFwifWRiW2JdPWZ1bmN0aW9uKGUsZil7dmFyIGcsaCxpPWRiLmZuLl9sYW5nW2JdLGo9W107aWYoXCJudW1iZXJcIj09dHlwZW9mIGUmJihmPWUsZT1hKSxoPWZ1bmN0aW9uKGEpe3ZhciBiPWRiKCkudXRjKCkuc2V0KGQsYSk7cmV0dXJuIGkuY2FsbChkYi5mbi5fbGFuZyxiLGV8fFwiXCIpfSxudWxsIT1mKXJldHVybiBoKGYpO2ZvcihnPTA7Yz5nO2crKylqLnB1c2goaChnKSk7cmV0dXJuIGp9fWZ1bmN0aW9uIHMoYSl7dmFyIGI9K2EsYz0wO3JldHVybiAwIT09YiYmaXNGaW5pdGUoYikmJihjPWI+PTA/TWF0aC5mbG9vcihiKTpNYXRoLmNlaWwoYikpLGN9ZnVuY3Rpb24gdChhLGIpe3JldHVybiBuZXcgRGF0ZShEYXRlLlVUQyhhLGIrMSwwKSkuZ2V0VVRDRGF0ZSgpfWZ1bmN0aW9uIHUoYSl7cmV0dXJuIHYoYSk/MzY2OjM2NX1mdW5jdGlvbiB2KGEpe3JldHVybiBhJTQ9PT0wJiZhJTEwMCE9PTB8fGElNDAwPT09MH1mdW5jdGlvbiB3KGEpe3ZhciBiO2EuX2EmJi0yPT09YS5fcGYub3ZlcmZsb3cmJihiPWEuX2FbamJdPDB8fGEuX2FbamJdPjExP2piOmEuX2Fba2JdPDF8fGEuX2Fba2JdPnQoYS5fYVtpYl0sYS5fYVtqYl0pP2tiOmEuX2FbbGJdPDB8fGEuX2FbbGJdPjIzP2xiOmEuX2FbbWJdPDB8fGEuX2FbbWJdPjU5P21iOmEuX2FbbmJdPDB8fGEuX2FbbmJdPjU5P25iOmEuX2Fbb2JdPDB8fGEuX2Fbb2JdPjk5OT9vYjotMSxhLl9wZi5fb3ZlcmZsb3dEYXlPZlllYXImJihpYj5ifHxiPmtiKSYmKGI9a2IpLGEuX3BmLm92ZXJmbG93PWIpfWZ1bmN0aW9uIHgoYSl7cmV0dXJuIG51bGw9PWEuX2lzVmFsaWQmJihhLl9pc1ZhbGlkPSFpc05hTihhLl9kLmdldFRpbWUoKSkmJmEuX3BmLm92ZXJmbG93PDAmJiFhLl9wZi5lbXB0eSYmIWEuX3BmLmludmFsaWRNb250aCYmIWEuX3BmLm51bGxJbnB1dCYmIWEuX3BmLmludmFsaWRGb3JtYXQmJiFhLl9wZi51c2VySW52YWxpZGF0ZWQsYS5fc3RyaWN0JiYoYS5faXNWYWxpZD1hLl9pc1ZhbGlkJiYwPT09YS5fcGYuY2hhcnNMZWZ0T3ZlciYmMD09PWEuX3BmLnVudXNlZFRva2Vucy5sZW5ndGgpKSxhLl9pc1ZhbGlkfWZ1bmN0aW9uIHkoYSl7cmV0dXJuIGE/YS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoXCJfXCIsXCItXCIpOmF9ZnVuY3Rpb24geihhLGIpe3JldHVybiBiLl9pc1VUQz9kYihhKS56b25lKGIuX29mZnNldHx8MCk6ZGIoYSkubG9jYWwoKX1mdW5jdGlvbiBBKGEsYil7cmV0dXJuIGIuYWJicj1hLHBiW2FdfHwocGJbYV09bmV3IGUpLHBiW2FdLnNldChiKSxwYlthXX1mdW5jdGlvbiBCKGEpe2RlbGV0ZSBwYlthXX1mdW5jdGlvbiBDKGEpe3ZhciBiLGMsZCxlLGY9MCxnPWZ1bmN0aW9uKGEpe2lmKCFwYlthXSYmcmIpdHJ5e3JlcXVpcmUoXCIuL2xhbmcvXCIrYSl9Y2F0Y2goYil7fXJldHVybiBwYlthXX07aWYoIWEpcmV0dXJuIGRiLmZuLl9sYW5nO2lmKCFtKGEpKXtpZihjPWcoYSkpcmV0dXJuIGM7YT1bYV19Zm9yKDtmPGEubGVuZ3RoOyl7Zm9yKGU9eShhW2ZdKS5zcGxpdChcIi1cIiksYj1lLmxlbmd0aCxkPXkoYVtmKzFdKSxkPWQ/ZC5zcGxpdChcIi1cIik6bnVsbDtiPjA7KXtpZihjPWcoZS5zbGljZSgwLGIpLmpvaW4oXCItXCIpKSlyZXR1cm4gYztpZihkJiZkLmxlbmd0aD49YiYmbyhlLGQsITApPj1iLTEpYnJlYWs7Yi0tfWYrK31yZXR1cm4gZGIuZm4uX2xhbmd9ZnVuY3Rpb24gRChhKXtyZXR1cm4gYS5tYXRjaCgvXFxbW1xcc1xcU10vKT9hLnJlcGxhY2UoL15cXFt8XFxdJC9nLFwiXCIpOmEucmVwbGFjZSgvXFxcXC9nLFwiXCIpfWZ1bmN0aW9uIEUoYSl7dmFyIGIsYyxkPWEubWF0Y2godmIpO2ZvcihiPTAsYz1kLmxlbmd0aDtjPmI7YisrKWRbYl09WWJbZFtiXV0/WWJbZFtiXV06RChkW2JdKTtyZXR1cm4gZnVuY3Rpb24oZSl7dmFyIGY9XCJcIjtmb3IoYj0wO2M+YjtiKyspZis9ZFtiXWluc3RhbmNlb2YgRnVuY3Rpb24/ZFtiXS5jYWxsKGUsYSk6ZFtiXTtyZXR1cm4gZn19ZnVuY3Rpb24gRihhLGIpe3JldHVybiBhLmlzVmFsaWQoKT8oYj1HKGIsYS5sYW5nKCkpLFZiW2JdfHwoVmJbYl09RShiKSksVmJbYl0oYSkpOmEubGFuZygpLmludmFsaWREYXRlKCl9ZnVuY3Rpb24gRyhhLGIpe2Z1bmN0aW9uIGMoYSl7cmV0dXJuIGIubG9uZ0RhdGVGb3JtYXQoYSl8fGF9dmFyIGQ9NTtmb3Iod2IubGFzdEluZGV4PTA7ZD49MCYmd2IudGVzdChhKTspYT1hLnJlcGxhY2Uod2IsYyksd2IubGFzdEluZGV4PTAsZC09MTtyZXR1cm4gYX1mdW5jdGlvbiBIKGEsYil7dmFyIGMsZD1iLl9zdHJpY3Q7c3dpdGNoKGEpe2Nhc2VcIkRERERcIjpyZXR1cm4gSWI7Y2FzZVwiWVlZWVwiOmNhc2VcIkdHR0dcIjpjYXNlXCJnZ2dnXCI6cmV0dXJuIGQ/SmI6emI7Y2FzZVwiWVwiOmNhc2VcIkdcIjpjYXNlXCJnXCI6cmV0dXJuIExiO2Nhc2VcIllZWVlZWVwiOmNhc2VcIllZWVlZXCI6Y2FzZVwiR0dHR0dcIjpjYXNlXCJnZ2dnZ1wiOnJldHVybiBkP0tiOkFiO2Nhc2VcIlNcIjppZihkKXJldHVybiBHYjtjYXNlXCJTU1wiOmlmKGQpcmV0dXJuIEhiO2Nhc2VcIlNTU1wiOmlmKGQpcmV0dXJuIEliO2Nhc2VcIkRERFwiOnJldHVybiB5YjtjYXNlXCJNTU1cIjpjYXNlXCJNTU1NXCI6Y2FzZVwiZGRcIjpjYXNlXCJkZGRcIjpjYXNlXCJkZGRkXCI6cmV0dXJuIENiO2Nhc2VcImFcIjpjYXNlXCJBXCI6cmV0dXJuIEMoYi5fbCkuX21lcmlkaWVtUGFyc2U7Y2FzZVwiWFwiOnJldHVybiBGYjtjYXNlXCJaXCI6Y2FzZVwiWlpcIjpyZXR1cm4gRGI7Y2FzZVwiVFwiOnJldHVybiBFYjtjYXNlXCJTU1NTXCI6cmV0dXJuIEJiO2Nhc2VcIk1NXCI6Y2FzZVwiRERcIjpjYXNlXCJZWVwiOmNhc2VcIkdHXCI6Y2FzZVwiZ2dcIjpjYXNlXCJISFwiOmNhc2VcImhoXCI6Y2FzZVwibW1cIjpjYXNlXCJzc1wiOmNhc2VcInd3XCI6Y2FzZVwiV1dcIjpyZXR1cm4gZD9IYjp4YjtjYXNlXCJNXCI6Y2FzZVwiRFwiOmNhc2VcImRcIjpjYXNlXCJIXCI6Y2FzZVwiaFwiOmNhc2VcIm1cIjpjYXNlXCJzXCI6Y2FzZVwid1wiOmNhc2VcIldcIjpjYXNlXCJlXCI6Y2FzZVwiRVwiOnJldHVybiB4YjtkZWZhdWx0OnJldHVybiBjPW5ldyBSZWdFeHAoUChPKGEucmVwbGFjZShcIlxcXFxcIixcIlwiKSksXCJpXCIpKX19ZnVuY3Rpb24gSShhKXthPWF8fFwiXCI7dmFyIGI9YS5tYXRjaChEYil8fFtdLGM9YltiLmxlbmd0aC0xXXx8W10sZD0oYytcIlwiKS5tYXRjaChRYil8fFtcIi1cIiwwLDBdLGU9Kyg2MCpkWzFdKStzKGRbMl0pO3JldHVyblwiK1wiPT09ZFswXT8tZTplfWZ1bmN0aW9uIEooYSxiLGMpe3ZhciBkLGU9Yy5fYTtzd2l0Y2goYSl7Y2FzZVwiTVwiOmNhc2VcIk1NXCI6bnVsbCE9YiYmKGVbamJdPXMoYiktMSk7YnJlYWs7Y2FzZVwiTU1NXCI6Y2FzZVwiTU1NTVwiOmQ9QyhjLl9sKS5tb250aHNQYXJzZShiKSxudWxsIT1kP2VbamJdPWQ6Yy5fcGYuaW52YWxpZE1vbnRoPWI7YnJlYWs7Y2FzZVwiRFwiOmNhc2VcIkREXCI6bnVsbCE9YiYmKGVba2JdPXMoYikpO2JyZWFrO2Nhc2VcIkRERFwiOmNhc2VcIkRERERcIjpudWxsIT1iJiYoYy5fZGF5T2ZZZWFyPXMoYikpO2JyZWFrO2Nhc2VcIllZXCI6ZVtpYl09cyhiKSsocyhiKT42OD8xOTAwOjJlMyk7YnJlYWs7Y2FzZVwiWVlZWVwiOmNhc2VcIllZWVlZXCI6Y2FzZVwiWVlZWVlZXCI6ZVtpYl09cyhiKTticmVhaztjYXNlXCJhXCI6Y2FzZVwiQVwiOmMuX2lzUG09QyhjLl9sKS5pc1BNKGIpO2JyZWFrO2Nhc2VcIkhcIjpjYXNlXCJISFwiOmNhc2VcImhcIjpjYXNlXCJoaFwiOmVbbGJdPXMoYik7YnJlYWs7Y2FzZVwibVwiOmNhc2VcIm1tXCI6ZVttYl09cyhiKTticmVhaztjYXNlXCJzXCI6Y2FzZVwic3NcIjplW25iXT1zKGIpO2JyZWFrO2Nhc2VcIlNcIjpjYXNlXCJTU1wiOmNhc2VcIlNTU1wiOmNhc2VcIlNTU1NcIjplW29iXT1zKDFlMyooXCIwLlwiK2IpKTticmVhaztjYXNlXCJYXCI6Yy5fZD1uZXcgRGF0ZSgxZTMqcGFyc2VGbG9hdChiKSk7YnJlYWs7Y2FzZVwiWlwiOmNhc2VcIlpaXCI6Yy5fdXNlVVRDPSEwLGMuX3R6bT1JKGIpO2JyZWFrO2Nhc2VcIndcIjpjYXNlXCJ3d1wiOmNhc2VcIldcIjpjYXNlXCJXV1wiOmNhc2VcImRcIjpjYXNlXCJkZFwiOmNhc2VcImRkZFwiOmNhc2VcImRkZGRcIjpjYXNlXCJlXCI6Y2FzZVwiRVwiOmE9YS5zdWJzdHIoMCwxKTtjYXNlXCJnZ1wiOmNhc2VcImdnZ2dcIjpjYXNlXCJHR1wiOmNhc2VcIkdHR0dcIjpjYXNlXCJHR0dHR1wiOmE9YS5zdWJzdHIoMCwyKSxiJiYoYy5fdz1jLl93fHx7fSxjLl93W2FdPWIpfX1mdW5jdGlvbiBLKGEpe3ZhciBiLGMsZCxlLGYsZyxoLGksaixrLGw9W107aWYoIWEuX2Qpe2ZvcihkPU0oYSksYS5fdyYmbnVsbD09YS5fYVtrYl0mJm51bGw9PWEuX2FbamJdJiYoZj1mdW5jdGlvbihiKXt2YXIgYz1wYXJzZUludChiLDEwKTtyZXR1cm4gYj9iLmxlbmd0aDwzP2M+Njg/MTkwMCtjOjJlMytjOmM6bnVsbD09YS5fYVtpYl0/ZGIoKS53ZWVrWWVhcigpOmEuX2FbaWJdfSxnPWEuX3csbnVsbCE9Zy5HR3x8bnVsbCE9Zy5XfHxudWxsIT1nLkU/aD1aKGYoZy5HRyksZy5XfHwxLGcuRSw0LDEpOihpPUMoYS5fbCksaj1udWxsIT1nLmQ/VihnLmQsaSk6bnVsbCE9Zy5lP3BhcnNlSW50KGcuZSwxMCkraS5fd2Vlay5kb3c6MCxrPXBhcnNlSW50KGcudywxMCl8fDEsbnVsbCE9Zy5kJiZqPGkuX3dlZWsuZG93JiZrKyssaD1aKGYoZy5nZyksayxqLGkuX3dlZWsuZG95LGkuX3dlZWsuZG93KSksYS5fYVtpYl09aC55ZWFyLGEuX2RheU9mWWVhcj1oLmRheU9mWWVhciksYS5fZGF5T2ZZZWFyJiYoZT1udWxsPT1hLl9hW2liXT9kW2liXTphLl9hW2liXSxhLl9kYXlPZlllYXI+dShlKSYmKGEuX3BmLl9vdmVyZmxvd0RheU9mWWVhcj0hMCksYz1VKGUsMCxhLl9kYXlPZlllYXIpLGEuX2FbamJdPWMuZ2V0VVRDTW9udGgoKSxhLl9hW2tiXT1jLmdldFVUQ0RhdGUoKSksYj0wOzM+YiYmbnVsbD09YS5fYVtiXTsrK2IpYS5fYVtiXT1sW2JdPWRbYl07Zm9yKDs3PmI7YisrKWEuX2FbYl09bFtiXT1udWxsPT1hLl9hW2JdPzI9PT1iPzE6MDphLl9hW2JdO2xbbGJdKz1zKChhLl90em18fDApLzYwKSxsW21iXSs9cygoYS5fdHptfHwwKSU2MCksYS5fZD0oYS5fdXNlVVRDP1U6VCkuYXBwbHkobnVsbCxsKX19ZnVuY3Rpb24gTChhKXt2YXIgYjthLl9kfHwoYj1xKGEuX2kpLGEuX2E9W2IueWVhcixiLm1vbnRoLGIuZGF5LGIuaG91cixiLm1pbnV0ZSxiLnNlY29uZCxiLm1pbGxpc2Vjb25kXSxLKGEpKX1mdW5jdGlvbiBNKGEpe3ZhciBiPW5ldyBEYXRlO3JldHVybiBhLl91c2VVVEM/W2IuZ2V0VVRDRnVsbFllYXIoKSxiLmdldFVUQ01vbnRoKCksYi5nZXRVVENEYXRlKCldOltiLmdldEZ1bGxZZWFyKCksYi5nZXRNb250aCgpLGIuZ2V0RGF0ZSgpXX1mdW5jdGlvbiBOKGEpe2EuX2E9W10sYS5fcGYuZW1wdHk9ITA7dmFyIGIsYyxkLGUsZixnPUMoYS5fbCksaD1cIlwiK2EuX2ksaT1oLmxlbmd0aCxqPTA7Zm9yKGQ9RyhhLl9mLGcpLm1hdGNoKHZiKXx8W10sYj0wO2I8ZC5sZW5ndGg7YisrKWU9ZFtiXSxjPShoLm1hdGNoKEgoZSxhKSl8fFtdKVswXSxjJiYoZj1oLnN1YnN0cigwLGguaW5kZXhPZihjKSksZi5sZW5ndGg+MCYmYS5fcGYudW51c2VkSW5wdXQucHVzaChmKSxoPWguc2xpY2UoaC5pbmRleE9mKGMpK2MubGVuZ3RoKSxqKz1jLmxlbmd0aCksWWJbZV0/KGM/YS5fcGYuZW1wdHk9ITE6YS5fcGYudW51c2VkVG9rZW5zLnB1c2goZSksSihlLGMsYSkpOmEuX3N0cmljdCYmIWMmJmEuX3BmLnVudXNlZFRva2Vucy5wdXNoKGUpO2EuX3BmLmNoYXJzTGVmdE92ZXI9aS1qLGgubGVuZ3RoPjAmJmEuX3BmLnVudXNlZElucHV0LnB1c2goaCksYS5faXNQbSYmYS5fYVtsYl08MTImJihhLl9hW2xiXSs9MTIpLGEuX2lzUG09PT0hMSYmMTI9PT1hLl9hW2xiXSYmKGEuX2FbbGJdPTApLEsoYSksdyhhKX1mdW5jdGlvbiBPKGEpe3JldHVybiBhLnJlcGxhY2UoL1xcXFwoXFxbKXxcXFxcKFxcXSl8XFxbKFteXFxdXFxbXSopXFxdfFxcXFwoLikvZyxmdW5jdGlvbihhLGIsYyxkLGUpe3JldHVybiBifHxjfHxkfHxlfSl9ZnVuY3Rpb24gUChhKXtyZXR1cm4gYS5yZXBsYWNlKC9bLVxcL1xcXFxeJCorPy4oKXxbXFxde31dL2csXCJcXFxcJCZcIil9ZnVuY3Rpb24gUShhKXt2YXIgYyxkLGUsZixnO2lmKDA9PT1hLl9mLmxlbmd0aClyZXR1cm4gYS5fcGYuaW52YWxpZEZvcm1hdD0hMCxhLl9kPW5ldyBEYXRlKDAvMCksdm9pZCAwO2ZvcihmPTA7ZjxhLl9mLmxlbmd0aDtmKyspZz0wLGM9aCh7fSxhKSxjLl9wZj1iKCksYy5fZj1hLl9mW2ZdLE4oYykseChjKSYmKGcrPWMuX3BmLmNoYXJzTGVmdE92ZXIsZys9MTAqYy5fcGYudW51c2VkVG9rZW5zLmxlbmd0aCxjLl9wZi5zY29yZT1nLChudWxsPT1lfHxlPmcpJiYoZT1nLGQ9YykpO2goYSxkfHxjKX1mdW5jdGlvbiBSKGEpe3ZhciBiLGMsZD1hLl9pLGU9TWIuZXhlYyhkKTtpZihlKXtmb3IoYS5fcGYuaXNvPSEwLGI9MCxjPU9iLmxlbmd0aDtjPmI7YisrKWlmKE9iW2JdWzFdLmV4ZWMoZCkpe2EuX2Y9T2JbYl1bMF0rKGVbNl18fFwiIFwiKTticmVha31mb3IoYj0wLGM9UGIubGVuZ3RoO2M+YjtiKyspaWYoUGJbYl1bMV0uZXhlYyhkKSl7YS5fZis9UGJbYl1bMF07YnJlYWt9ZC5tYXRjaChEYikmJihhLl9mKz1cIlpcIiksTihhKX1lbHNlIGEuX2Q9bmV3IERhdGUoZCl9ZnVuY3Rpb24gUyhiKXt2YXIgYz1iLl9pLGQ9c2IuZXhlYyhjKTtjPT09YT9iLl9kPW5ldyBEYXRlOmQ/Yi5fZD1uZXcgRGF0ZSgrZFsxXSk6XCJzdHJpbmdcIj09dHlwZW9mIGM/UihiKTptKGMpPyhiLl9hPWMuc2xpY2UoMCksSyhiKSk6bihjKT9iLl9kPW5ldyBEYXRlKCtjKTpcIm9iamVjdFwiPT10eXBlb2YgYz9MKGIpOmIuX2Q9bmV3IERhdGUoYyl9ZnVuY3Rpb24gVChhLGIsYyxkLGUsZixnKXt2YXIgaD1uZXcgRGF0ZShhLGIsYyxkLGUsZixnKTtyZXR1cm4gMTk3MD5hJiZoLnNldEZ1bGxZZWFyKGEpLGh9ZnVuY3Rpb24gVShhKXt2YXIgYj1uZXcgRGF0ZShEYXRlLlVUQy5hcHBseShudWxsLGFyZ3VtZW50cykpO3JldHVybiAxOTcwPmEmJmIuc2V0VVRDRnVsbFllYXIoYSksYn1mdW5jdGlvbiBWKGEsYil7aWYoXCJzdHJpbmdcIj09dHlwZW9mIGEpaWYoaXNOYU4oYSkpe2lmKGE9Yi53ZWVrZGF5c1BhcnNlKGEpLFwibnVtYmVyXCIhPXR5cGVvZiBhKXJldHVybiBudWxsfWVsc2UgYT1wYXJzZUludChhLDEwKTtyZXR1cm4gYX1mdW5jdGlvbiBXKGEsYixjLGQsZSl7cmV0dXJuIGUucmVsYXRpdmVUaW1lKGJ8fDEsISFjLGEsZCl9ZnVuY3Rpb24gWChhLGIsYyl7dmFyIGQ9aGIoTWF0aC5hYnMoYSkvMWUzKSxlPWhiKGQvNjApLGY9aGIoZS82MCksZz1oYihmLzI0KSxoPWhiKGcvMzY1KSxpPTQ1PmQmJltcInNcIixkXXx8MT09PWUmJltcIm1cIl18fDQ1PmUmJltcIm1tXCIsZV18fDE9PT1mJiZbXCJoXCJdfHwyMj5mJiZbXCJoaFwiLGZdfHwxPT09ZyYmW1wiZFwiXXx8MjU+PWcmJltcImRkXCIsZ118fDQ1Pj1nJiZbXCJNXCJdfHwzNDU+ZyYmW1wiTU1cIixoYihnLzMwKV18fDE9PT1oJiZbXCJ5XCJdfHxbXCJ5eVwiLGhdO3JldHVybiBpWzJdPWIsaVszXT1hPjAsaVs0XT1jLFcuYXBwbHkoe30saSl9ZnVuY3Rpb24gWShhLGIsYyl7dmFyIGQsZT1jLWIsZj1jLWEuZGF5KCk7cmV0dXJuIGY+ZSYmKGYtPTcpLGUtNz5mJiYoZis9NyksZD1kYihhKS5hZGQoXCJkXCIsZikse3dlZWs6TWF0aC5jZWlsKGQuZGF5T2ZZZWFyKCkvNykseWVhcjpkLnllYXIoKX19ZnVuY3Rpb24gWihhLGIsYyxkLGUpe3ZhciBmLGcsaD1VKGEsMCwxKS5nZXRVVENEYXkoKTtyZXR1cm4gYz1udWxsIT1jP2M6ZSxmPWUtaCsoaD5kPzc6MCktKGU+aD83OjApLGc9NyooYi0xKSsoYy1lKStmKzEse3llYXI6Zz4wP2E6YS0xLGRheU9mWWVhcjpnPjA/Zzp1KGEtMSkrZ319ZnVuY3Rpb24gJChhKXt2YXIgYj1hLl9pLGM9YS5fZjtyZXR1cm4gbnVsbD09PWI/ZGIuaW52YWxpZCh7bnVsbElucHV0OiEwfSk6KFwic3RyaW5nXCI9PXR5cGVvZiBiJiYoYS5faT1iPUMoKS5wcmVwYXJzZShiKSksZGIuaXNNb21lbnQoYik/KGE9aShiKSxhLl9kPW5ldyBEYXRlKCtiLl9kKSk6Yz9tKGMpP1EoYSk6TihhKTpTKGEpLG5ldyBmKGEpKX1mdW5jdGlvbiBfKGEsYil7ZGIuZm5bYV09ZGIuZm5bYStcInNcIl09ZnVuY3Rpb24oYSl7dmFyIGM9dGhpcy5faXNVVEM/XCJVVENcIjpcIlwiO3JldHVybiBudWxsIT1hPyh0aGlzLl9kW1wic2V0XCIrYytiXShhKSxkYi51cGRhdGVPZmZzZXQodGhpcyksdGhpcyk6dGhpcy5fZFtcImdldFwiK2MrYl0oKX19ZnVuY3Rpb24gYWIoYSl7ZGIuZHVyYXRpb24uZm5bYV09ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5fZGF0YVthXX19ZnVuY3Rpb24gYmIoYSxiKXtkYi5kdXJhdGlvbi5mbltcImFzXCIrYV09ZnVuY3Rpb24oKXtyZXR1cm4rdGhpcy9ifX1mdW5jdGlvbiBjYihhKXt2YXIgYj0hMSxjPWRiO1widW5kZWZpbmVkXCI9PXR5cGVvZiBlbmRlciYmKGE/KGdiLm1vbWVudD1mdW5jdGlvbigpe3JldHVybiFiJiZjb25zb2xlJiZjb25zb2xlLndhcm4mJihiPSEwLGNvbnNvbGUud2FybihcIkFjY2Vzc2luZyBNb21lbnQgdGhyb3VnaCB0aGUgZ2xvYmFsIHNjb3BlIGlzIGRlcHJlY2F0ZWQsIGFuZCB3aWxsIGJlIHJlbW92ZWQgaW4gYW4gdXBjb21pbmcgcmVsZWFzZS5cIikpLGMuYXBwbHkobnVsbCxhcmd1bWVudHMpfSxoKGdiLm1vbWVudCxjKSk6Z2IubW9tZW50PWRiKX1mb3IodmFyIGRiLGViLGZiPVwiMi41LjFcIixnYj10aGlzLGhiPU1hdGgucm91bmQsaWI9MCxqYj0xLGtiPTIsbGI9MyxtYj00LG5iPTUsb2I9NixwYj17fSxxYj17X2lzQU1vbWVudE9iamVjdDpudWxsLF9pOm51bGwsX2Y6bnVsbCxfbDpudWxsLF9zdHJpY3Q6bnVsbCxfaXNVVEM6bnVsbCxfb2Zmc2V0Om51bGwsX3BmOm51bGwsX2xhbmc6bnVsbH0scmI9XCJ1bmRlZmluZWRcIiE9dHlwZW9mIG1vZHVsZSYmbW9kdWxlLmV4cG9ydHMmJlwidW5kZWZpbmVkXCIhPXR5cGVvZiByZXF1aXJlLHNiPS9eXFwvP0RhdGVcXCgoXFwtP1xcZCspL2ksdGI9LyhcXC0pPyg/OihcXGQqKVxcLik/KFxcZCspXFw6KFxcZCspKD86XFw6KFxcZCspXFwuPyhcXGR7M30pPyk/Lyx1Yj0vXigtKT9QKD86KD86KFswLTksLl0qKVkpPyg/OihbMC05LC5dKilNKT8oPzooWzAtOSwuXSopRCk/KD86VCg/OihbMC05LC5dKilIKT8oPzooWzAtOSwuXSopTSk/KD86KFswLTksLl0qKVMpPyk/fChbMC05LC5dKilXKSQvLHZiPS8oXFxbW15cXFtdKlxcXSl8KFxcXFwpPyhNb3xNTT9NP00/fERvfERERG98REQ/RD9EP3xkZGQ/ZD98ZG8/fHdbb3x3XT98V1tvfFddP3xZWVlZWVl8WVlZWVl8WVlZWXxZWXxnZyhnZ2c/KT98R0coR0dHPyk/fGV8RXxhfEF8aGg/fEhIP3xtbT98c3M/fFN7MSw0fXxYfHp6P3xaWj98LikvZyx3Yj0vKFxcW1teXFxbXSpcXF0pfChcXFxcKT8oTFR8TEw/TD9MP3xsezEsNH0pL2cseGI9L1xcZFxcZD8vLHliPS9cXGR7MSwzfS8semI9L1xcZHsxLDR9LyxBYj0vWytcXC1dP1xcZHsxLDZ9LyxCYj0vXFxkKy8sQ2I9L1swLTldKlsnYS16XFx1MDBBMC1cXHUwNUZGXFx1MDcwMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSt8W1xcdTA2MDAtXFx1MDZGRlxcL10rKFxccyo/W1xcdTA2MDAtXFx1MDZGRl0rKXsxLDJ9L2ksRGI9L1p8W1xcK1xcLV1cXGRcXGQ6P1xcZFxcZC9naSxFYj0vVC9pLEZiPS9bXFwrXFwtXT9cXGQrKFxcLlxcZHsxLDN9KT8vLEdiPS9cXGQvLEhiPS9cXGRcXGQvLEliPS9cXGR7M30vLEpiPS9cXGR7NH0vLEtiPS9bKy1dP1xcZHs2fS8sTGI9L1srLV0/XFxkKy8sTWI9L15cXHMqKD86WystXVxcZHs2fXxcXGR7NH0pLSg/OihcXGRcXGQtXFxkXFxkKXwoV1xcZFxcZCQpfChXXFxkXFxkLVxcZCl8KFxcZFxcZFxcZCkpKChUfCApKFxcZFxcZCg6XFxkXFxkKDpcXGRcXGQoXFwuXFxkKyk/KT8pPyk/KFtcXCtcXC1dXFxkXFxkKD86Oj9cXGRcXGQpP3xcXHMqWik/KT8kLyxOYj1cIllZWVktTU0tRERUSEg6bW06c3NaXCIsT2I9W1tcIllZWVlZWS1NTS1ERFwiLC9bKy1dXFxkezZ9LVxcZHsyfS1cXGR7Mn0vXSxbXCJZWVlZLU1NLUREXCIsL1xcZHs0fS1cXGR7Mn0tXFxkezJ9L10sW1wiR0dHRy1bV11XVy1FXCIsL1xcZHs0fS1XXFxkezJ9LVxcZC9dLFtcIkdHR0ctW1ddV1dcIiwvXFxkezR9LVdcXGR7Mn0vXSxbXCJZWVlZLURERFwiLC9cXGR7NH0tXFxkezN9L11dLFBiPVtbXCJISDptbTpzcy5TU1NTXCIsLyhUfCApXFxkXFxkOlxcZFxcZDpcXGRcXGRcXC5cXGR7MSwzfS9dLFtcIkhIOm1tOnNzXCIsLyhUfCApXFxkXFxkOlxcZFxcZDpcXGRcXGQvXSxbXCJISDptbVwiLC8oVHwgKVxcZFxcZDpcXGRcXGQvXSxbXCJISFwiLC8oVHwgKVxcZFxcZC9dXSxRYj0vKFtcXCtcXC1dfFxcZFxcZCkvZ2ksUmI9XCJEYXRlfEhvdXJzfE1pbnV0ZXN8U2Vjb25kc3xNaWxsaXNlY29uZHNcIi5zcGxpdChcInxcIiksU2I9e01pbGxpc2Vjb25kczoxLFNlY29uZHM6MWUzLE1pbnV0ZXM6NmU0LEhvdXJzOjM2ZTUsRGF5czo4NjRlNSxNb250aHM6MjU5MmU2LFllYXJzOjMxNTM2ZTZ9LFRiPXttczpcIm1pbGxpc2Vjb25kXCIsczpcInNlY29uZFwiLG06XCJtaW51dGVcIixoOlwiaG91clwiLGQ6XCJkYXlcIixEOlwiZGF0ZVwiLHc6XCJ3ZWVrXCIsVzpcImlzb1dlZWtcIixNOlwibW9udGhcIix5OlwieWVhclwiLERERDpcImRheU9mWWVhclwiLGU6XCJ3ZWVrZGF5XCIsRTpcImlzb1dlZWtkYXlcIixnZzpcIndlZWtZZWFyXCIsR0c6XCJpc29XZWVrWWVhclwifSxVYj17ZGF5b2Z5ZWFyOlwiZGF5T2ZZZWFyXCIsaXNvd2Vla2RheTpcImlzb1dlZWtkYXlcIixpc293ZWVrOlwiaXNvV2Vla1wiLHdlZWt5ZWFyOlwid2Vla1llYXJcIixpc293ZWVreWVhcjpcImlzb1dlZWtZZWFyXCJ9LFZiPXt9LFdiPVwiREREIHcgVyBNIEQgZFwiLnNwbGl0KFwiIFwiKSxYYj1cIk0gRCBIIGggbSBzIHcgV1wiLnNwbGl0KFwiIFwiKSxZYj17TTpmdW5jdGlvbigpe3JldHVybiB0aGlzLm1vbnRoKCkrMX0sTU1NOmZ1bmN0aW9uKGEpe3JldHVybiB0aGlzLmxhbmcoKS5tb250aHNTaG9ydCh0aGlzLGEpfSxNTU1NOmZ1bmN0aW9uKGEpe3JldHVybiB0aGlzLmxhbmcoKS5tb250aHModGhpcyxhKX0sRDpmdW5jdGlvbigpe3JldHVybiB0aGlzLmRhdGUoKX0sREREOmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuZGF5T2ZZZWFyKCl9LGQ6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5kYXkoKX0sZGQ6ZnVuY3Rpb24oYSl7cmV0dXJuIHRoaXMubGFuZygpLndlZWtkYXlzTWluKHRoaXMsYSl9LGRkZDpmdW5jdGlvbihhKXtyZXR1cm4gdGhpcy5sYW5nKCkud2Vla2RheXNTaG9ydCh0aGlzLGEpfSxkZGRkOmZ1bmN0aW9uKGEpe3JldHVybiB0aGlzLmxhbmcoKS53ZWVrZGF5cyh0aGlzLGEpfSx3OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMud2VlaygpfSxXOmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuaXNvV2VlaygpfSxZWTpmdW5jdGlvbigpe3JldHVybiBrKHRoaXMueWVhcigpJTEwMCwyKX0sWVlZWTpmdW5jdGlvbigpe3JldHVybiBrKHRoaXMueWVhcigpLDQpfSxZWVlZWTpmdW5jdGlvbigpe3JldHVybiBrKHRoaXMueWVhcigpLDUpfSxZWVlZWVk6ZnVuY3Rpb24oKXt2YXIgYT10aGlzLnllYXIoKSxiPWE+PTA/XCIrXCI6XCItXCI7cmV0dXJuIGIrayhNYXRoLmFicyhhKSw2KX0sZ2c6ZnVuY3Rpb24oKXtyZXR1cm4gayh0aGlzLndlZWtZZWFyKCklMTAwLDIpfSxnZ2dnOmZ1bmN0aW9uKCl7cmV0dXJuIGsodGhpcy53ZWVrWWVhcigpLDQpfSxnZ2dnZzpmdW5jdGlvbigpe3JldHVybiBrKHRoaXMud2Vla1llYXIoKSw1KX0sR0c6ZnVuY3Rpb24oKXtyZXR1cm4gayh0aGlzLmlzb1dlZWtZZWFyKCklMTAwLDIpfSxHR0dHOmZ1bmN0aW9uKCl7cmV0dXJuIGsodGhpcy5pc29XZWVrWWVhcigpLDQpfSxHR0dHRzpmdW5jdGlvbigpe3JldHVybiBrKHRoaXMuaXNvV2Vla1llYXIoKSw1KX0sZTpmdW5jdGlvbigpe3JldHVybiB0aGlzLndlZWtkYXkoKX0sRTpmdW5jdGlvbigpe3JldHVybiB0aGlzLmlzb1dlZWtkYXkoKX0sYTpmdW5jdGlvbigpe3JldHVybiB0aGlzLmxhbmcoKS5tZXJpZGllbSh0aGlzLmhvdXJzKCksdGhpcy5taW51dGVzKCksITApfSxBOmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMubGFuZygpLm1lcmlkaWVtKHRoaXMuaG91cnMoKSx0aGlzLm1pbnV0ZXMoKSwhMSl9LEg6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5ob3VycygpfSxoOmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuaG91cnMoKSUxMnx8MTJ9LG06ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5taW51dGVzKCl9LHM6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5zZWNvbmRzKCl9LFM6ZnVuY3Rpb24oKXtyZXR1cm4gcyh0aGlzLm1pbGxpc2Vjb25kcygpLzEwMCl9LFNTOmZ1bmN0aW9uKCl7cmV0dXJuIGsocyh0aGlzLm1pbGxpc2Vjb25kcygpLzEwKSwyKX0sU1NTOmZ1bmN0aW9uKCl7cmV0dXJuIGsodGhpcy5taWxsaXNlY29uZHMoKSwzKX0sU1NTUzpmdW5jdGlvbigpe3JldHVybiBrKHRoaXMubWlsbGlzZWNvbmRzKCksMyl9LFo6ZnVuY3Rpb24oKXt2YXIgYT0tdGhpcy56b25lKCksYj1cIitcIjtyZXR1cm4gMD5hJiYoYT0tYSxiPVwiLVwiKSxiK2socyhhLzYwKSwyKStcIjpcIitrKHMoYSklNjAsMil9LFpaOmZ1bmN0aW9uKCl7dmFyIGE9LXRoaXMuem9uZSgpLGI9XCIrXCI7cmV0dXJuIDA+YSYmKGE9LWEsYj1cIi1cIiksYitrKHMoYS82MCksMikrayhzKGEpJTYwLDIpfSx6OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuem9uZUFiYnIoKX0seno6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy56b25lTmFtZSgpfSxYOmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMudW5peCgpfSxROmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMucXVhcnRlcigpfX0sWmI9W1wibW9udGhzXCIsXCJtb250aHNTaG9ydFwiLFwid2Vla2RheXNcIixcIndlZWtkYXlzU2hvcnRcIixcIndlZWtkYXlzTWluXCJdO1diLmxlbmd0aDspZWI9V2IucG9wKCksWWJbZWIrXCJvXCJdPWQoWWJbZWJdLGViKTtmb3IoO1hiLmxlbmd0aDspZWI9WGIucG9wKCksWWJbZWIrZWJdPWMoWWJbZWJdLDIpO2ZvcihZYi5EREREPWMoWWIuRERELDMpLGgoZS5wcm90b3R5cGUse3NldDpmdW5jdGlvbihhKXt2YXIgYixjO2ZvcihjIGluIGEpYj1hW2NdLFwiZnVuY3Rpb25cIj09dHlwZW9mIGI/dGhpc1tjXT1iOnRoaXNbXCJfXCIrY109Yn0sX21vbnRoczpcIkphbnVhcnlfRmVicnVhcnlfTWFyY2hfQXByaWxfTWF5X0p1bmVfSnVseV9BdWd1c3RfU2VwdGVtYmVyX09jdG9iZXJfTm92ZW1iZXJfRGVjZW1iZXJcIi5zcGxpdChcIl9cIiksbW9udGhzOmZ1bmN0aW9uKGEpe3JldHVybiB0aGlzLl9tb250aHNbYS5tb250aCgpXX0sX21vbnRoc1Nob3J0OlwiSmFuX0ZlYl9NYXJfQXByX01heV9KdW5fSnVsX0F1Z19TZXBfT2N0X05vdl9EZWNcIi5zcGxpdChcIl9cIiksbW9udGhzU2hvcnQ6ZnVuY3Rpb24oYSl7cmV0dXJuIHRoaXMuX21vbnRoc1Nob3J0W2EubW9udGgoKV19LG1vbnRoc1BhcnNlOmZ1bmN0aW9uKGEpe3ZhciBiLGMsZDtmb3IodGhpcy5fbW9udGhzUGFyc2V8fCh0aGlzLl9tb250aHNQYXJzZT1bXSksYj0wOzEyPmI7YisrKWlmKHRoaXMuX21vbnRoc1BhcnNlW2JdfHwoYz1kYi51dGMoWzJlMyxiXSksZD1cIl5cIit0aGlzLm1vbnRocyhjLFwiXCIpK1wifF5cIit0aGlzLm1vbnRoc1Nob3J0KGMsXCJcIiksdGhpcy5fbW9udGhzUGFyc2VbYl09bmV3IFJlZ0V4cChkLnJlcGxhY2UoXCIuXCIsXCJcIiksXCJpXCIpKSx0aGlzLl9tb250aHNQYXJzZVtiXS50ZXN0KGEpKXJldHVybiBifSxfd2Vla2RheXM6XCJTdW5kYXlfTW9uZGF5X1R1ZXNkYXlfV2VkbmVzZGF5X1RodXJzZGF5X0ZyaWRheV9TYXR1cmRheVwiLnNwbGl0KFwiX1wiKSx3ZWVrZGF5czpmdW5jdGlvbihhKXtyZXR1cm4gdGhpcy5fd2Vla2RheXNbYS5kYXkoKV19LF93ZWVrZGF5c1Nob3J0OlwiU3VuX01vbl9UdWVfV2VkX1RodV9GcmlfU2F0XCIuc3BsaXQoXCJfXCIpLHdlZWtkYXlzU2hvcnQ6ZnVuY3Rpb24oYSl7cmV0dXJuIHRoaXMuX3dlZWtkYXlzU2hvcnRbYS5kYXkoKV19LF93ZWVrZGF5c01pbjpcIlN1X01vX1R1X1dlX1RoX0ZyX1NhXCIuc3BsaXQoXCJfXCIpLHdlZWtkYXlzTWluOmZ1bmN0aW9uKGEpe3JldHVybiB0aGlzLl93ZWVrZGF5c01pblthLmRheSgpXX0sd2Vla2RheXNQYXJzZTpmdW5jdGlvbihhKXt2YXIgYixjLGQ7Zm9yKHRoaXMuX3dlZWtkYXlzUGFyc2V8fCh0aGlzLl93ZWVrZGF5c1BhcnNlPVtdKSxiPTA7Nz5iO2IrKylpZih0aGlzLl93ZWVrZGF5c1BhcnNlW2JdfHwoYz1kYihbMmUzLDFdKS5kYXkoYiksZD1cIl5cIit0aGlzLndlZWtkYXlzKGMsXCJcIikrXCJ8XlwiK3RoaXMud2Vla2RheXNTaG9ydChjLFwiXCIpK1wifF5cIit0aGlzLndlZWtkYXlzTWluKGMsXCJcIiksdGhpcy5fd2Vla2RheXNQYXJzZVtiXT1uZXcgUmVnRXhwKGQucmVwbGFjZShcIi5cIixcIlwiKSxcImlcIikpLHRoaXMuX3dlZWtkYXlzUGFyc2VbYl0udGVzdChhKSlyZXR1cm4gYn0sX2xvbmdEYXRlRm9ybWF0OntMVDpcImg6bW0gQVwiLEw6XCJNTS9ERC9ZWVlZXCIsTEw6XCJNTU1NIEQgWVlZWVwiLExMTDpcIk1NTU0gRCBZWVlZIExUXCIsTExMTDpcImRkZGQsIE1NTU0gRCBZWVlZIExUXCJ9LGxvbmdEYXRlRm9ybWF0OmZ1bmN0aW9uKGEpe3ZhciBiPXRoaXMuX2xvbmdEYXRlRm9ybWF0W2FdO3JldHVybiFiJiZ0aGlzLl9sb25nRGF0ZUZvcm1hdFthLnRvVXBwZXJDYXNlKCldJiYoYj10aGlzLl9sb25nRGF0ZUZvcm1hdFthLnRvVXBwZXJDYXNlKCldLnJlcGxhY2UoL01NTU18TU18RER8ZGRkZC9nLGZ1bmN0aW9uKGEpe3JldHVybiBhLnNsaWNlKDEpfSksdGhpcy5fbG9uZ0RhdGVGb3JtYXRbYV09YiksYn0saXNQTTpmdW5jdGlvbihhKXtyZXR1cm5cInBcIj09PShhK1wiXCIpLnRvTG93ZXJDYXNlKCkuY2hhckF0KDApfSxfbWVyaWRpZW1QYXJzZTovW2FwXVxcLj9tP1xcLj8vaSxtZXJpZGllbTpmdW5jdGlvbihhLGIsYyl7cmV0dXJuIGE+MTE/Yz9cInBtXCI6XCJQTVwiOmM/XCJhbVwiOlwiQU1cIn0sX2NhbGVuZGFyOntzYW1lRGF5OlwiW1RvZGF5IGF0XSBMVFwiLG5leHREYXk6XCJbVG9tb3Jyb3cgYXRdIExUXCIsbmV4dFdlZWs6XCJkZGRkIFthdF0gTFRcIixsYXN0RGF5OlwiW1llc3RlcmRheSBhdF0gTFRcIixsYXN0V2VlazpcIltMYXN0XSBkZGRkIFthdF0gTFRcIixzYW1lRWxzZTpcIkxcIn0sY2FsZW5kYXI6ZnVuY3Rpb24oYSxiKXt2YXIgYz10aGlzLl9jYWxlbmRhclthXTtyZXR1cm5cImZ1bmN0aW9uXCI9PXR5cGVvZiBjP2MuYXBwbHkoYik6Y30sX3JlbGF0aXZlVGltZTp7ZnV0dXJlOlwiaW4gJXNcIixwYXN0OlwiJXMgYWdvXCIsczpcImEgZmV3IHNlY29uZHNcIixtOlwiYSBtaW51dGVcIixtbTpcIiVkIG1pbnV0ZXNcIixoOlwiYW4gaG91clwiLGhoOlwiJWQgaG91cnNcIixkOlwiYSBkYXlcIixkZDpcIiVkIGRheXNcIixNOlwiYSBtb250aFwiLE1NOlwiJWQgbW9udGhzXCIseTpcImEgeWVhclwiLHl5OlwiJWQgeWVhcnNcIn0scmVsYXRpdmVUaW1lOmZ1bmN0aW9uKGEsYixjLGQpe3ZhciBlPXRoaXMuX3JlbGF0aXZlVGltZVtjXTtyZXR1cm5cImZ1bmN0aW9uXCI9PXR5cGVvZiBlP2UoYSxiLGMsZCk6ZS5yZXBsYWNlKC8lZC9pLGEpfSxwYXN0RnV0dXJlOmZ1bmN0aW9uKGEsYil7dmFyIGM9dGhpcy5fcmVsYXRpdmVUaW1lW2E+MD9cImZ1dHVyZVwiOlwicGFzdFwiXTtyZXR1cm5cImZ1bmN0aW9uXCI9PXR5cGVvZiBjP2MoYik6Yy5yZXBsYWNlKC8lcy9pLGIpfSxvcmRpbmFsOmZ1bmN0aW9uKGEpe3JldHVybiB0aGlzLl9vcmRpbmFsLnJlcGxhY2UoXCIlZFwiLGEpfSxfb3JkaW5hbDpcIiVkXCIscHJlcGFyc2U6ZnVuY3Rpb24oYSl7cmV0dXJuIGF9LHBvc3Rmb3JtYXQ6ZnVuY3Rpb24oYSl7cmV0dXJuIGF9LHdlZWs6ZnVuY3Rpb24oYSl7cmV0dXJuIFkoYSx0aGlzLl93ZWVrLmRvdyx0aGlzLl93ZWVrLmRveSkud2Vla30sX3dlZWs6e2RvdzowLGRveTo2fSxfaW52YWxpZERhdGU6XCJJbnZhbGlkIGRhdGVcIixpbnZhbGlkRGF0ZTpmdW5jdGlvbigpe3JldHVybiB0aGlzLl9pbnZhbGlkRGF0ZX19KSxkYj1mdW5jdGlvbihjLGQsZSxmKXt2YXIgZztyZXR1cm5cImJvb2xlYW5cIj09dHlwZW9mIGUmJihmPWUsZT1hKSxnPXt9LGcuX2lzQU1vbWVudE9iamVjdD0hMCxnLl9pPWMsZy5fZj1kLGcuX2w9ZSxnLl9zdHJpY3Q9ZixnLl9pc1VUQz0hMSxnLl9wZj1iKCksJChnKX0sZGIudXRjPWZ1bmN0aW9uKGMsZCxlLGYpe3ZhciBnO3JldHVyblwiYm9vbGVhblwiPT10eXBlb2YgZSYmKGY9ZSxlPWEpLGc9e30sZy5faXNBTW9tZW50T2JqZWN0PSEwLGcuX3VzZVVUQz0hMCxnLl9pc1VUQz0hMCxnLl9sPWUsZy5faT1jLGcuX2Y9ZCxnLl9zdHJpY3Q9ZixnLl9wZj1iKCksJChnKS51dGMoKX0sZGIudW5peD1mdW5jdGlvbihhKXtyZXR1cm4gZGIoMWUzKmEpfSxkYi5kdXJhdGlvbj1mdW5jdGlvbihhLGIpe3ZhciBjLGQsZSxmPWEsaD1udWxsO3JldHVybiBkYi5pc0R1cmF0aW9uKGEpP2Y9e21zOmEuX21pbGxpc2Vjb25kcyxkOmEuX2RheXMsTTphLl9tb250aHN9OlwibnVtYmVyXCI9PXR5cGVvZiBhPyhmPXt9LGI/ZltiXT1hOmYubWlsbGlzZWNvbmRzPWEpOihoPXRiLmV4ZWMoYSkpPyhjPVwiLVwiPT09aFsxXT8tMToxLGY9e3k6MCxkOnMoaFtrYl0pKmMsaDpzKGhbbGJdKSpjLG06cyhoW21iXSkqYyxzOnMoaFtuYl0pKmMsbXM6cyhoW29iXSkqY30pOihoPXViLmV4ZWMoYSkpJiYoYz1cIi1cIj09PWhbMV0/LTE6MSxlPWZ1bmN0aW9uKGEpe3ZhciBiPWEmJnBhcnNlRmxvYXQoYS5yZXBsYWNlKFwiLFwiLFwiLlwiKSk7cmV0dXJuKGlzTmFOKGIpPzA6YikqY30sZj17eTplKGhbMl0pLE06ZShoWzNdKSxkOmUoaFs0XSksaDplKGhbNV0pLG06ZShoWzZdKSxzOmUoaFs3XSksdzplKGhbOF0pfSksZD1uZXcgZyhmKSxkYi5pc0R1cmF0aW9uKGEpJiZhLmhhc093blByb3BlcnR5KFwiX2xhbmdcIikmJihkLl9sYW5nPWEuX2xhbmcpLGR9LGRiLnZlcnNpb249ZmIsZGIuZGVmYXVsdEZvcm1hdD1OYixkYi51cGRhdGVPZmZzZXQ9ZnVuY3Rpb24oKXt9LGRiLmxhbmc9ZnVuY3Rpb24oYSxiKXt2YXIgYztyZXR1cm4gYT8oYj9BKHkoYSksYik6bnVsbD09PWI/KEIoYSksYT1cImVuXCIpOnBiW2FdfHxDKGEpLGM9ZGIuZHVyYXRpb24uZm4uX2xhbmc9ZGIuZm4uX2xhbmc9QyhhKSxjLl9hYmJyKTpkYi5mbi5fbGFuZy5fYWJicn0sZGIubGFuZ0RhdGE9ZnVuY3Rpb24oYSl7cmV0dXJuIGEmJmEuX2xhbmcmJmEuX2xhbmcuX2FiYnImJihhPWEuX2xhbmcuX2FiYnIpLEMoYSl9LGRiLmlzTW9tZW50PWZ1bmN0aW9uKGEpe3JldHVybiBhIGluc3RhbmNlb2YgZnx8bnVsbCE9YSYmYS5oYXNPd25Qcm9wZXJ0eShcIl9pc0FNb21lbnRPYmplY3RcIil9LGRiLmlzRHVyYXRpb249ZnVuY3Rpb24oYSl7cmV0dXJuIGEgaW5zdGFuY2VvZiBnfSxlYj1aYi5sZW5ndGgtMTtlYj49MDstLWViKXIoWmJbZWJdKTtmb3IoZGIubm9ybWFsaXplVW5pdHM9ZnVuY3Rpb24oYSl7cmV0dXJuIHAoYSl9LGRiLmludmFsaWQ9ZnVuY3Rpb24oYSl7dmFyIGI9ZGIudXRjKDAvMCk7cmV0dXJuIG51bGwhPWE/aChiLl9wZixhKTpiLl9wZi51c2VySW52YWxpZGF0ZWQ9ITAsYn0sZGIucGFyc2Vab25lPWZ1bmN0aW9uKGEpe3JldHVybiBkYihhKS5wYXJzZVpvbmUoKX0saChkYi5mbj1mLnByb3RvdHlwZSx7Y2xvbmU6ZnVuY3Rpb24oKXtyZXR1cm4gZGIodGhpcyl9LHZhbHVlT2Y6ZnVuY3Rpb24oKXtyZXR1cm4rdGhpcy5fZCs2ZTQqKHRoaXMuX29mZnNldHx8MCl9LHVuaXg6ZnVuY3Rpb24oKXtyZXR1cm4gTWF0aC5mbG9vcigrdGhpcy8xZTMpfSx0b1N0cmluZzpmdW5jdGlvbigpe3JldHVybiB0aGlzLmNsb25lKCkubGFuZyhcImVuXCIpLmZvcm1hdChcImRkZCBNTU0gREQgWVlZWSBISDptbTpzcyBbR01UXVpaXCIpfSx0b0RhdGU6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5fb2Zmc2V0P25ldyBEYXRlKCt0aGlzKTp0aGlzLl9kfSx0b0lTT1N0cmluZzpmdW5jdGlvbigpe3ZhciBhPWRiKHRoaXMpLnV0YygpO3JldHVybiAwPGEueWVhcigpJiZhLnllYXIoKTw9OTk5OT9GKGEsXCJZWVlZLU1NLUREW1RdSEg6bW06c3MuU1NTW1pdXCIpOkYoYSxcIllZWVlZWS1NTS1ERFtUXUhIOm1tOnNzLlNTU1taXVwiKX0sdG9BcnJheTpmdW5jdGlvbigpe3ZhciBhPXRoaXM7cmV0dXJuW2EueWVhcigpLGEubW9udGgoKSxhLmRhdGUoKSxhLmhvdXJzKCksYS5taW51dGVzKCksYS5zZWNvbmRzKCksYS5taWxsaXNlY29uZHMoKV19LGlzVmFsaWQ6ZnVuY3Rpb24oKXtyZXR1cm4geCh0aGlzKX0saXNEU1RTaGlmdGVkOmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuX2E/dGhpcy5pc1ZhbGlkKCkmJm8odGhpcy5fYSwodGhpcy5faXNVVEM/ZGIudXRjKHRoaXMuX2EpOmRiKHRoaXMuX2EpKS50b0FycmF5KCkpPjA6ITF9LHBhcnNpbmdGbGFnczpmdW5jdGlvbigpe3JldHVybiBoKHt9LHRoaXMuX3BmKX0saW52YWxpZEF0OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuX3BmLm92ZXJmbG93fSx1dGM6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy56b25lKDApfSxsb2NhbDpmdW5jdGlvbigpe3JldHVybiB0aGlzLnpvbmUoMCksdGhpcy5faXNVVEM9ITEsdGhpc30sZm9ybWF0OmZ1bmN0aW9uKGEpe3ZhciBiPUYodGhpcyxhfHxkYi5kZWZhdWx0Rm9ybWF0KTtyZXR1cm4gdGhpcy5sYW5nKCkucG9zdGZvcm1hdChiKX0sYWRkOmZ1bmN0aW9uKGEsYil7dmFyIGM7cmV0dXJuIGM9XCJzdHJpbmdcIj09dHlwZW9mIGE/ZGIuZHVyYXRpb24oK2IsYSk6ZGIuZHVyYXRpb24oYSxiKSxsKHRoaXMsYywxKSx0aGlzfSxzdWJ0cmFjdDpmdW5jdGlvbihhLGIpe3ZhciBjO3JldHVybiBjPVwic3RyaW5nXCI9PXR5cGVvZiBhP2RiLmR1cmF0aW9uKCtiLGEpOmRiLmR1cmF0aW9uKGEsYiksbCh0aGlzLGMsLTEpLHRoaXN9LGRpZmY6ZnVuY3Rpb24oYSxiLGMpe3ZhciBkLGUsZj16KGEsdGhpcyksZz02ZTQqKHRoaXMuem9uZSgpLWYuem9uZSgpKTtyZXR1cm4gYj1wKGIpLFwieWVhclwiPT09Ynx8XCJtb250aFwiPT09Yj8oZD00MzJlNSoodGhpcy5kYXlzSW5Nb250aCgpK2YuZGF5c0luTW9udGgoKSksZT0xMioodGhpcy55ZWFyKCktZi55ZWFyKCkpKyh0aGlzLm1vbnRoKCktZi5tb250aCgpKSxlKz0odGhpcy1kYih0aGlzKS5zdGFydE9mKFwibW9udGhcIiktKGYtZGIoZikuc3RhcnRPZihcIm1vbnRoXCIpKSkvZCxlLT02ZTQqKHRoaXMuem9uZSgpLWRiKHRoaXMpLnN0YXJ0T2YoXCJtb250aFwiKS56b25lKCktKGYuem9uZSgpLWRiKGYpLnN0YXJ0T2YoXCJtb250aFwiKS56b25lKCkpKS9kLFwieWVhclwiPT09YiYmKGUvPTEyKSk6KGQ9dGhpcy1mLGU9XCJzZWNvbmRcIj09PWI/ZC8xZTM6XCJtaW51dGVcIj09PWI/ZC82ZTQ6XCJob3VyXCI9PT1iP2QvMzZlNTpcImRheVwiPT09Yj8oZC1nKS84NjRlNTpcIndlZWtcIj09PWI/KGQtZykvNjA0OGU1OmQpLGM/ZTpqKGUpfSxmcm9tOmZ1bmN0aW9uKGEsYil7cmV0dXJuIGRiLmR1cmF0aW9uKHRoaXMuZGlmZihhKSkubGFuZyh0aGlzLmxhbmcoKS5fYWJicikuaHVtYW5pemUoIWIpfSxmcm9tTm93OmZ1bmN0aW9uKGEpe3JldHVybiB0aGlzLmZyb20oZGIoKSxhKX0sY2FsZW5kYXI6ZnVuY3Rpb24oKXt2YXIgYT16KGRiKCksdGhpcykuc3RhcnRPZihcImRheVwiKSxiPXRoaXMuZGlmZihhLFwiZGF5c1wiLCEwKSxjPS02PmI/XCJzYW1lRWxzZVwiOi0xPmI/XCJsYXN0V2Vla1wiOjA+Yj9cImxhc3REYXlcIjoxPmI/XCJzYW1lRGF5XCI6Mj5iP1wibmV4dERheVwiOjc+Yj9cIm5leHRXZWVrXCI6XCJzYW1lRWxzZVwiO3JldHVybiB0aGlzLmZvcm1hdCh0aGlzLmxhbmcoKS5jYWxlbmRhcihjLHRoaXMpKX0saXNMZWFwWWVhcjpmdW5jdGlvbigpe3JldHVybiB2KHRoaXMueWVhcigpKX0saXNEU1Q6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy56b25lKCk8dGhpcy5jbG9uZSgpLm1vbnRoKDApLnpvbmUoKXx8dGhpcy56b25lKCk8dGhpcy5jbG9uZSgpLm1vbnRoKDUpLnpvbmUoKX0sZGF5OmZ1bmN0aW9uKGEpe3ZhciBiPXRoaXMuX2lzVVRDP3RoaXMuX2QuZ2V0VVRDRGF5KCk6dGhpcy5fZC5nZXREYXkoKTtyZXR1cm4gbnVsbCE9YT8oYT1WKGEsdGhpcy5sYW5nKCkpLHRoaXMuYWRkKHtkOmEtYn0pKTpifSxtb250aDpmdW5jdGlvbihhKXt2YXIgYixjPXRoaXMuX2lzVVRDP1wiVVRDXCI6XCJcIjtyZXR1cm4gbnVsbCE9YT9cInN0cmluZ1wiPT10eXBlb2YgYSYmKGE9dGhpcy5sYW5nKCkubW9udGhzUGFyc2UoYSksXCJudW1iZXJcIiE9dHlwZW9mIGEpP3RoaXM6KGI9dGhpcy5kYXRlKCksdGhpcy5kYXRlKDEpLHRoaXMuX2RbXCJzZXRcIitjK1wiTW9udGhcIl0oYSksdGhpcy5kYXRlKE1hdGgubWluKGIsdGhpcy5kYXlzSW5Nb250aCgpKSksZGIudXBkYXRlT2Zmc2V0KHRoaXMpLHRoaXMpOnRoaXMuX2RbXCJnZXRcIitjK1wiTW9udGhcIl0oKX0sc3RhcnRPZjpmdW5jdGlvbihhKXtzd2l0Y2goYT1wKGEpKXtjYXNlXCJ5ZWFyXCI6dGhpcy5tb250aCgwKTtjYXNlXCJtb250aFwiOnRoaXMuZGF0ZSgxKTtjYXNlXCJ3ZWVrXCI6Y2FzZVwiaXNvV2Vla1wiOmNhc2VcImRheVwiOnRoaXMuaG91cnMoMCk7Y2FzZVwiaG91clwiOnRoaXMubWludXRlcygwKTtjYXNlXCJtaW51dGVcIjp0aGlzLnNlY29uZHMoMCk7Y2FzZVwic2Vjb25kXCI6dGhpcy5taWxsaXNlY29uZHMoMCl9cmV0dXJuXCJ3ZWVrXCI9PT1hP3RoaXMud2Vla2RheSgwKTpcImlzb1dlZWtcIj09PWEmJnRoaXMuaXNvV2Vla2RheSgxKSx0aGlzfSxlbmRPZjpmdW5jdGlvbihhKXtyZXR1cm4gYT1wKGEpLHRoaXMuc3RhcnRPZihhKS5hZGQoXCJpc29XZWVrXCI9PT1hP1wid2Vla1wiOmEsMSkuc3VidHJhY3QoXCJtc1wiLDEpfSxpc0FmdGVyOmZ1bmN0aW9uKGEsYil7cmV0dXJuIGI9XCJ1bmRlZmluZWRcIiE9dHlwZW9mIGI/YjpcIm1pbGxpc2Vjb25kXCIsK3RoaXMuY2xvbmUoKS5zdGFydE9mKGIpPitkYihhKS5zdGFydE9mKGIpfSxpc0JlZm9yZTpmdW5jdGlvbihhLGIpe3JldHVybiBiPVwidW5kZWZpbmVkXCIhPXR5cGVvZiBiP2I6XCJtaWxsaXNlY29uZFwiLCt0aGlzLmNsb25lKCkuc3RhcnRPZihiKTwrZGIoYSkuc3RhcnRPZihiKX0saXNTYW1lOmZ1bmN0aW9uKGEsYil7cmV0dXJuIGI9Ynx8XCJtc1wiLCt0aGlzLmNsb25lKCkuc3RhcnRPZihiKT09PSt6KGEsdGhpcykuc3RhcnRPZihiKX0sbWluOmZ1bmN0aW9uKGEpe3JldHVybiBhPWRiLmFwcGx5KG51bGwsYXJndW1lbnRzKSx0aGlzPmE/dGhpczphfSxtYXg6ZnVuY3Rpb24oYSl7cmV0dXJuIGE9ZGIuYXBwbHkobnVsbCxhcmd1bWVudHMpLGE+dGhpcz90aGlzOmF9LHpvbmU6ZnVuY3Rpb24oYSl7dmFyIGI9dGhpcy5fb2Zmc2V0fHwwO3JldHVybiBudWxsPT1hP3RoaXMuX2lzVVRDP2I6dGhpcy5fZC5nZXRUaW1lem9uZU9mZnNldCgpOihcInN0cmluZ1wiPT10eXBlb2YgYSYmKGE9SShhKSksTWF0aC5hYnMoYSk8MTYmJihhPTYwKmEpLHRoaXMuX29mZnNldD1hLHRoaXMuX2lzVVRDPSEwLGIhPT1hJiZsKHRoaXMsZGIuZHVyYXRpb24oYi1hLFwibVwiKSwxLCEwKSx0aGlzKX0sem9uZUFiYnI6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5faXNVVEM/XCJVVENcIjpcIlwifSx6b25lTmFtZTpmdW5jdGlvbigpe3JldHVybiB0aGlzLl9pc1VUQz9cIkNvb3JkaW5hdGVkIFVuaXZlcnNhbCBUaW1lXCI6XCJcIn0scGFyc2Vab25lOmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuX3R6bT90aGlzLnpvbmUodGhpcy5fdHptKTpcInN0cmluZ1wiPT10eXBlb2YgdGhpcy5faSYmdGhpcy56b25lKHRoaXMuX2kpLHRoaXN9LGhhc0FsaWduZWRIb3VyT2Zmc2V0OmZ1bmN0aW9uKGEpe3JldHVybiBhPWE/ZGIoYSkuem9uZSgpOjAsKHRoaXMuem9uZSgpLWEpJTYwPT09MH0sZGF5c0luTW9udGg6ZnVuY3Rpb24oKXtyZXR1cm4gdCh0aGlzLnllYXIoKSx0aGlzLm1vbnRoKCkpfSxkYXlPZlllYXI6ZnVuY3Rpb24oYSl7dmFyIGI9aGIoKGRiKHRoaXMpLnN0YXJ0T2YoXCJkYXlcIiktZGIodGhpcykuc3RhcnRPZihcInllYXJcIikpLzg2NGU1KSsxO3JldHVybiBudWxsPT1hP2I6dGhpcy5hZGQoXCJkXCIsYS1iKX0scXVhcnRlcjpmdW5jdGlvbigpe3JldHVybiBNYXRoLmNlaWwoKHRoaXMubW9udGgoKSsxKS8zKX0sd2Vla1llYXI6ZnVuY3Rpb24oYSl7dmFyIGI9WSh0aGlzLHRoaXMubGFuZygpLl93ZWVrLmRvdyx0aGlzLmxhbmcoKS5fd2Vlay5kb3kpLnllYXI7cmV0dXJuIG51bGw9PWE/Yjp0aGlzLmFkZChcInlcIixhLWIpfSxpc29XZWVrWWVhcjpmdW5jdGlvbihhKXt2YXIgYj1ZKHRoaXMsMSw0KS55ZWFyO3JldHVybiBudWxsPT1hP2I6dGhpcy5hZGQoXCJ5XCIsYS1iKX0sd2VlazpmdW5jdGlvbihhKXt2YXIgYj10aGlzLmxhbmcoKS53ZWVrKHRoaXMpO3JldHVybiBudWxsPT1hP2I6dGhpcy5hZGQoXCJkXCIsNyooYS1iKSl9LGlzb1dlZWs6ZnVuY3Rpb24oYSl7dmFyIGI9WSh0aGlzLDEsNCkud2VlaztyZXR1cm4gbnVsbD09YT9iOnRoaXMuYWRkKFwiZFwiLDcqKGEtYikpfSx3ZWVrZGF5OmZ1bmN0aW9uKGEpe3ZhciBiPSh0aGlzLmRheSgpKzctdGhpcy5sYW5nKCkuX3dlZWsuZG93KSU3O3JldHVybiBudWxsPT1hP2I6dGhpcy5hZGQoXCJkXCIsYS1iKX0saXNvV2Vla2RheTpmdW5jdGlvbihhKXtyZXR1cm4gbnVsbD09YT90aGlzLmRheSgpfHw3OnRoaXMuZGF5KHRoaXMuZGF5KCklNz9hOmEtNyl9LGdldDpmdW5jdGlvbihhKXtyZXR1cm4gYT1wKGEpLHRoaXNbYV0oKX0sc2V0OmZ1bmN0aW9uKGEsYil7cmV0dXJuIGE9cChhKSxcImZ1bmN0aW9uXCI9PXR5cGVvZiB0aGlzW2FdJiZ0aGlzW2FdKGIpLHRoaXN9LGxhbmc6ZnVuY3Rpb24oYil7cmV0dXJuIGI9PT1hP3RoaXMuX2xhbmc6KHRoaXMuX2xhbmc9QyhiKSx0aGlzKX19KSxlYj0wO2ViPFJiLmxlbmd0aDtlYisrKV8oUmJbZWJdLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvcyQvLFwiXCIpLFJiW2ViXSk7XyhcInllYXJcIixcIkZ1bGxZZWFyXCIpLGRiLmZuLmRheXM9ZGIuZm4uZGF5LGRiLmZuLm1vbnRocz1kYi5mbi5tb250aCxkYi5mbi53ZWVrcz1kYi5mbi53ZWVrLGRiLmZuLmlzb1dlZWtzPWRiLmZuLmlzb1dlZWssZGIuZm4udG9KU09OPWRiLmZuLnRvSVNPU3RyaW5nLGgoZGIuZHVyYXRpb24uZm49Zy5wcm90b3R5cGUse19idWJibGU6ZnVuY3Rpb24oKXt2YXIgYSxiLGMsZCxlPXRoaXMuX21pbGxpc2Vjb25kcyxmPXRoaXMuX2RheXMsZz10aGlzLl9tb250aHMsaD10aGlzLl9kYXRhO2gubWlsbGlzZWNvbmRzPWUlMWUzLGE9aihlLzFlMyksaC5zZWNvbmRzPWElNjAsYj1qKGEvNjApLGgubWludXRlcz1iJTYwLGM9aihiLzYwKSxoLmhvdXJzPWMlMjQsZis9aihjLzI0KSxoLmRheXM9ZiUzMCxnKz1qKGYvMzApLGgubW9udGhzPWclMTIsZD1qKGcvMTIpLGgueWVhcnM9ZH0sd2Vla3M6ZnVuY3Rpb24oKXtyZXR1cm4gaih0aGlzLmRheXMoKS83KX0sdmFsdWVPZjpmdW5jdGlvbigpe3JldHVybiB0aGlzLl9taWxsaXNlY29uZHMrODY0ZTUqdGhpcy5fZGF5cyt0aGlzLl9tb250aHMlMTIqMjU5MmU2KzMxNTM2ZTYqcyh0aGlzLl9tb250aHMvMTIpfSxodW1hbml6ZTpmdW5jdGlvbihhKXt2YXIgYj0rdGhpcyxjPVgoYiwhYSx0aGlzLmxhbmcoKSk7cmV0dXJuIGEmJihjPXRoaXMubGFuZygpLnBhc3RGdXR1cmUoYixjKSksdGhpcy5sYW5nKCkucG9zdGZvcm1hdChjKX0sYWRkOmZ1bmN0aW9uKGEsYil7dmFyIGM9ZGIuZHVyYXRpb24oYSxiKTtyZXR1cm4gdGhpcy5fbWlsbGlzZWNvbmRzKz1jLl9taWxsaXNlY29uZHMsdGhpcy5fZGF5cys9Yy5fZGF5cyx0aGlzLl9tb250aHMrPWMuX21vbnRocyx0aGlzLl9idWJibGUoKSx0aGlzfSxzdWJ0cmFjdDpmdW5jdGlvbihhLGIpe3ZhciBjPWRiLmR1cmF0aW9uKGEsYik7cmV0dXJuIHRoaXMuX21pbGxpc2Vjb25kcy09Yy5fbWlsbGlzZWNvbmRzLHRoaXMuX2RheXMtPWMuX2RheXMsdGhpcy5fbW9udGhzLT1jLl9tb250aHMsdGhpcy5fYnViYmxlKCksdGhpc30sZ2V0OmZ1bmN0aW9uKGEpe3JldHVybiBhPXAoYSksdGhpc1thLnRvTG93ZXJDYXNlKCkrXCJzXCJdKCl9LGFzOmZ1bmN0aW9uKGEpe3JldHVybiBhPXAoYSksdGhpc1tcImFzXCIrYS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSthLnNsaWNlKDEpK1wic1wiXSgpfSxsYW5nOmRiLmZuLmxhbmcsdG9Jc29TdHJpbmc6ZnVuY3Rpb24oKXt2YXIgYT1NYXRoLmFicyh0aGlzLnllYXJzKCkpLGI9TWF0aC5hYnModGhpcy5tb250aHMoKSksYz1NYXRoLmFicyh0aGlzLmRheXMoKSksZD1NYXRoLmFicyh0aGlzLmhvdXJzKCkpLGU9TWF0aC5hYnModGhpcy5taW51dGVzKCkpLGY9TWF0aC5hYnModGhpcy5zZWNvbmRzKCkrdGhpcy5taWxsaXNlY29uZHMoKS8xZTMpO3JldHVybiB0aGlzLmFzU2Vjb25kcygpPyh0aGlzLmFzU2Vjb25kcygpPDA/XCItXCI6XCJcIikrXCJQXCIrKGE/YStcIllcIjpcIlwiKSsoYj9iK1wiTVwiOlwiXCIpKyhjP2MrXCJEXCI6XCJcIikrKGR8fGV8fGY/XCJUXCI6XCJcIikrKGQ/ZCtcIkhcIjpcIlwiKSsoZT9lK1wiTVwiOlwiXCIpKyhmP2YrXCJTXCI6XCJcIik6XCJQMERcIn19KTtmb3IoZWIgaW4gU2IpU2IuaGFzT3duUHJvcGVydHkoZWIpJiYoYmIoZWIsU2JbZWJdKSxhYihlYi50b0xvd2VyQ2FzZSgpKSk7YmIoXCJXZWVrc1wiLDYwNDhlNSksZGIuZHVyYXRpb24uZm4uYXNNb250aHM9ZnVuY3Rpb24oKXtyZXR1cm4oK3RoaXMtMzE1MzZlNip0aGlzLnllYXJzKCkpLzI1OTJlNisxMip0aGlzLnllYXJzKCl9LGRiLmxhbmcoXCJlblwiLHtvcmRpbmFsOmZ1bmN0aW9uKGEpe3ZhciBiPWElMTAsYz0xPT09cyhhJTEwMC8xMCk/XCJ0aFwiOjE9PT1iP1wic3RcIjoyPT09Yj9cIm5kXCI6Mz09PWI/XCJyZFwiOlwidGhcIjtyZXR1cm4gYStjfX0pLHJiPyhtb2R1bGUuZXhwb3J0cz1kYixjYighMCkpOlwiZnVuY3Rpb25cIj09dHlwZW9mIGRlZmluZSYmZGVmaW5lLmFtZD9kZWZpbmUoXCJtb21lbnRcIixmdW5jdGlvbihiLGMsZCl7cmV0dXJuIGQuY29uZmlnJiZkLmNvbmZpZygpJiZkLmNvbmZpZygpLm5vR2xvYmFsIT09ITAmJmNiKGQuY29uZmlnKCkubm9HbG9iYWw9PT1hKSxkYn0pOmNiKCl9KS5jYWxsKHRoaXMpOyIsIi8qIG1vdXNldHJhcCB2MS40LjYgY3JhaWcuaXMva2lsbGluZy9taWNlICovXG4oZnVuY3Rpb24oSixyLGYpe2Z1bmN0aW9uIHMoYSxiLGQpe2EuYWRkRXZlbnRMaXN0ZW5lcj9hLmFkZEV2ZW50TGlzdGVuZXIoYixkLCExKTphLmF0dGFjaEV2ZW50KFwib25cIitiLGQpfWZ1bmN0aW9uIEEoYSl7aWYoXCJrZXlwcmVzc1wiPT1hLnR5cGUpe3ZhciBiPVN0cmluZy5mcm9tQ2hhckNvZGUoYS53aGljaCk7YS5zaGlmdEtleXx8KGI9Yi50b0xvd2VyQ2FzZSgpKTtyZXR1cm4gYn1yZXR1cm4gaFthLndoaWNoXT9oW2Eud2hpY2hdOkJbYS53aGljaF0/QlthLndoaWNoXTpTdHJpbmcuZnJvbUNoYXJDb2RlKGEud2hpY2gpLnRvTG93ZXJDYXNlKCl9ZnVuY3Rpb24gdChhKXthPWF8fHt9O3ZhciBiPSExLGQ7Zm9yKGQgaW4gbilhW2RdP2I9ITA6bltkXT0wO2J8fCh1PSExKX1mdW5jdGlvbiBDKGEsYixkLGMsZSx2KXt2YXIgZyxrLGY9W10saD1kLnR5cGU7aWYoIWxbYV0pcmV0dXJuW107XCJrZXl1cFwiPT1oJiZ3KGEpJiYoYj1bYV0pO2ZvcihnPTA7ZzxsW2FdLmxlbmd0aDsrK2cpaWYoaz1cbmxbYV1bZ10sISghYyYmay5zZXEmJm5bay5zZXFdIT1rLmxldmVsfHxoIT1rLmFjdGlvbnx8KFwia2V5cHJlc3NcIiE9aHx8ZC5tZXRhS2V5fHxkLmN0cmxLZXkpJiZiLnNvcnQoKS5qb2luKFwiLFwiKSE9PWsubW9kaWZpZXJzLnNvcnQoKS5qb2luKFwiLFwiKSkpe3ZhciBtPWMmJmsuc2VxPT1jJiZrLmxldmVsPT12OyghYyYmay5jb21ibz09ZXx8bSkmJmxbYV0uc3BsaWNlKGcsMSk7Zi5wdXNoKGspfXJldHVybiBmfWZ1bmN0aW9uIEsoYSl7dmFyIGI9W107YS5zaGlmdEtleSYmYi5wdXNoKFwic2hpZnRcIik7YS5hbHRLZXkmJmIucHVzaChcImFsdFwiKTthLmN0cmxLZXkmJmIucHVzaChcImN0cmxcIik7YS5tZXRhS2V5JiZiLnB1c2goXCJtZXRhXCIpO3JldHVybiBifWZ1bmN0aW9uIHgoYSxiLGQsYyl7bS5zdG9wQ2FsbGJhY2soYixiLnRhcmdldHx8Yi5zcmNFbGVtZW50LGQsYyl8fCExIT09YShiLGQpfHwoYi5wcmV2ZW50RGVmYXVsdD9iLnByZXZlbnREZWZhdWx0KCk6Yi5yZXR1cm5WYWx1ZT0hMSxiLnN0b3BQcm9wYWdhdGlvbj9cbmIuc3RvcFByb3BhZ2F0aW9uKCk6Yi5jYW5jZWxCdWJibGU9ITApfWZ1bmN0aW9uIHkoYSl7XCJudW1iZXJcIiE9PXR5cGVvZiBhLndoaWNoJiYoYS53aGljaD1hLmtleUNvZGUpO3ZhciBiPUEoYSk7YiYmKFwia2V5dXBcIj09YS50eXBlJiZ6PT09Yj96PSExOm0uaGFuZGxlS2V5KGIsSyhhKSxhKSl9ZnVuY3Rpb24gdyhhKXtyZXR1cm5cInNoaWZ0XCI9PWF8fFwiY3RybFwiPT1hfHxcImFsdFwiPT1hfHxcIm1ldGFcIj09YX1mdW5jdGlvbiBMKGEsYixkLGMpe2Z1bmN0aW9uIGUoYil7cmV0dXJuIGZ1bmN0aW9uKCl7dT1iOysrblthXTtjbGVhclRpbWVvdXQoRCk7RD1zZXRUaW1lb3V0KHQsMUUzKX19ZnVuY3Rpb24gdihiKXt4KGQsYixhKTtcImtleXVwXCIhPT1jJiYoej1BKGIpKTtzZXRUaW1lb3V0KHQsMTApfWZvcih2YXIgZz1uW2FdPTA7ZzxiLmxlbmd0aDsrK2cpe3ZhciBmPWcrMT09PWIubGVuZ3RoP3Y6ZShjfHxFKGJbZysxXSkuYWN0aW9uKTtGKGJbZ10sZixjLGEsZyl9fWZ1bmN0aW9uIEUoYSxiKXt2YXIgZCxcbmMsZSxmPVtdO2Q9XCIrXCI9PT1hP1tcIitcIl06YS5zcGxpdChcIitcIik7Zm9yKGU9MDtlPGQubGVuZ3RoOysrZSljPWRbZV0sR1tjXSYmKGM9R1tjXSksYiYmXCJrZXlwcmVzc1wiIT1iJiZIW2NdJiYoYz1IW2NdLGYucHVzaChcInNoaWZ0XCIpKSx3KGMpJiZmLnB1c2goYyk7ZD1jO2U9YjtpZighZSl7aWYoIXApe3A9e307Zm9yKHZhciBnIGluIGgpOTU8ZyYmMTEyPmd8fGguaGFzT3duUHJvcGVydHkoZykmJihwW2hbZ11dPWcpfWU9cFtkXT9cImtleWRvd25cIjpcImtleXByZXNzXCJ9XCJrZXlwcmVzc1wiPT1lJiZmLmxlbmd0aCYmKGU9XCJrZXlkb3duXCIpO3JldHVybntrZXk6Yyxtb2RpZmllcnM6ZixhY3Rpb246ZX19ZnVuY3Rpb24gRihhLGIsZCxjLGUpe3FbYStcIjpcIitkXT1iO2E9YS5yZXBsYWNlKC9cXHMrL2csXCIgXCIpO3ZhciBmPWEuc3BsaXQoXCIgXCIpOzE8Zi5sZW5ndGg/TChhLGYsYixkKTooZD1FKGEsZCksbFtkLmtleV09bFtkLmtleV18fFtdLEMoZC5rZXksZC5tb2RpZmllcnMse3R5cGU6ZC5hY3Rpb259LFxuYyxhLGUpLGxbZC5rZXldW2M/XCJ1bnNoaWZ0XCI6XCJwdXNoXCJdKHtjYWxsYmFjazpiLG1vZGlmaWVyczpkLm1vZGlmaWVycyxhY3Rpb246ZC5hY3Rpb24sc2VxOmMsbGV2ZWw6ZSxjb21ibzphfSkpfXZhciBoPXs4OlwiYmFja3NwYWNlXCIsOTpcInRhYlwiLDEzOlwiZW50ZXJcIiwxNjpcInNoaWZ0XCIsMTc6XCJjdHJsXCIsMTg6XCJhbHRcIiwyMDpcImNhcHNsb2NrXCIsMjc6XCJlc2NcIiwzMjpcInNwYWNlXCIsMzM6XCJwYWdldXBcIiwzNDpcInBhZ2Vkb3duXCIsMzU6XCJlbmRcIiwzNjpcImhvbWVcIiwzNzpcImxlZnRcIiwzODpcInVwXCIsMzk6XCJyaWdodFwiLDQwOlwiZG93blwiLDQ1OlwiaW5zXCIsNDY6XCJkZWxcIiw5MTpcIm1ldGFcIiw5MzpcIm1ldGFcIiwyMjQ6XCJtZXRhXCJ9LEI9ezEwNjpcIipcIiwxMDc6XCIrXCIsMTA5OlwiLVwiLDExMDpcIi5cIiwxMTE6XCIvXCIsMTg2OlwiO1wiLDE4NzpcIj1cIiwxODg6XCIsXCIsMTg5OlwiLVwiLDE5MDpcIi5cIiwxOTE6XCIvXCIsMTkyOlwiYFwiLDIxOTpcIltcIiwyMjA6XCJcXFxcXCIsMjIxOlwiXVwiLDIyMjpcIidcIn0sSD17XCJ+XCI6XCJgXCIsXCIhXCI6XCIxXCIsXG5cIkBcIjpcIjJcIixcIiNcIjpcIjNcIiwkOlwiNFwiLFwiJVwiOlwiNVwiLFwiXlwiOlwiNlwiLFwiJlwiOlwiN1wiLFwiKlwiOlwiOFwiLFwiKFwiOlwiOVwiLFwiKVwiOlwiMFwiLF86XCItXCIsXCIrXCI6XCI9XCIsXCI6XCI6XCI7XCIsJ1wiJzpcIidcIixcIjxcIjpcIixcIixcIj5cIjpcIi5cIixcIj9cIjpcIi9cIixcInxcIjpcIlxcXFxcIn0sRz17b3B0aW9uOlwiYWx0XCIsY29tbWFuZDpcIm1ldGFcIixcInJldHVyblwiOlwiZW50ZXJcIixlc2NhcGU6XCJlc2NcIixtb2Q6L01hY3xpUG9kfGlQaG9uZXxpUGFkLy50ZXN0KG5hdmlnYXRvci5wbGF0Zm9ybSk/XCJtZXRhXCI6XCJjdHJsXCJ9LHAsbD17fSxxPXt9LG49e30sRCx6PSExLEk9ITEsdT0hMTtmb3IoZj0xOzIwPmY7KytmKWhbMTExK2ZdPVwiZlwiK2Y7Zm9yKGY9MDs5Pj1mOysrZiloW2YrOTZdPWY7cyhyLFwia2V5cHJlc3NcIix5KTtzKHIsXCJrZXlkb3duXCIseSk7cyhyLFwia2V5dXBcIix5KTt2YXIgbT17YmluZDpmdW5jdGlvbihhLGIsZCl7YT1hIGluc3RhbmNlb2YgQXJyYXk/YTpbYV07Zm9yKHZhciBjPTA7YzxhLmxlbmd0aDsrK2MpRihhW2NdLGIsZCk7cmV0dXJuIHRoaXN9LFxudW5iaW5kOmZ1bmN0aW9uKGEsYil7cmV0dXJuIG0uYmluZChhLGZ1bmN0aW9uKCl7fSxiKX0sdHJpZ2dlcjpmdW5jdGlvbihhLGIpe2lmKHFbYStcIjpcIitiXSlxW2ErXCI6XCIrYl0oe30sYSk7cmV0dXJuIHRoaXN9LHJlc2V0OmZ1bmN0aW9uKCl7bD17fTtxPXt9O3JldHVybiB0aGlzfSxzdG9wQ2FsbGJhY2s6ZnVuY3Rpb24oYSxiKXtyZXR1cm4tMTwoXCIgXCIrYi5jbGFzc05hbWUrXCIgXCIpLmluZGV4T2YoXCIgbW91c2V0cmFwIFwiKT8hMTpcIklOUFVUXCI9PWIudGFnTmFtZXx8XCJTRUxFQ1RcIj09Yi50YWdOYW1lfHxcIlRFWFRBUkVBXCI9PWIudGFnTmFtZXx8Yi5pc0NvbnRlbnRFZGl0YWJsZX0saGFuZGxlS2V5OmZ1bmN0aW9uKGEsYixkKXt2YXIgYz1DKGEsYixkKSxlO2I9e307dmFyIGY9MCxnPSExO2ZvcihlPTA7ZTxjLmxlbmd0aDsrK2UpY1tlXS5zZXEmJihmPU1hdGgubWF4KGYsY1tlXS5sZXZlbCkpO2ZvcihlPTA7ZTxjLmxlbmd0aDsrK2UpY1tlXS5zZXE/Y1tlXS5sZXZlbD09ZiYmKGc9ITAsXG5iW2NbZV0uc2VxXT0xLHgoY1tlXS5jYWxsYmFjayxkLGNbZV0uY29tYm8sY1tlXS5zZXEpKTpnfHx4KGNbZV0uY2FsbGJhY2ssZCxjW2VdLmNvbWJvKTtjPVwia2V5cHJlc3NcIj09ZC50eXBlJiZJO2QudHlwZSE9dXx8dyhhKXx8Y3x8dChiKTtJPWcmJlwia2V5ZG93blwiPT1kLnR5cGV9fTtKLk1vdXNldHJhcD1tO1wiZnVuY3Rpb25cIj09PXR5cGVvZiBkZWZpbmUmJmRlZmluZS5hbWQmJmRlZmluZShtKX0pKHdpbmRvdyxkb2N1bWVudCk7XG5cbm1vZHVsZS5leHBvcnRzID0gd2luZG93Lk1vdXNldHJhcDtcbndpbmRvdy5Nb3VzZXRyYXAgPSBudWxsOyIsIi8qXG5cbiBKUyBTaWduYWxzIDxodHRwOi8vbWlsbGVybWVkZWlyb3MuZ2l0aHViLmNvbS9qcy1zaWduYWxzLz5cbiBSZWxlYXNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2VcbiBBdXRob3I6IE1pbGxlciBNZWRlaXJvc1xuIFZlcnNpb246IDEuMC4wIC0gQnVpbGQ6IDI2OCAoMjAxMi8xMS8yOSAwNTo0OCBQTSlcbiovXG4oZnVuY3Rpb24oaSl7ZnVuY3Rpb24gaChhLGIsYyxkLGUpe3RoaXMuX2xpc3RlbmVyPWI7dGhpcy5faXNPbmNlPWM7dGhpcy5jb250ZXh0PWQ7dGhpcy5fc2lnbmFsPWE7dGhpcy5fcHJpb3JpdHk9ZXx8MH1mdW5jdGlvbiBnKGEsYil7aWYodHlwZW9mIGEhPT1cImZ1bmN0aW9uXCIpdGhyb3cgRXJyb3IoXCJsaXN0ZW5lciBpcyBhIHJlcXVpcmVkIHBhcmFtIG9mIHtmbn0oKSBhbmQgc2hvdWxkIGJlIGEgRnVuY3Rpb24uXCIucmVwbGFjZShcIntmbn1cIixiKSk7fWZ1bmN0aW9uIGUoKXt0aGlzLl9iaW5kaW5ncz1bXTt0aGlzLl9wcmV2UGFyYW1zPW51bGw7dmFyIGE9dGhpczt0aGlzLmRpc3BhdGNoPWZ1bmN0aW9uKCl7ZS5wcm90b3R5cGUuZGlzcGF0Y2guYXBwbHkoYSxhcmd1bWVudHMpfX1oLnByb3RvdHlwZT17YWN0aXZlOiEwLHBhcmFtczpudWxsLGV4ZWN1dGU6ZnVuY3Rpb24oYSl7dmFyIGI7dGhpcy5hY3RpdmUmJnRoaXMuX2xpc3RlbmVyJiYoYT10aGlzLnBhcmFtcz90aGlzLnBhcmFtcy5jb25jYXQoYSk6XG5hLGI9dGhpcy5fbGlzdGVuZXIuYXBwbHkodGhpcy5jb250ZXh0LGEpLHRoaXMuX2lzT25jZSYmdGhpcy5kZXRhY2goKSk7cmV0dXJuIGJ9LGRldGFjaDpmdW5jdGlvbigpe3JldHVybiB0aGlzLmlzQm91bmQoKT90aGlzLl9zaWduYWwucmVtb3ZlKHRoaXMuX2xpc3RlbmVyLHRoaXMuY29udGV4dCk6bnVsbH0saXNCb3VuZDpmdW5jdGlvbigpe3JldHVybiEhdGhpcy5fc2lnbmFsJiYhIXRoaXMuX2xpc3RlbmVyfSxpc09uY2U6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5faXNPbmNlfSxnZXRMaXN0ZW5lcjpmdW5jdGlvbigpe3JldHVybiB0aGlzLl9saXN0ZW5lcn0sZ2V0U2lnbmFsOmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuX3NpZ25hbH0sX2Rlc3Ryb3k6ZnVuY3Rpb24oKXtkZWxldGUgdGhpcy5fc2lnbmFsO2RlbGV0ZSB0aGlzLl9saXN0ZW5lcjtkZWxldGUgdGhpcy5jb250ZXh0fSx0b1N0cmluZzpmdW5jdGlvbigpe3JldHVyblwiW1NpZ25hbEJpbmRpbmcgaXNPbmNlOlwiK3RoaXMuX2lzT25jZStcblwiLCBpc0JvdW5kOlwiK3RoaXMuaXNCb3VuZCgpK1wiLCBhY3RpdmU6XCIrdGhpcy5hY3RpdmUrXCJdXCJ9fTtlLnByb3RvdHlwZT17VkVSU0lPTjpcIjEuMC4wXCIsbWVtb3JpemU6ITEsX3Nob3VsZFByb3BhZ2F0ZTohMCxhY3RpdmU6ITAsX3JlZ2lzdGVyTGlzdGVuZXI6ZnVuY3Rpb24oYSxiLGMsZCl7dmFyIGU9dGhpcy5faW5kZXhPZkxpc3RlbmVyKGEsYyk7aWYoZSE9PS0xKXtpZihhPXRoaXMuX2JpbmRpbmdzW2VdLGEuaXNPbmNlKCkhPT1iKXRocm93IEVycm9yKFwiWW91IGNhbm5vdCBhZGRcIisoYj9cIlwiOlwiT25jZVwiKStcIigpIHRoZW4gYWRkXCIrKCFiP1wiXCI6XCJPbmNlXCIpK1wiKCkgdGhlIHNhbWUgbGlzdGVuZXIgd2l0aG91dCByZW1vdmluZyB0aGUgcmVsYXRpb25zaGlwIGZpcnN0LlwiKTt9ZWxzZSBhPW5ldyBoKHRoaXMsYSxiLGMsZCksdGhpcy5fYWRkQmluZGluZyhhKTt0aGlzLm1lbW9yaXplJiZ0aGlzLl9wcmV2UGFyYW1zJiZhLmV4ZWN1dGUodGhpcy5fcHJldlBhcmFtcyk7cmV0dXJuIGF9LFxuX2FkZEJpbmRpbmc6ZnVuY3Rpb24oYSl7dmFyIGI9dGhpcy5fYmluZGluZ3MubGVuZ3RoO2RvLS1iO3doaWxlKHRoaXMuX2JpbmRpbmdzW2JdJiZhLl9wcmlvcml0eTw9dGhpcy5fYmluZGluZ3NbYl0uX3ByaW9yaXR5KTt0aGlzLl9iaW5kaW5ncy5zcGxpY2UoYisxLDAsYSl9LF9pbmRleE9mTGlzdGVuZXI6ZnVuY3Rpb24oYSxiKXtmb3IodmFyIGM9dGhpcy5fYmluZGluZ3MubGVuZ3RoLGQ7Yy0tOylpZihkPXRoaXMuX2JpbmRpbmdzW2NdLGQuX2xpc3RlbmVyPT09YSYmZC5jb250ZXh0PT09YilyZXR1cm4gYztyZXR1cm4tMX0saGFzOmZ1bmN0aW9uKGEsYil7cmV0dXJuIHRoaXMuX2luZGV4T2ZMaXN0ZW5lcihhLGIpIT09LTF9LGFkZDpmdW5jdGlvbihhLGIsYyl7ZyhhLFwiYWRkXCIpO3JldHVybiB0aGlzLl9yZWdpc3Rlckxpc3RlbmVyKGEsITEsYixjKX0sYWRkT25jZTpmdW5jdGlvbihhLGIsYyl7ZyhhLFwiYWRkT25jZVwiKTtyZXR1cm4gdGhpcy5fcmVnaXN0ZXJMaXN0ZW5lcihhLFxuITAsYixjKX0scmVtb3ZlOmZ1bmN0aW9uKGEsYil7ZyhhLFwicmVtb3ZlXCIpO3ZhciBjPXRoaXMuX2luZGV4T2ZMaXN0ZW5lcihhLGIpO2MhPT0tMSYmKHRoaXMuX2JpbmRpbmdzW2NdLl9kZXN0cm95KCksdGhpcy5fYmluZGluZ3Muc3BsaWNlKGMsMSkpO3JldHVybiBhfSxyZW1vdmVBbGw6ZnVuY3Rpb24oKXtmb3IodmFyIGE9dGhpcy5fYmluZGluZ3MubGVuZ3RoO2EtLTspdGhpcy5fYmluZGluZ3NbYV0uX2Rlc3Ryb3koKTt0aGlzLl9iaW5kaW5ncy5sZW5ndGg9MH0sZ2V0TnVtTGlzdGVuZXJzOmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuX2JpbmRpbmdzLmxlbmd0aH0saGFsdDpmdW5jdGlvbigpe3RoaXMuX3Nob3VsZFByb3BhZ2F0ZT0hMX0sZGlzcGF0Y2g6ZnVuY3Rpb24oYSl7aWYodGhpcy5hY3RpdmUpe3ZhciBiPUFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyksYz10aGlzLl9iaW5kaW5ncy5sZW5ndGgsZDtpZih0aGlzLm1lbW9yaXplKXRoaXMuX3ByZXZQYXJhbXM9XG5iO2lmKGMpe2Q9dGhpcy5fYmluZGluZ3Muc2xpY2UoKTt0aGlzLl9zaG91bGRQcm9wYWdhdGU9ITA7ZG8gYy0tO3doaWxlKGRbY10mJnRoaXMuX3Nob3VsZFByb3BhZ2F0ZSYmZFtjXS5leGVjdXRlKGIpIT09ITEpfX19LGZvcmdldDpmdW5jdGlvbigpe3RoaXMuX3ByZXZQYXJhbXM9bnVsbH0sZGlzcG9zZTpmdW5jdGlvbigpe3RoaXMucmVtb3ZlQWxsKCk7ZGVsZXRlIHRoaXMuX2JpbmRpbmdzO2RlbGV0ZSB0aGlzLl9wcmV2UGFyYW1zfSx0b1N0cmluZzpmdW5jdGlvbigpe3JldHVyblwiW1NpZ25hbCBhY3RpdmU6XCIrdGhpcy5hY3RpdmUrXCIgbnVtTGlzdGVuZXJzOlwiK3RoaXMuZ2V0TnVtTGlzdGVuZXJzKCkrXCJdXCJ9fTt2YXIgZj1lO2YuU2lnbmFsPWU7dHlwZW9mIGRlZmluZT09PVwiZnVuY3Rpb25cIiYmZGVmaW5lLmFtZD9kZWZpbmUoZnVuY3Rpb24oKXtyZXR1cm4gZn0pOnR5cGVvZiBtb2R1bGUhPT1cInVuZGVmaW5lZFwiJiZtb2R1bGUuZXhwb3J0cz9tb2R1bGUuZXhwb3J0cz1mOmkuc2lnbmFscz1cbmZ9KSh0aGlzKTsiLG51bGxdfQ==
