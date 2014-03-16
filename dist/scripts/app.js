(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var list = function(path) 
{
	if(!path)
	{
		path = [];
	}

	return $.ajax({
		method: 'POST',
		url: '/api/list',
		cache: false,
		contentType: 'application/json',
		data: JSON.stringify({ path: path, expand: path.length > 0 }),
		processData: false,
		dataType: 'json'
	});
}

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

var listsongs = function(path)
{
	if(!path)
	{
		return;		
	}

	return $.ajax({
		method: 'POST',
		url: '/api/listsongs',
		cache: false,
		contentType: 'application/json',
		data: JSON.stringify({ path: path }),
		processData: false,
		dataType: 'json'
	});
}

var song = function(path)
{
	if(!path)
	{
		return;
	}

	return $.ajax({
		method: 'POST',
		url: '/api/song',
		cache: false,
		contentType: 'application/json',
		data: JSON.stringify({ path: path }),
		processData: false,
		dataType: 'json'
	});
}

module.exports = {
	list: list,
	listsongs: listsongs,
	song: song,
	db: db
};

},{}],2:[function(require,module,exports){
var util = require('./util.js'),
	audioplayer = require('./audioplayer.js'),
	playlist = require('./playlist.js'),
	$progress, 
	$duration, 
	$position, 
	$song, 
	$artist, 
	$album, 
	$pause, 
	$next, 
	$prev;

$(function() {
	$progress = $(".progress-bar");
	$duration = $("#duration");
	$position = $("#position");
	$song = $("#song");
	$artist = $("#artist");
	$album = $("#album");
	$pause = $("#pause");
	$next = $("#next");
	$prev = $("#prev");

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

function onPlayed(item) {
	$song.html(item.song);
	$artist.html(item.artist);
	$album.html(item.album);

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
},{"./audioplayer.js":3,"./playlist.js":7,"./util.js":11}],3:[function(require,module,exports){
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
			audiplayer.ended.dispatch();
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
},{"./vendor/signals.min.js":16}],4:[function(require,module,exports){
var navigation = require('./navigation.js');
var audiocontrols = require('./audiocontrols.js');

$(function() {
	navigation.initialize();
});


},{"./audiocontrols.js":2,"./navigation.js":6}],5:[function(require,module,exports){

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
	getSongs: getSongs
};

},{"./api.js":1,"./vendor/lodash.min.js":13}],6:[function(require,module,exports){
var api = require('./api.js');
var playlist = require('./playlist.js');
var library = require('./library.js');
var _ = require('./vendor/lodash.min.js');
var templates = {
	itemDefault: require('./templates/navigation-default.js'),
	itemAlbum: require('./templates/navigation-album.js')
};

var $list, $up, currentPath = [], outerScroll = 0;
$(function() {
	$list = $("#list");
	$up = $("#up");
	$artist = $("#artist");

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


function renderDefault(item, path)
{
	$.each(_.sortBy(item.items, 'name'), function(i,x) {
		var li = $(templates.itemDefault(x));
		$list.append(li);

		var itemPath = path.slice(0);
		itemPath.push(x.name);
		$(li).data('path', itemPath);

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
		renderDefault(library.get(currentPath), currentPath.slice(0));
}

function initialize() {
	library.initialize().then(populateList);
}

module.exports = {
	itemDragStart: itemDragStart,
	add: add,
	populate: populateList,
	initialize: initialize
}
},{"./api.js":1,"./library.js":5,"./playlist.js":7,"./templates/navigation-album.js":8,"./templates/navigation-default.js":9,"./vendor/lodash.min.js":13}],7:[function(require,module,exports){
var audioplayer = require('./audioplayer.js'),
	api = require('./api.js'),
	util = require('./util.js'),
	mousetrap = require('./vendor/mousetrap.min.js'),
	currentSongs = [],
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
				newOrder.push(_.find(currentSongs, function(y) {
					return y.stream === $(x).data('stream');
				}));
			});

			currentSongs = newOrder;
			_super($item);
		}
	});
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

	var song = currentSongs[currentIndex];
	audioplayer.play(song);
	
	$playlist.find('span.playing').addClass('hide');
	$playlist.find('.item').each(function(i,x) {

		if($(x).data('stream') === song.stream)
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
	$.each(currentSongs, function(i,x) {
		var row = $(templates.item({
			stream: x.stream,
			song: x.song,
			artist: x.artist,
			album: x.album,
			duration: util.secondsToTime(x.duration)
		}));

		$playlist.append(row);
		row.data('item', x);
	});
}

module.exports = {
	addSongs: addSongs,
	prev: prev,
	next: next,
	playSongs: playSongs
}
},{"./api.js":1,"./audioplayer.js":3,"./templates/playlist-item.js":10,"./util.js":11,"./vendor/lodash.min.js":13,"./vendor/mousetrap.min.js":15}],8:[function(require,module,exports){
jade = require("./../vendor/jaderuntime.js");function template(locals) {
var buf = [];
var jade_mixins = {};
var locals_ = (locals || {}),cover = locals_.cover,name = locals_.name,items = locals_.items;
buf.push("<li class=\"album\"><div class=\"row\"><div class=\"col-xs-4 cover\"><img" + (jade.attr("src", (cover || '/images/no-cover.png'), true, false)) + "/></div><div class=\"col-xs-8 info\"><h3>" + (jade.escape(null == (jade.interp = name) ? "" : jade.interp)) + "</h3><h5>2007</h5><h5>" + (jade.escape(null == (jade.interp = (items.length + " songs")) ? "" : jade.interp)) + "</h5><div class=\"btn-group\"><button class=\"btn btn-default play\"><span class=\"glyphicon glyphicon-play\"></span></button><button class=\"btn btn-default add\"><span class=\"glyphicon glyphicon-log-in\"></span></button></div></div></div></li>");;return buf.join("");
}module.exports = template;
},{"./../vendor/jaderuntime.js":12}],9:[function(require,module,exports){
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
},{"./../vendor/jaderuntime.js":12}],10:[function(require,module,exports){
jade = require("./../vendor/jaderuntime.js");function template(locals) {
var buf = [];
var jade_mixins = {};
var locals_ = (locals || {}),stream = locals_.stream,song = locals_.song,album = locals_.album,artist = locals_.artist,duration = locals_.duration;
buf.push("<tr" + (jade.attr("data-stream", stream, true, false)) + " class=\"item\"><td><span class=\"glyphicon glyphicon-volume-up playing hide\"></span><span>&nbsp;</span><span>" + (jade.escape(null == (jade.interp = song) ? "" : jade.interp)) + "</span></td><td>" + (jade.escape(null == (jade.interp = album) ? "" : jade.interp)) + "</td><td>" + (jade.escape(null == (jade.interp = artist) ? "" : jade.interp)) + "</td><td>" + (jade.escape(null == (jade.interp = duration) ? "" : jade.interp)) + "</td></tr>");;return buf.join("");
}module.exports = template;
},{"./../vendor/jaderuntime.js":12}],11:[function(require,module,exports){
var moment = require('./vendor/moment.js');

function secondsToTime(sec)
{
	return moment().startOf('day').add('s', sec).format('mm:ss')
}

module.exports = {
	secondsToTime: secondsToTime
};

},{"./vendor/moment.js":14}],12:[function(require,module,exports){
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
},{"fs":17}],13:[function(require,module,exports){
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
},{}],14:[function(require,module,exports){
//! moment.js
//! version : 2.5.1
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com
(function(a){function b(){return{empty:!1,unusedTokens:[],unusedInput:[],overflow:-2,charsLeftOver:0,nullInput:!1,invalidMonth:null,invalidFormat:!1,userInvalidated:!1,iso:!1}}function c(a,b){return function(c){return k(a.call(this,c),b)}}function d(a,b){return function(c){return this.lang().ordinal(a.call(this,c),b)}}function e(){}function f(a){w(a),h(this,a)}function g(a){var b=q(a),c=b.year||0,d=b.month||0,e=b.week||0,f=b.day||0,g=b.hour||0,h=b.minute||0,i=b.second||0,j=b.millisecond||0;this._milliseconds=+j+1e3*i+6e4*h+36e5*g,this._days=+f+7*e,this._months=+d+12*c,this._data={},this._bubble()}function h(a,b){for(var c in b)b.hasOwnProperty(c)&&(a[c]=b[c]);return b.hasOwnProperty("toString")&&(a.toString=b.toString),b.hasOwnProperty("valueOf")&&(a.valueOf=b.valueOf),a}function i(a){var b,c={};for(b in a)a.hasOwnProperty(b)&&qb.hasOwnProperty(b)&&(c[b]=a[b]);return c}function j(a){return 0>a?Math.ceil(a):Math.floor(a)}function k(a,b,c){for(var d=""+Math.abs(a),e=a>=0;d.length<b;)d="0"+d;return(e?c?"+":"":"-")+d}function l(a,b,c,d){var e,f,g=b._milliseconds,h=b._days,i=b._months;g&&a._d.setTime(+a._d+g*c),(h||i)&&(e=a.minute(),f=a.hour()),h&&a.date(a.date()+h*c),i&&a.month(a.month()+i*c),g&&!d&&db.updateOffset(a),(h||i)&&(a.minute(e),a.hour(f))}function m(a){return"[object Array]"===Object.prototype.toString.call(a)}function n(a){return"[object Date]"===Object.prototype.toString.call(a)||a instanceof Date}function o(a,b,c){var d,e=Math.min(a.length,b.length),f=Math.abs(a.length-b.length),g=0;for(d=0;e>d;d++)(c&&a[d]!==b[d]||!c&&s(a[d])!==s(b[d]))&&g++;return g+f}function p(a){if(a){var b=a.toLowerCase().replace(/(.)s$/,"$1");a=Tb[a]||Ub[b]||b}return a}function q(a){var b,c,d={};for(c in a)a.hasOwnProperty(c)&&(b=p(c),b&&(d[b]=a[c]));return d}function r(b){var c,d;if(0===b.indexOf("week"))c=7,d="day";else{if(0!==b.indexOf("month"))return;c=12,d="month"}db[b]=function(e,f){var g,h,i=db.fn._lang[b],j=[];if("number"==typeof e&&(f=e,e=a),h=function(a){var b=db().utc().set(d,a);return i.call(db.fn._lang,b,e||"")},null!=f)return h(f);for(g=0;c>g;g++)j.push(h(g));return j}}function s(a){var b=+a,c=0;return 0!==b&&isFinite(b)&&(c=b>=0?Math.floor(b):Math.ceil(b)),c}function t(a,b){return new Date(Date.UTC(a,b+1,0)).getUTCDate()}function u(a){return v(a)?366:365}function v(a){return a%4===0&&a%100!==0||a%400===0}function w(a){var b;a._a&&-2===a._pf.overflow&&(b=a._a[jb]<0||a._a[jb]>11?jb:a._a[kb]<1||a._a[kb]>t(a._a[ib],a._a[jb])?kb:a._a[lb]<0||a._a[lb]>23?lb:a._a[mb]<0||a._a[mb]>59?mb:a._a[nb]<0||a._a[nb]>59?nb:a._a[ob]<0||a._a[ob]>999?ob:-1,a._pf._overflowDayOfYear&&(ib>b||b>kb)&&(b=kb),a._pf.overflow=b)}function x(a){return null==a._isValid&&(a._isValid=!isNaN(a._d.getTime())&&a._pf.overflow<0&&!a._pf.empty&&!a._pf.invalidMonth&&!a._pf.nullInput&&!a._pf.invalidFormat&&!a._pf.userInvalidated,a._strict&&(a._isValid=a._isValid&&0===a._pf.charsLeftOver&&0===a._pf.unusedTokens.length)),a._isValid}function y(a){return a?a.toLowerCase().replace("_","-"):a}function z(a,b){return b._isUTC?db(a).zone(b._offset||0):db(a).local()}function A(a,b){return b.abbr=a,pb[a]||(pb[a]=new e),pb[a].set(b),pb[a]}function B(a){delete pb[a]}function C(a){var b,c,d,e,f=0,g=function(a){if(!pb[a]&&rb)try{require("./lang/"+a)}catch(b){}return pb[a]};if(!a)return db.fn._lang;if(!m(a)){if(c=g(a))return c;a=[a]}for(;f<a.length;){for(e=y(a[f]).split("-"),b=e.length,d=y(a[f+1]),d=d?d.split("-"):null;b>0;){if(c=g(e.slice(0,b).join("-")))return c;if(d&&d.length>=b&&o(e,d,!0)>=b-1)break;b--}f++}return db.fn._lang}function D(a){return a.match(/\[[\s\S]/)?a.replace(/^\[|\]$/g,""):a.replace(/\\/g,"")}function E(a){var b,c,d=a.match(vb);for(b=0,c=d.length;c>b;b++)d[b]=Yb[d[b]]?Yb[d[b]]:D(d[b]);return function(e){var f="";for(b=0;c>b;b++)f+=d[b]instanceof Function?d[b].call(e,a):d[b];return f}}function F(a,b){return a.isValid()?(b=G(b,a.lang()),Vb[b]||(Vb[b]=E(b)),Vb[b](a)):a.lang().invalidDate()}function G(a,b){function c(a){return b.longDateFormat(a)||a}var d=5;for(wb.lastIndex=0;d>=0&&wb.test(a);)a=a.replace(wb,c),wb.lastIndex=0,d-=1;return a}function H(a,b){var c,d=b._strict;switch(a){case"DDDD":return Ib;case"YYYY":case"GGGG":case"gggg":return d?Jb:zb;case"Y":case"G":case"g":return Lb;case"YYYYYY":case"YYYYY":case"GGGGG":case"ggggg":return d?Kb:Ab;case"S":if(d)return Gb;case"SS":if(d)return Hb;case"SSS":if(d)return Ib;case"DDD":return yb;case"MMM":case"MMMM":case"dd":case"ddd":case"dddd":return Cb;case"a":case"A":return C(b._l)._meridiemParse;case"X":return Fb;case"Z":case"ZZ":return Db;case"T":return Eb;case"SSSS":return Bb;case"MM":case"DD":case"YY":case"GG":case"gg":case"HH":case"hh":case"mm":case"ss":case"ww":case"WW":return d?Hb:xb;case"M":case"D":case"d":case"H":case"h":case"m":case"s":case"w":case"W":case"e":case"E":return xb;default:return c=new RegExp(P(O(a.replace("\\","")),"i"))}}function I(a){a=a||"";var b=a.match(Db)||[],c=b[b.length-1]||[],d=(c+"").match(Qb)||["-",0,0],e=+(60*d[1])+s(d[2]);return"+"===d[0]?-e:e}function J(a,b,c){var d,e=c._a;switch(a){case"M":case"MM":null!=b&&(e[jb]=s(b)-1);break;case"MMM":case"MMMM":d=C(c._l).monthsParse(b),null!=d?e[jb]=d:c._pf.invalidMonth=b;break;case"D":case"DD":null!=b&&(e[kb]=s(b));break;case"DDD":case"DDDD":null!=b&&(c._dayOfYear=s(b));break;case"YY":e[ib]=s(b)+(s(b)>68?1900:2e3);break;case"YYYY":case"YYYYY":case"YYYYYY":e[ib]=s(b);break;case"a":case"A":c._isPm=C(c._l).isPM(b);break;case"H":case"HH":case"h":case"hh":e[lb]=s(b);break;case"m":case"mm":e[mb]=s(b);break;case"s":case"ss":e[nb]=s(b);break;case"S":case"SS":case"SSS":case"SSSS":e[ob]=s(1e3*("0."+b));break;case"X":c._d=new Date(1e3*parseFloat(b));break;case"Z":case"ZZ":c._useUTC=!0,c._tzm=I(b);break;case"w":case"ww":case"W":case"WW":case"d":case"dd":case"ddd":case"dddd":case"e":case"E":a=a.substr(0,1);case"gg":case"gggg":case"GG":case"GGGG":case"GGGGG":a=a.substr(0,2),b&&(c._w=c._w||{},c._w[a]=b)}}function K(a){var b,c,d,e,f,g,h,i,j,k,l=[];if(!a._d){for(d=M(a),a._w&&null==a._a[kb]&&null==a._a[jb]&&(f=function(b){var c=parseInt(b,10);return b?b.length<3?c>68?1900+c:2e3+c:c:null==a._a[ib]?db().weekYear():a._a[ib]},g=a._w,null!=g.GG||null!=g.W||null!=g.E?h=Z(f(g.GG),g.W||1,g.E,4,1):(i=C(a._l),j=null!=g.d?V(g.d,i):null!=g.e?parseInt(g.e,10)+i._week.dow:0,k=parseInt(g.w,10)||1,null!=g.d&&j<i._week.dow&&k++,h=Z(f(g.gg),k,j,i._week.doy,i._week.dow)),a._a[ib]=h.year,a._dayOfYear=h.dayOfYear),a._dayOfYear&&(e=null==a._a[ib]?d[ib]:a._a[ib],a._dayOfYear>u(e)&&(a._pf._overflowDayOfYear=!0),c=U(e,0,a._dayOfYear),a._a[jb]=c.getUTCMonth(),a._a[kb]=c.getUTCDate()),b=0;3>b&&null==a._a[b];++b)a._a[b]=l[b]=d[b];for(;7>b;b++)a._a[b]=l[b]=null==a._a[b]?2===b?1:0:a._a[b];l[lb]+=s((a._tzm||0)/60),l[mb]+=s((a._tzm||0)%60),a._d=(a._useUTC?U:T).apply(null,l)}}function L(a){var b;a._d||(b=q(a._i),a._a=[b.year,b.month,b.day,b.hour,b.minute,b.second,b.millisecond],K(a))}function M(a){var b=new Date;return a._useUTC?[b.getUTCFullYear(),b.getUTCMonth(),b.getUTCDate()]:[b.getFullYear(),b.getMonth(),b.getDate()]}function N(a){a._a=[],a._pf.empty=!0;var b,c,d,e,f,g=C(a._l),h=""+a._i,i=h.length,j=0;for(d=G(a._f,g).match(vb)||[],b=0;b<d.length;b++)e=d[b],c=(h.match(H(e,a))||[])[0],c&&(f=h.substr(0,h.indexOf(c)),f.length>0&&a._pf.unusedInput.push(f),h=h.slice(h.indexOf(c)+c.length),j+=c.length),Yb[e]?(c?a._pf.empty=!1:a._pf.unusedTokens.push(e),J(e,c,a)):a._strict&&!c&&a._pf.unusedTokens.push(e);a._pf.charsLeftOver=i-j,h.length>0&&a._pf.unusedInput.push(h),a._isPm&&a._a[lb]<12&&(a._a[lb]+=12),a._isPm===!1&&12===a._a[lb]&&(a._a[lb]=0),K(a),w(a)}function O(a){return a.replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g,function(a,b,c,d,e){return b||c||d||e})}function P(a){return a.replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&")}function Q(a){var c,d,e,f,g;if(0===a._f.length)return a._pf.invalidFormat=!0,a._d=new Date(0/0),void 0;for(f=0;f<a._f.length;f++)g=0,c=h({},a),c._pf=b(),c._f=a._f[f],N(c),x(c)&&(g+=c._pf.charsLeftOver,g+=10*c._pf.unusedTokens.length,c._pf.score=g,(null==e||e>g)&&(e=g,d=c));h(a,d||c)}function R(a){var b,c,d=a._i,e=Mb.exec(d);if(e){for(a._pf.iso=!0,b=0,c=Ob.length;c>b;b++)if(Ob[b][1].exec(d)){a._f=Ob[b][0]+(e[6]||" ");break}for(b=0,c=Pb.length;c>b;b++)if(Pb[b][1].exec(d)){a._f+=Pb[b][0];break}d.match(Db)&&(a._f+="Z"),N(a)}else a._d=new Date(d)}function S(b){var c=b._i,d=sb.exec(c);c===a?b._d=new Date:d?b._d=new Date(+d[1]):"string"==typeof c?R(b):m(c)?(b._a=c.slice(0),K(b)):n(c)?b._d=new Date(+c):"object"==typeof c?L(b):b._d=new Date(c)}function T(a,b,c,d,e,f,g){var h=new Date(a,b,c,d,e,f,g);return 1970>a&&h.setFullYear(a),h}function U(a){var b=new Date(Date.UTC.apply(null,arguments));return 1970>a&&b.setUTCFullYear(a),b}function V(a,b){if("string"==typeof a)if(isNaN(a)){if(a=b.weekdaysParse(a),"number"!=typeof a)return null}else a=parseInt(a,10);return a}function W(a,b,c,d,e){return e.relativeTime(b||1,!!c,a,d)}function X(a,b,c){var d=hb(Math.abs(a)/1e3),e=hb(d/60),f=hb(e/60),g=hb(f/24),h=hb(g/365),i=45>d&&["s",d]||1===e&&["m"]||45>e&&["mm",e]||1===f&&["h"]||22>f&&["hh",f]||1===g&&["d"]||25>=g&&["dd",g]||45>=g&&["M"]||345>g&&["MM",hb(g/30)]||1===h&&["y"]||["yy",h];return i[2]=b,i[3]=a>0,i[4]=c,W.apply({},i)}function Y(a,b,c){var d,e=c-b,f=c-a.day();return f>e&&(f-=7),e-7>f&&(f+=7),d=db(a).add("d",f),{week:Math.ceil(d.dayOfYear()/7),year:d.year()}}function Z(a,b,c,d,e){var f,g,h=U(a,0,1).getUTCDay();return c=null!=c?c:e,f=e-h+(h>d?7:0)-(e>h?7:0),g=7*(b-1)+(c-e)+f+1,{year:g>0?a:a-1,dayOfYear:g>0?g:u(a-1)+g}}function $(a){var b=a._i,c=a._f;return null===b?db.invalid({nullInput:!0}):("string"==typeof b&&(a._i=b=C().preparse(b)),db.isMoment(b)?(a=i(b),a._d=new Date(+b._d)):c?m(c)?Q(a):N(a):S(a),new f(a))}function _(a,b){db.fn[a]=db.fn[a+"s"]=function(a){var c=this._isUTC?"UTC":"";return null!=a?(this._d["set"+c+b](a),db.updateOffset(this),this):this._d["get"+c+b]()}}function ab(a){db.duration.fn[a]=function(){return this._data[a]}}function bb(a,b){db.duration.fn["as"+a]=function(){return+this/b}}function cb(a){var b=!1,c=db;"undefined"==typeof ender&&(a?(gb.moment=function(){return!b&&console&&console.warn&&(b=!0,console.warn("Accessing Moment through the global scope is deprecated, and will be removed in an upcoming release.")),c.apply(null,arguments)},h(gb.moment,c)):gb.moment=db)}for(var db,eb,fb="2.5.1",gb=this,hb=Math.round,ib=0,jb=1,kb=2,lb=3,mb=4,nb=5,ob=6,pb={},qb={_isAMomentObject:null,_i:null,_f:null,_l:null,_strict:null,_isUTC:null,_offset:null,_pf:null,_lang:null},rb="undefined"!=typeof module&&module.exports&&"undefined"!=typeof require,sb=/^\/?Date\((\-?\d+)/i,tb=/(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/,ub=/^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/,vb=/(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,4}|X|zz?|ZZ?|.)/g,wb=/(\[[^\[]*\])|(\\)?(LT|LL?L?L?|l{1,4})/g,xb=/\d\d?/,yb=/\d{1,3}/,zb=/\d{1,4}/,Ab=/[+\-]?\d{1,6}/,Bb=/\d+/,Cb=/[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i,Db=/Z|[\+\-]\d\d:?\d\d/gi,Eb=/T/i,Fb=/[\+\-]?\d+(\.\d{1,3})?/,Gb=/\d/,Hb=/\d\d/,Ib=/\d{3}/,Jb=/\d{4}/,Kb=/[+-]?\d{6}/,Lb=/[+-]?\d+/,Mb=/^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,Nb="YYYY-MM-DDTHH:mm:ssZ",Ob=[["YYYYYY-MM-DD",/[+-]\d{6}-\d{2}-\d{2}/],["YYYY-MM-DD",/\d{4}-\d{2}-\d{2}/],["GGGG-[W]WW-E",/\d{4}-W\d{2}-\d/],["GGGG-[W]WW",/\d{4}-W\d{2}/],["YYYY-DDD",/\d{4}-\d{3}/]],Pb=[["HH:mm:ss.SSSS",/(T| )\d\d:\d\d:\d\d\.\d{1,3}/],["HH:mm:ss",/(T| )\d\d:\d\d:\d\d/],["HH:mm",/(T| )\d\d:\d\d/],["HH",/(T| )\d\d/]],Qb=/([\+\-]|\d\d)/gi,Rb="Date|Hours|Minutes|Seconds|Milliseconds".split("|"),Sb={Milliseconds:1,Seconds:1e3,Minutes:6e4,Hours:36e5,Days:864e5,Months:2592e6,Years:31536e6},Tb={ms:"millisecond",s:"second",m:"minute",h:"hour",d:"day",D:"date",w:"week",W:"isoWeek",M:"month",y:"year",DDD:"dayOfYear",e:"weekday",E:"isoWeekday",gg:"weekYear",GG:"isoWeekYear"},Ub={dayofyear:"dayOfYear",isoweekday:"isoWeekday",isoweek:"isoWeek",weekyear:"weekYear",isoweekyear:"isoWeekYear"},Vb={},Wb="DDD w W M D d".split(" "),Xb="M D H h m s w W".split(" "),Yb={M:function(){return this.month()+1},MMM:function(a){return this.lang().monthsShort(this,a)},MMMM:function(a){return this.lang().months(this,a)},D:function(){return this.date()},DDD:function(){return this.dayOfYear()},d:function(){return this.day()},dd:function(a){return this.lang().weekdaysMin(this,a)},ddd:function(a){return this.lang().weekdaysShort(this,a)},dddd:function(a){return this.lang().weekdays(this,a)},w:function(){return this.week()},W:function(){return this.isoWeek()},YY:function(){return k(this.year()%100,2)},YYYY:function(){return k(this.year(),4)},YYYYY:function(){return k(this.year(),5)},YYYYYY:function(){var a=this.year(),b=a>=0?"+":"-";return b+k(Math.abs(a),6)},gg:function(){return k(this.weekYear()%100,2)},gggg:function(){return k(this.weekYear(),4)},ggggg:function(){return k(this.weekYear(),5)},GG:function(){return k(this.isoWeekYear()%100,2)},GGGG:function(){return k(this.isoWeekYear(),4)},GGGGG:function(){return k(this.isoWeekYear(),5)},e:function(){return this.weekday()},E:function(){return this.isoWeekday()},a:function(){return this.lang().meridiem(this.hours(),this.minutes(),!0)},A:function(){return this.lang().meridiem(this.hours(),this.minutes(),!1)},H:function(){return this.hours()},h:function(){return this.hours()%12||12},m:function(){return this.minutes()},s:function(){return this.seconds()},S:function(){return s(this.milliseconds()/100)},SS:function(){return k(s(this.milliseconds()/10),2)},SSS:function(){return k(this.milliseconds(),3)},SSSS:function(){return k(this.milliseconds(),3)},Z:function(){var a=-this.zone(),b="+";return 0>a&&(a=-a,b="-"),b+k(s(a/60),2)+":"+k(s(a)%60,2)},ZZ:function(){var a=-this.zone(),b="+";return 0>a&&(a=-a,b="-"),b+k(s(a/60),2)+k(s(a)%60,2)},z:function(){return this.zoneAbbr()},zz:function(){return this.zoneName()},X:function(){return this.unix()},Q:function(){return this.quarter()}},Zb=["months","monthsShort","weekdays","weekdaysShort","weekdaysMin"];Wb.length;)eb=Wb.pop(),Yb[eb+"o"]=d(Yb[eb],eb);for(;Xb.length;)eb=Xb.pop(),Yb[eb+eb]=c(Yb[eb],2);for(Yb.DDDD=c(Yb.DDD,3),h(e.prototype,{set:function(a){var b,c;for(c in a)b=a[c],"function"==typeof b?this[c]=b:this["_"+c]=b},_months:"January_February_March_April_May_June_July_August_September_October_November_December".split("_"),months:function(a){return this._months[a.month()]},_monthsShort:"Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),monthsShort:function(a){return this._monthsShort[a.month()]},monthsParse:function(a){var b,c,d;for(this._monthsParse||(this._monthsParse=[]),b=0;12>b;b++)if(this._monthsParse[b]||(c=db.utc([2e3,b]),d="^"+this.months(c,"")+"|^"+this.monthsShort(c,""),this._monthsParse[b]=new RegExp(d.replace(".",""),"i")),this._monthsParse[b].test(a))return b},_weekdays:"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),weekdays:function(a){return this._weekdays[a.day()]},_weekdaysShort:"Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),weekdaysShort:function(a){return this._weekdaysShort[a.day()]},_weekdaysMin:"Su_Mo_Tu_We_Th_Fr_Sa".split("_"),weekdaysMin:function(a){return this._weekdaysMin[a.day()]},weekdaysParse:function(a){var b,c,d;for(this._weekdaysParse||(this._weekdaysParse=[]),b=0;7>b;b++)if(this._weekdaysParse[b]||(c=db([2e3,1]).day(b),d="^"+this.weekdays(c,"")+"|^"+this.weekdaysShort(c,"")+"|^"+this.weekdaysMin(c,""),this._weekdaysParse[b]=new RegExp(d.replace(".",""),"i")),this._weekdaysParse[b].test(a))return b},_longDateFormat:{LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D YYYY",LLL:"MMMM D YYYY LT",LLLL:"dddd, MMMM D YYYY LT"},longDateFormat:function(a){var b=this._longDateFormat[a];return!b&&this._longDateFormat[a.toUpperCase()]&&(b=this._longDateFormat[a.toUpperCase()].replace(/MMMM|MM|DD|dddd/g,function(a){return a.slice(1)}),this._longDateFormat[a]=b),b},isPM:function(a){return"p"===(a+"").toLowerCase().charAt(0)},_meridiemParse:/[ap]\.?m?\.?/i,meridiem:function(a,b,c){return a>11?c?"pm":"PM":c?"am":"AM"},_calendar:{sameDay:"[Today at] LT",nextDay:"[Tomorrow at] LT",nextWeek:"dddd [at] LT",lastDay:"[Yesterday at] LT",lastWeek:"[Last] dddd [at] LT",sameElse:"L"},calendar:function(a,b){var c=this._calendar[a];return"function"==typeof c?c.apply(b):c},_relativeTime:{future:"in %s",past:"%s ago",s:"a few seconds",m:"a minute",mm:"%d minutes",h:"an hour",hh:"%d hours",d:"a day",dd:"%d days",M:"a month",MM:"%d months",y:"a year",yy:"%d years"},relativeTime:function(a,b,c,d){var e=this._relativeTime[c];return"function"==typeof e?e(a,b,c,d):e.replace(/%d/i,a)},pastFuture:function(a,b){var c=this._relativeTime[a>0?"future":"past"];return"function"==typeof c?c(b):c.replace(/%s/i,b)},ordinal:function(a){return this._ordinal.replace("%d",a)},_ordinal:"%d",preparse:function(a){return a},postformat:function(a){return a},week:function(a){return Y(a,this._week.dow,this._week.doy).week},_week:{dow:0,doy:6},_invalidDate:"Invalid date",invalidDate:function(){return this._invalidDate}}),db=function(c,d,e,f){var g;return"boolean"==typeof e&&(f=e,e=a),g={},g._isAMomentObject=!0,g._i=c,g._f=d,g._l=e,g._strict=f,g._isUTC=!1,g._pf=b(),$(g)},db.utc=function(c,d,e,f){var g;return"boolean"==typeof e&&(f=e,e=a),g={},g._isAMomentObject=!0,g._useUTC=!0,g._isUTC=!0,g._l=e,g._i=c,g._f=d,g._strict=f,g._pf=b(),$(g).utc()},db.unix=function(a){return db(1e3*a)},db.duration=function(a,b){var c,d,e,f=a,h=null;return db.isDuration(a)?f={ms:a._milliseconds,d:a._days,M:a._months}:"number"==typeof a?(f={},b?f[b]=a:f.milliseconds=a):(h=tb.exec(a))?(c="-"===h[1]?-1:1,f={y:0,d:s(h[kb])*c,h:s(h[lb])*c,m:s(h[mb])*c,s:s(h[nb])*c,ms:s(h[ob])*c}):(h=ub.exec(a))&&(c="-"===h[1]?-1:1,e=function(a){var b=a&&parseFloat(a.replace(",","."));return(isNaN(b)?0:b)*c},f={y:e(h[2]),M:e(h[3]),d:e(h[4]),h:e(h[5]),m:e(h[6]),s:e(h[7]),w:e(h[8])}),d=new g(f),db.isDuration(a)&&a.hasOwnProperty("_lang")&&(d._lang=a._lang),d},db.version=fb,db.defaultFormat=Nb,db.updateOffset=function(){},db.lang=function(a,b){var c;return a?(b?A(y(a),b):null===b?(B(a),a="en"):pb[a]||C(a),c=db.duration.fn._lang=db.fn._lang=C(a),c._abbr):db.fn._lang._abbr},db.langData=function(a){return a&&a._lang&&a._lang._abbr&&(a=a._lang._abbr),C(a)},db.isMoment=function(a){return a instanceof f||null!=a&&a.hasOwnProperty("_isAMomentObject")},db.isDuration=function(a){return a instanceof g},eb=Zb.length-1;eb>=0;--eb)r(Zb[eb]);for(db.normalizeUnits=function(a){return p(a)},db.invalid=function(a){var b=db.utc(0/0);return null!=a?h(b._pf,a):b._pf.userInvalidated=!0,b},db.parseZone=function(a){return db(a).parseZone()},h(db.fn=f.prototype,{clone:function(){return db(this)},valueOf:function(){return+this._d+6e4*(this._offset||0)},unix:function(){return Math.floor(+this/1e3)},toString:function(){return this.clone().lang("en").format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ")},toDate:function(){return this._offset?new Date(+this):this._d},toISOString:function(){var a=db(this).utc();return 0<a.year()&&a.year()<=9999?F(a,"YYYY-MM-DD[T]HH:mm:ss.SSS[Z]"):F(a,"YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]")},toArray:function(){var a=this;return[a.year(),a.month(),a.date(),a.hours(),a.minutes(),a.seconds(),a.milliseconds()]},isValid:function(){return x(this)},isDSTShifted:function(){return this._a?this.isValid()&&o(this._a,(this._isUTC?db.utc(this._a):db(this._a)).toArray())>0:!1},parsingFlags:function(){return h({},this._pf)},invalidAt:function(){return this._pf.overflow},utc:function(){return this.zone(0)},local:function(){return this.zone(0),this._isUTC=!1,this},format:function(a){var b=F(this,a||db.defaultFormat);return this.lang().postformat(b)},add:function(a,b){var c;return c="string"==typeof a?db.duration(+b,a):db.duration(a,b),l(this,c,1),this},subtract:function(a,b){var c;return c="string"==typeof a?db.duration(+b,a):db.duration(a,b),l(this,c,-1),this},diff:function(a,b,c){var d,e,f=z(a,this),g=6e4*(this.zone()-f.zone());return b=p(b),"year"===b||"month"===b?(d=432e5*(this.daysInMonth()+f.daysInMonth()),e=12*(this.year()-f.year())+(this.month()-f.month()),e+=(this-db(this).startOf("month")-(f-db(f).startOf("month")))/d,e-=6e4*(this.zone()-db(this).startOf("month").zone()-(f.zone()-db(f).startOf("month").zone()))/d,"year"===b&&(e/=12)):(d=this-f,e="second"===b?d/1e3:"minute"===b?d/6e4:"hour"===b?d/36e5:"day"===b?(d-g)/864e5:"week"===b?(d-g)/6048e5:d),c?e:j(e)},from:function(a,b){return db.duration(this.diff(a)).lang(this.lang()._abbr).humanize(!b)},fromNow:function(a){return this.from(db(),a)},calendar:function(){var a=z(db(),this).startOf("day"),b=this.diff(a,"days",!0),c=-6>b?"sameElse":-1>b?"lastWeek":0>b?"lastDay":1>b?"sameDay":2>b?"nextDay":7>b?"nextWeek":"sameElse";return this.format(this.lang().calendar(c,this))},isLeapYear:function(){return v(this.year())},isDST:function(){return this.zone()<this.clone().month(0).zone()||this.zone()<this.clone().month(5).zone()},day:function(a){var b=this._isUTC?this._d.getUTCDay():this._d.getDay();return null!=a?(a=V(a,this.lang()),this.add({d:a-b})):b},month:function(a){var b,c=this._isUTC?"UTC":"";return null!=a?"string"==typeof a&&(a=this.lang().monthsParse(a),"number"!=typeof a)?this:(b=this.date(),this.date(1),this._d["set"+c+"Month"](a),this.date(Math.min(b,this.daysInMonth())),db.updateOffset(this),this):this._d["get"+c+"Month"]()},startOf:function(a){switch(a=p(a)){case"year":this.month(0);case"month":this.date(1);case"week":case"isoWeek":case"day":this.hours(0);case"hour":this.minutes(0);case"minute":this.seconds(0);case"second":this.milliseconds(0)}return"week"===a?this.weekday(0):"isoWeek"===a&&this.isoWeekday(1),this},endOf:function(a){return a=p(a),this.startOf(a).add("isoWeek"===a?"week":a,1).subtract("ms",1)},isAfter:function(a,b){return b="undefined"!=typeof b?b:"millisecond",+this.clone().startOf(b)>+db(a).startOf(b)},isBefore:function(a,b){return b="undefined"!=typeof b?b:"millisecond",+this.clone().startOf(b)<+db(a).startOf(b)},isSame:function(a,b){return b=b||"ms",+this.clone().startOf(b)===+z(a,this).startOf(b)},min:function(a){return a=db.apply(null,arguments),this>a?this:a},max:function(a){return a=db.apply(null,arguments),a>this?this:a},zone:function(a){var b=this._offset||0;return null==a?this._isUTC?b:this._d.getTimezoneOffset():("string"==typeof a&&(a=I(a)),Math.abs(a)<16&&(a=60*a),this._offset=a,this._isUTC=!0,b!==a&&l(this,db.duration(b-a,"m"),1,!0),this)},zoneAbbr:function(){return this._isUTC?"UTC":""},zoneName:function(){return this._isUTC?"Coordinated Universal Time":""},parseZone:function(){return this._tzm?this.zone(this._tzm):"string"==typeof this._i&&this.zone(this._i),this},hasAlignedHourOffset:function(a){return a=a?db(a).zone():0,(this.zone()-a)%60===0},daysInMonth:function(){return t(this.year(),this.month())},dayOfYear:function(a){var b=hb((db(this).startOf("day")-db(this).startOf("year"))/864e5)+1;return null==a?b:this.add("d",a-b)},quarter:function(){return Math.ceil((this.month()+1)/3)},weekYear:function(a){var b=Y(this,this.lang()._week.dow,this.lang()._week.doy).year;return null==a?b:this.add("y",a-b)},isoWeekYear:function(a){var b=Y(this,1,4).year;return null==a?b:this.add("y",a-b)},week:function(a){var b=this.lang().week(this);return null==a?b:this.add("d",7*(a-b))},isoWeek:function(a){var b=Y(this,1,4).week;return null==a?b:this.add("d",7*(a-b))},weekday:function(a){var b=(this.day()+7-this.lang()._week.dow)%7;return null==a?b:this.add("d",a-b)},isoWeekday:function(a){return null==a?this.day()||7:this.day(this.day()%7?a:a-7)},get:function(a){return a=p(a),this[a]()},set:function(a,b){return a=p(a),"function"==typeof this[a]&&this[a](b),this},lang:function(b){return b===a?this._lang:(this._lang=C(b),this)}}),eb=0;eb<Rb.length;eb++)_(Rb[eb].toLowerCase().replace(/s$/,""),Rb[eb]);_("year","FullYear"),db.fn.days=db.fn.day,db.fn.months=db.fn.month,db.fn.weeks=db.fn.week,db.fn.isoWeeks=db.fn.isoWeek,db.fn.toJSON=db.fn.toISOString,h(db.duration.fn=g.prototype,{_bubble:function(){var a,b,c,d,e=this._milliseconds,f=this._days,g=this._months,h=this._data;h.milliseconds=e%1e3,a=j(e/1e3),h.seconds=a%60,b=j(a/60),h.minutes=b%60,c=j(b/60),h.hours=c%24,f+=j(c/24),h.days=f%30,g+=j(f/30),h.months=g%12,d=j(g/12),h.years=d},weeks:function(){return j(this.days()/7)},valueOf:function(){return this._milliseconds+864e5*this._days+this._months%12*2592e6+31536e6*s(this._months/12)},humanize:function(a){var b=+this,c=X(b,!a,this.lang());return a&&(c=this.lang().pastFuture(b,c)),this.lang().postformat(c)},add:function(a,b){var c=db.duration(a,b);return this._milliseconds+=c._milliseconds,this._days+=c._days,this._months+=c._months,this._bubble(),this},subtract:function(a,b){var c=db.duration(a,b);return this._milliseconds-=c._milliseconds,this._days-=c._days,this._months-=c._months,this._bubble(),this},get:function(a){return a=p(a),this[a.toLowerCase()+"s"]()},as:function(a){return a=p(a),this["as"+a.charAt(0).toUpperCase()+a.slice(1)+"s"]()},lang:db.fn.lang,toIsoString:function(){var a=Math.abs(this.years()),b=Math.abs(this.months()),c=Math.abs(this.days()),d=Math.abs(this.hours()),e=Math.abs(this.minutes()),f=Math.abs(this.seconds()+this.milliseconds()/1e3);return this.asSeconds()?(this.asSeconds()<0?"-":"")+"P"+(a?a+"Y":"")+(b?b+"M":"")+(c?c+"D":"")+(d||e||f?"T":"")+(d?d+"H":"")+(e?e+"M":"")+(f?f+"S":""):"P0D"}});for(eb in Sb)Sb.hasOwnProperty(eb)&&(bb(eb,Sb[eb]),ab(eb.toLowerCase()));bb("Weeks",6048e5),db.duration.fn.asMonths=function(){return(+this-31536e6*this.years())/2592e6+12*this.years()},db.lang("en",{ordinal:function(a){var b=a%10,c=1===s(a%100/10)?"th":1===b?"st":2===b?"nd":3===b?"rd":"th";return a+c}}),rb?(module.exports=db,cb(!0)):"function"==typeof define&&define.amd?define("moment",function(b,c,d){return d.config&&d.config()&&d.config().noGlobal!==!0&&cb(d.config().noGlobal===a),db}):cb()}).call(this);
},{}],15:[function(require,module,exports){
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
},{}],16:[function(require,module,exports){
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
},{}],17:[function(require,module,exports){

},{}]},{},[4])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9uYWhpbGFzL1Byb2pla3Rlci9NdXNpY1NlcnZlci9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9uYWhpbGFzL1Byb2pla3Rlci9NdXNpY1NlcnZlci9jbGllbnQvc2NyaXB0cy9hcGkuanMiLCIvaG9tZS9uYWhpbGFzL1Byb2pla3Rlci9NdXNpY1NlcnZlci9jbGllbnQvc2NyaXB0cy9hdWRpb2NvbnRyb2xzLmpzIiwiL2hvbWUvbmFoaWxhcy9Qcm9qZWt0ZXIvTXVzaWNTZXJ2ZXIvY2xpZW50L3NjcmlwdHMvYXVkaW9wbGF5ZXIuanMiLCIvaG9tZS9uYWhpbGFzL1Byb2pla3Rlci9NdXNpY1NlcnZlci9jbGllbnQvc2NyaXB0cy9mYWtlX2Q5MDZkYWRhLmpzIiwiL2hvbWUvbmFoaWxhcy9Qcm9qZWt0ZXIvTXVzaWNTZXJ2ZXIvY2xpZW50L3NjcmlwdHMvbGlicmFyeS5qcyIsIi9ob21lL25haGlsYXMvUHJvamVrdGVyL011c2ljU2VydmVyL2NsaWVudC9zY3JpcHRzL25hdmlnYXRpb24uanMiLCIvaG9tZS9uYWhpbGFzL1Byb2pla3Rlci9NdXNpY1NlcnZlci9jbGllbnQvc2NyaXB0cy9wbGF5bGlzdC5qcyIsIi9ob21lL25haGlsYXMvUHJvamVrdGVyL011c2ljU2VydmVyL2NsaWVudC9zY3JpcHRzL3RlbXBsYXRlcy9uYXZpZ2F0aW9uLWFsYnVtLmpzIiwiL2hvbWUvbmFoaWxhcy9Qcm9qZWt0ZXIvTXVzaWNTZXJ2ZXIvY2xpZW50L3NjcmlwdHMvdGVtcGxhdGVzL25hdmlnYXRpb24tZGVmYXVsdC5qcyIsIi9ob21lL25haGlsYXMvUHJvamVrdGVyL011c2ljU2VydmVyL2NsaWVudC9zY3JpcHRzL3RlbXBsYXRlcy9wbGF5bGlzdC1pdGVtLmpzIiwiL2hvbWUvbmFoaWxhcy9Qcm9qZWt0ZXIvTXVzaWNTZXJ2ZXIvY2xpZW50L3NjcmlwdHMvdXRpbC5qcyIsIi9ob21lL25haGlsYXMvUHJvamVrdGVyL011c2ljU2VydmVyL2NsaWVudC9zY3JpcHRzL3ZlbmRvci9qYWRlcnVudGltZS5qcyIsIi9ob21lL25haGlsYXMvUHJvamVrdGVyL011c2ljU2VydmVyL2NsaWVudC9zY3JpcHRzL3ZlbmRvci9sb2Rhc2gubWluLmpzIiwiL2hvbWUvbmFoaWxhcy9Qcm9qZWt0ZXIvTXVzaWNTZXJ2ZXIvY2xpZW50L3NjcmlwdHMvdmVuZG9yL21vbWVudC5qcyIsIi9ob21lL25haGlsYXMvUHJvamVrdGVyL011c2ljU2VydmVyL2NsaWVudC9zY3JpcHRzL3ZlbmRvci9tb3VzZXRyYXAubWluLmpzIiwiL2hvbWUvbmFoaWxhcy9Qcm9qZWt0ZXIvTXVzaWNTZXJ2ZXIvY2xpZW50L3NjcmlwdHMvdmVuZG9yL3NpZ25hbHMubWluLmpzIiwiL2hvbWUvbmFoaWxhcy9Qcm9qZWt0ZXIvTXVzaWNTZXJ2ZXIvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9saWIvX2VtcHR5LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDak5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkEiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBsaXN0ID0gZnVuY3Rpb24ocGF0aCkgXG57XG5cdGlmKCFwYXRoKVxuXHR7XG5cdFx0cGF0aCA9IFtdO1xuXHR9XG5cblx0cmV0dXJuICQuYWpheCh7XG5cdFx0bWV0aG9kOiAnUE9TVCcsXG5cdFx0dXJsOiAnL2FwaS9saXN0Jyxcblx0XHRjYWNoZTogZmFsc2UsXG5cdFx0Y29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcblx0XHRkYXRhOiBKU09OLnN0cmluZ2lmeSh7IHBhdGg6IHBhdGgsIGV4cGFuZDogcGF0aC5sZW5ndGggPiAwIH0pLFxuXHRcdHByb2Nlc3NEYXRhOiBmYWxzZSxcblx0XHRkYXRhVHlwZTogJ2pzb24nXG5cdH0pO1xufVxuXG52YXIgZGIgPSBmdW5jdGlvbigpXG57XG5cdHJldHVybiAkLmFqYXgoe1xuXHRcdG1ldGhvZDogJ1BPU1QnLFxuXHRcdHVybDogJy9hcGkvZGInLFxuXHRcdGNhY2hlOiBmYWxzZSxcblx0XHRjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxuXHRcdHByb2Nlc3NEYXRhOiBmYWxzZSxcblx0XHRkYXRhVHlwZTogJ2pzb24nXG5cdH0pO1xufVxuXG52YXIgbGlzdHNvbmdzID0gZnVuY3Rpb24ocGF0aClcbntcblx0aWYoIXBhdGgpXG5cdHtcblx0XHRyZXR1cm47XHRcdFxuXHR9XG5cblx0cmV0dXJuICQuYWpheCh7XG5cdFx0bWV0aG9kOiAnUE9TVCcsXG5cdFx0dXJsOiAnL2FwaS9saXN0c29uZ3MnLFxuXHRcdGNhY2hlOiBmYWxzZSxcblx0XHRjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxuXHRcdGRhdGE6IEpTT04uc3RyaW5naWZ5KHsgcGF0aDogcGF0aCB9KSxcblx0XHRwcm9jZXNzRGF0YTogZmFsc2UsXG5cdFx0ZGF0YVR5cGU6ICdqc29uJ1xuXHR9KTtcbn1cblxudmFyIHNvbmcgPSBmdW5jdGlvbihwYXRoKVxue1xuXHRpZighcGF0aClcblx0e1xuXHRcdHJldHVybjtcblx0fVxuXG5cdHJldHVybiAkLmFqYXgoe1xuXHRcdG1ldGhvZDogJ1BPU1QnLFxuXHRcdHVybDogJy9hcGkvc29uZycsXG5cdFx0Y2FjaGU6IGZhbHNlLFxuXHRcdGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXG5cdFx0ZGF0YTogSlNPTi5zdHJpbmdpZnkoeyBwYXRoOiBwYXRoIH0pLFxuXHRcdHByb2Nlc3NEYXRhOiBmYWxzZSxcblx0XHRkYXRhVHlwZTogJ2pzb24nXG5cdH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0bGlzdDogbGlzdCxcblx0bGlzdHNvbmdzOiBsaXN0c29uZ3MsXG5cdHNvbmc6IHNvbmcsXG5cdGRiOiBkYlxufTtcbiIsInZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyksXG5cdGF1ZGlvcGxheWVyID0gcmVxdWlyZSgnLi9hdWRpb3BsYXllci5qcycpLFxuXHRwbGF5bGlzdCA9IHJlcXVpcmUoJy4vcGxheWxpc3QuanMnKSxcblx0JHByb2dyZXNzLCBcblx0JGR1cmF0aW9uLCBcblx0JHBvc2l0aW9uLCBcblx0JHNvbmcsIFxuXHQkYXJ0aXN0LCBcblx0JGFsYnVtLCBcblx0JHBhdXNlLCBcblx0JG5leHQsIFxuXHQkcHJldjtcblxuJChmdW5jdGlvbigpIHtcblx0JHByb2dyZXNzID0gJChcIi5wcm9ncmVzcy1iYXJcIik7XG5cdCRkdXJhdGlvbiA9ICQoXCIjZHVyYXRpb25cIik7XG5cdCRwb3NpdGlvbiA9ICQoXCIjcG9zaXRpb25cIik7XG5cdCRzb25nID0gJChcIiNzb25nXCIpO1xuXHQkYXJ0aXN0ID0gJChcIiNhcnRpc3RcIik7XG5cdCRhbGJ1bSA9ICQoXCIjYWxidW1cIik7XG5cdCRwYXVzZSA9ICQoXCIjcGF1c2VcIik7XG5cdCRuZXh0ID0gJChcIiNuZXh0XCIpO1xuXHQkcHJldiA9ICQoXCIjcHJldlwiKTtcblxuXHRhdWRpb3BsYXllci5wbGF5ZWQuYWRkKG9uUGxheWVkKTtcblx0YXVkaW9wbGF5ZXIudXBkYXRlZC5hZGQob25VcGRhdGVkKTtcblx0YXVkaW9wbGF5ZXIucGF1c2VkLmFkZChvblBhdXNlZCk7XG5cdGF1ZGlvcGxheWVyLnJlc3VtZWQuYWRkKG9uUmVzdW1lZCk7XG5cblx0aG9va3VwRXZlbnRzKCk7XG59KTtcblxuZnVuY3Rpb24gb25QYXVzZWQoKSB7XG5cdCRwYXVzZS5yZW1vdmVDbGFzcygncGxheWluZycpO1xufVxuXG5mdW5jdGlvbiBvblJlc3VtZWQoKVxue1xuXHQkcGF1c2UuYWRkQ2xhc3MoJ3BsYXlpbmcnKTtcbn1cblxuZnVuY3Rpb24gb25QbGF5ZWQoaXRlbSkge1xuXHQkc29uZy5odG1sKGl0ZW0uc29uZyk7XG5cdCRhcnRpc3QuaHRtbChpdGVtLmFydGlzdCk7XG5cdCRhbGJ1bS5odG1sKGl0ZW0uYWxidW0pO1xuXG5cdCRwYXVzZS5hZGRDbGFzcygncGxheWluZycpO1xufTtcblxuZnVuY3Rpb24gb25VcGRhdGVkKGR1cmF0aW9uLCBjdXJyZW50LCBwZXJjZW50KVxue1xuXHQkcHJvZ3Jlc3MuY3NzKFwid2lkdGhcIiwgcGVyY2VudCArIFwiJVwiKTtcblx0JHBvc2l0aW9uLmh0bWwodXRpbC5zZWNvbmRzVG9UaW1lKGN1cnJlbnQpKTtcblx0JGR1cmF0aW9uLmh0bWwodXRpbC5zZWNvbmRzVG9UaW1lKGR1cmF0aW9uKSk7XG59XG5cbmZ1bmN0aW9uIGhvb2t1cEV2ZW50cygpIHtcblx0JHBhdXNlLmNsaWNrKGZ1bmN0aW9uKCkge1xuXHRcdGlmKCFhdWRpb3BsYXllci5pc1BsYXlpbmcoKSlcblx0XHRcdGF1ZGlvcGxheWVyLnBsYXkoKTtcblx0XHRlbHNlXG5cdFx0XHRhdWRpb3BsYXllci5wYXVzZSgpO1xuXHR9KTtcblxuXHQkbmV4dC5jbGljayhmdW5jdGlvbigpIHsgcGxheWxpc3QubmV4dCgpOyB9KTtcblx0JHByZXYuY2xpY2soZnVuY3Rpb24oKSB7IHBsYXlsaXN0LnByZXYoKTsgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge307IiwidmFyICRqUGxheWVyLCBcblx0aXNQbGF5aW5nID0gZmFsc2UsIFxuXHRjdXJyZW50SXRlbSA9IG51bGwsXG5cdHNpZ25hbHMgPSByZXF1aXJlKCcuL3ZlbmRvci9zaWduYWxzLm1pbi5qcycpLFxuXHRhdWRpb3BsYXllciA9IHtcblx0XHRwbGF5ZWQ6IG5ldyBzaWduYWxzLlNpZ25hbCgpLFxuXHRcdHBhdXNlZDogbmV3IHNpZ25hbHMuU2lnbmFsKCksXG5cdFx0cmVzdW1lZDogbmV3IHNpZ25hbHMuU2lnbmFsKCksXG5cdFx0dXBkYXRlZDogbmV3IHNpZ25hbHMuU2lnbmFsKCksXG5cdFx0ZW5kZWQ6IG5ldyBzaWduYWxzLlNpZ25hbCgpLFxuXHRcdHBsYXk6IHBsYXksXG5cdFx0cGF1c2U6IHBhdXNlLFxuXHRcdGlzUGxheWluZzogZnVuY3Rpb24oKSB7IHJldHVybiBpc1BsYXlpbmc7IH1cblx0fTtcblxuJChmdW5jdGlvbigpIHtcblx0JGpQbGF5ZXIgPSAkKFwiI2pQbGF5ZXJcIik7XG5cdFxuXHQkalBsYXllci5qUGxheWVyKHsgXG5cdFx0c3VwcGxpZWQ6ICdtcDMnLFxuXHRcdHRpbWV1cGRhdGU6IHVwZGF0ZWQsXG5cdFx0ZW5kZWQ6IGZ1bmN0aW9uKCkge1xuXHRcdFx0cGxheWluZyA9IGZhbHNlO1xuXHRcdFx0YXVkaXBsYXllci5lbmRlZC5kaXNwYXRjaCgpO1xuXHRcdH1cblx0fSk7XG59KTtcblxuZnVuY3Rpb24gdXBkYXRlZChlKSB7XG5cdHZhciBkdXJhdGlvbiA9IGUualBsYXllci5zdGF0dXMuZHVyYXRpb24gPT09IDAgPyBjdXJyZW50SXRlbS5kdXJhdGlvbiA6IGUualBsYXllci5zdGF0dXMuZHVyYXRpb247XG5cdHZhciBjdXJyZW50ID0gZS5qUGxheWVyLnN0YXR1cy5jdXJyZW50VGltZTtcblx0dmFyIHBlcmNlbnQgPSAoY3VycmVudCAvIGR1cmF0aW9uKSAqIDEwMDtcblxuXHRhdWRpb3BsYXllci51cGRhdGVkLmRpc3BhdGNoKGR1cmF0aW9uLCBjdXJyZW50LCBwZXJjZW50KTtcbn1cblxuZnVuY3Rpb24gcGxheShpdGVtKVxue1xuXHRpZihpdGVtKSB7XG5cdFx0aXNQbGF5aW5nID0gdHJ1ZTtcblx0XHRjdXJyZW50SXRlbSA9IGl0ZW07XG5cdFx0JGpQbGF5ZXIualBsYXllcihcInNldE1lZGlhXCIsIHtcblx0XHRcdG1wMzogaXRlbS5zdHJlYW1cblx0XHR9KTtcblxuXHRcdCRqUGxheWVyLmpQbGF5ZXIoXCJwbGF5XCIpO1xuXHRcdGF1ZGlvcGxheWVyLnBsYXllZC5kaXNwYXRjaChpdGVtKTtcblx0fVxuXHRlbHNlIGlmKGN1cnJlbnRJdGVtKVxuXHR7XG5cdFx0aXNQbGF5aW5nID0gdHJ1ZTtcblx0XHRhdWRpb3BsYXllci5yZXN1bWVkLmRpc3BhdGNoKGl0ZW0pO1xuXHRcdCRqUGxheWVyLmpQbGF5ZXIoXCJwbGF5XCIpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHBhdXNlKClcbntcblx0aXNQbGF5aW5nID0gZmFsc2U7XG5cdCRqUGxheWVyLmpQbGF5ZXIoXCJwYXVzZVwiKTtcblx0YXVkaW9wbGF5ZXIucGF1c2VkLmRpc3BhdGNoKCk7XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBhdWRpb3BsYXllcjsiLCJ2YXIgbmF2aWdhdGlvbiA9IHJlcXVpcmUoJy4vbmF2aWdhdGlvbi5qcycpO1xudmFyIGF1ZGlvY29udHJvbHMgPSByZXF1aXJlKCcuL2F1ZGlvY29udHJvbHMuanMnKTtcblxuJChmdW5jdGlvbigpIHtcblx0bmF2aWdhdGlvbi5pbml0aWFsaXplKCk7XG59KTtcblxuIiwiXG52YXIgZGF0YWJhc2UsXG5cdF8gPSByZXF1aXJlKCcuL3ZlbmRvci9sb2Rhc2gubWluLmpzJyk7XG5cdGFwaSA9IHJlcXVpcmUoJy4vYXBpLmpzJyk7XG5cblx0ZnVuY3Rpb24gaW5pdGlhbGl6ZSgpIHtcblx0XHR2YXIgZGVmZXJyZWQgPSAkLkRlZmVycmVkKCk7XG5cblx0XHRhcGkuZGIoKS5kb25lKGZ1bmN0aW9uKGRiKSB7XG5cdFx0XHRkYXRhYmFzZSA9IHtpdGVtczogZGJ9O1xuXHRcdFx0ZGVmZXJyZWQucmVzb2x2ZSgpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2UoKTtcblx0fVxuXG5cblx0ZnVuY3Rpb24gZ2V0KHBhdGgpXG5cdHtcblx0XHRpZighcGF0aCB8fCBwYXRoLmxlbmd0aCA9PT0gMClcblx0XHRcdHJldHVybiBkYXRhYmFzZTtcblx0XHRcblx0XHR2YXIgaXRlbSA9IGRhdGFiYXNlOyBcblx0XHRfLmVhY2gocGF0aCwgZnVuY3Rpb24oeCkge1xuXHRcdFx0aXRlbSA9IF8uZmluZChpdGVtLml0ZW1zLCBmdW5jdGlvbih5KSB7IHJldHVybiB5Lm5hbWUgPT09IHg7IH0pO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIGl0ZW07XG5cdH1cblxuXHQvL0FydGlzdCBhbmQgYWxidW0gY2FuIGJlIGV4dHJhcG9sYXRlZCBmcm9tIHBhdGguXG5cdGZ1bmN0aW9uIHNldFNvbmdJbmZvKGl0ZW0sIHBhdGgpIHtcblx0XHRpZihwYXRoLmxlbmd0aCA8IDIpXG5cdFx0e1xuXHRcdFx0aWYoIWl0ZW0uc29uZylcblx0XHRcdFx0aXRlbS5zb25nID0gaXRlbS5uYW1lO1xuXHRcdFx0aXRlbS5hbGJ1bSA9ICdOQSc7XG5cdFx0XHRpdGVtLmFydGlzdCA9ICdOQSc7XG5cdFx0fVxuXHRcdGlmKHBhdGgubGVuZ3RoID09PSAyKVxuXHRcdHtcblx0XHRcdGl0ZW0uYXJ0aXN0ID0gcGF0aFswXTtcblx0XHRcdGl0ZW0uYWxidW0gPSBwYXRoWzFdO1xuXHRcdFx0aWYoIWl0ZW0uc29uZylcblx0XHRcdFx0aXRlbS5zb25nID0gaXRlbS5uYW1lO1xuXHRcdH0gXG5cdFx0aWYocGF0aC5sZW5ndGggPj0gMylcblx0XHR7XG5cdFx0XHRpdGVtLmFydGlzdCA9IHBhdGhbMF07XG5cdFx0XHRpdGVtLmFsYnVtID0gcGF0aFsxXTtcblx0XHRcdFxuXHRcdFx0aWYoIWl0ZW0uc29uZylcblx0XHRcdFx0aXRlbS5zb25nID0gaXRlbS5uYW1lO1xuXHRcdFx0XG5cdFx0XHRmb3IodmFyIGkgPSAyOyBpIDwgcGF0aC5sZW5ndGg7IGkrKylcblx0XHRcdHtcblx0XHRcdFx0aXRlbS5hbGJ1bSArPSAnIC0gJyArIHBhdGhbaV07XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dmFyIHN0ciA9ICcnO1xuXHRcdF8uZWFjaChwYXRoLCBmdW5jdGlvbih4KSB7XG5cdFx0XHRzdHIgKz0geCArICcvJ1xuXHRcdH0pO1xuXHRcdHN0ciArPSBpdGVtLm5hbWU7XG5cdFx0aXRlbS5zdHJlYW0gPSAnL2FwaS9zdHJlYW0/cGF0aD0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHN0cik7XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRTb25ncyhwYXRoKVxuXHR7XG5cdFx0dmFyIHNvbmdzID0gW107XG5cblx0XHR2YXIgZ2V0U29uZ3NSZWN1cnNpdmUgPSBmdW5jdGlvbihpdGVtLCBjdXJyUGF0aCkge1xuXHRcdFx0aWYoaXRlbS5pc0ZpbGUpXG5cdFx0XHR7XG5cdFx0XHRcdGN1cnJQYXRoLnBvcCgpO1xuXHRcdFx0XHRzZXRTb25nSW5mbyhpdGVtLCBjdXJyUGF0aCk7XG5cdFx0XHRcdHNvbmdzLnB1c2goaXRlbSlcblxuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdF8uZWFjaChpdGVtLml0ZW1zLCBmdW5jdGlvbih4KSB7XG5cdFx0XHRcdGlmKHguaXNGaWxlKSB7XG5cdFx0XHRcdFx0c2V0U29uZ0luZm8oeCwgY3VyclBhdGgpO1xuXHRcdFx0XHRcdHNvbmdzLnB1c2goeCk7XG5cdFx0XHRcdH0gXG5cdFx0XHRcdGVsc2UgXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRuZXh0UGF0aCA9IGN1cnJQYXRoLnNsaWNlKDApO1xuXHRcdFx0XHRcdG5leHRQYXRoLnB1c2goeC5uYW1lKVxuXHRcdFx0XHRcdGdldFNvbmdzUmVjdXJzaXZlKHgsIG5leHRQYXRoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Z2V0U29uZ3NSZWN1cnNpdmUoZ2V0KHBhdGgpLCBwYXRoLnNsaWNlKDApKTtcblxuXHRcdGlmKHNvbmdzLmxlbmd0aCA+IDApIHtcblx0XHRcdHZhciBncm91cGVkID0gW107XG5cdFx0XHRfLmVhY2goXy5ncm91cEJ5KHNvbmdzLCAnYWxidW0nKSwgZnVuY3Rpb24oeCwgcCkgeyBncm91cGVkLnB1c2goXy5zb3J0QnkoeCwgJ3RyYWNrJykpIH0pO1xuXG5cblxuXHRcdFx0dmFyIGFsYnVtID0gZ3JvdXBlZC5wb3AoKTtcblx0XHRcdHZhciBzb25ncyA9IF8uc29ydEJ5KGFsYnVtLmNvbmNhdC5hcHBseShhbGJ1bSwgZ3JvdXBlZCksICdhbGJ1bScpO1xuXHRcdH1cblxuXHRcdHJldHVybiBzb25ncztcblx0fVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0aW5pdGlhbGl6ZTogaW5pdGlhbGl6ZSxcblx0Z2V0OiBnZXQsXG5cdGdldFNvbmdzOiBnZXRTb25nc1xufTtcbiIsInZhciBhcGkgPSByZXF1aXJlKCcuL2FwaS5qcycpO1xudmFyIHBsYXlsaXN0ID0gcmVxdWlyZSgnLi9wbGF5bGlzdC5qcycpO1xudmFyIGxpYnJhcnkgPSByZXF1aXJlKCcuL2xpYnJhcnkuanMnKTtcbnZhciBfID0gcmVxdWlyZSgnLi92ZW5kb3IvbG9kYXNoLm1pbi5qcycpO1xudmFyIHRlbXBsYXRlcyA9IHtcblx0aXRlbURlZmF1bHQ6IHJlcXVpcmUoJy4vdGVtcGxhdGVzL25hdmlnYXRpb24tZGVmYXVsdC5qcycpLFxuXHRpdGVtQWxidW06IHJlcXVpcmUoJy4vdGVtcGxhdGVzL25hdmlnYXRpb24tYWxidW0uanMnKVxufTtcblxudmFyICRsaXN0LCAkdXAsIGN1cnJlbnRQYXRoID0gW10sIG91dGVyU2Nyb2xsID0gMDtcbiQoZnVuY3Rpb24oKSB7XG5cdCRsaXN0ID0gJChcIiNsaXN0XCIpO1xuXHQkdXAgPSAkKFwiI3VwXCIpO1xuXHQkYXJ0aXN0ID0gJChcIiNhcnRpc3RcIik7XG5cblx0JGxpc3Qub24oJ2NsaWNrJywgJ2xpJywgZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHBhdGggPSAkKHRoaXMpLmRhdGEoJ3BhdGgnKTtcblxuXHRcdGlmKHBhdGgubGVuZ3RoID09PSAxKVxuXHRcdFx0bmF2aWdhdGUocGF0aCk7XG5cdH0pO1xuXG5cdCRsaXN0Lm9uKCdkYmxjbGljaycsICdsaScsIGZ1bmN0aW9uKCkge1xuXHRcdHZhciBwYXRoID0gJCh0aGlzKS5kYXRhKCdwYXRoJyk7XG5cblx0XHRpZihwYXRoLmxlbmd0aCAhPT0gMSlcblx0XHRcdHBsYXkocGF0aCk7XG5cdH0pO1xuXG5cdCRsaXN0Lm9uKCdjbGljaycsICcuYWRkJywgZnVuY3Rpb24oZSkge1xuXHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0YWRkKCQodGhpcykucGFyZW50cygnbGknKS5kYXRhKCdwYXRoJykpO1xuXHR9KTtcblxuXHQkbGlzdC5vbignY2xpY2snLCAnLnBsYXknLCBmdW5jdGlvbihlKSB7XG5cdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRwbGF5KCQodGhpcykucGFyZW50cygnbGknKS5kYXRhKCdwYXRoJykpO1xuXHR9KTtcblxuXHQkdXAuY2xpY2sodXApO1xufSk7XG5cbmZ1bmN0aW9uIGFkZChwYXRoLCBiZWZvcmUpXG57XG5cdHBsYXlsaXN0LmFkZFNvbmdzKGxpYnJhcnkuZ2V0U29uZ3MocGF0aCksIGJlZm9yZSk7XG59XG5cbmZ1bmN0aW9uIHBsYXkocGF0aClcbntcblx0cGxheWxpc3QucGxheVNvbmdzKGxpYnJhcnkuZ2V0U29uZ3MocGF0aCkpO1xufVxuXG5mdW5jdGlvbiBpdGVtRHJhZ1N0YXJ0KGUpXG57XG5cdGUuZGF0YVRyYW5zZmVyLnNldERhdGEoXCJpdGVtXCIsIEpTT04uc3RyaW5naWZ5KCQoZS5zcmNFbGVtZW50KS5kYXRhKCdpdGVtJykpKTtcdFx0XG59XG5cblxuZnVuY3Rpb24gdXAoKSB7XG5cdGlmKGN1cnJlbnRQYXRoLmxlbmd0aCA9PT0gMClcblx0XHRyZXR1cm47XG5cblx0Y3VycmVudFBhdGgucG9wKCk7XG5cblx0aWYoY3VycmVudFBhdGgubGVuZ3RoID09PSAwKVxuXHRcdCR1cC5hZGRDbGFzcygnaGlkZScpO1xuXG5cblx0cG9wdWxhdGVMaXN0KGN1cnJlbnRQYXRoKTtcbn1cblxuZnVuY3Rpb24gbmF2aWdhdGUocGF0aClcbntcblx0JHVwLnJlbW92ZUNsYXNzKCdoaWRlJyk7XG5cdHBvcHVsYXRlTGlzdChwYXRoKTtcbn1cblxuZnVuY3Rpb24gc2V0QnJlYWRjcnVtYigpIHtcblx0dmFyIHN0ciA9IFwiXCI7XG5cdCQuZWFjaChjdXJyZW50UGF0aCwgZnVuY3Rpb24oaSx4KSB7IHN0ciArPSB4ICsgXCIvXCI7IH0pO1xuXHQkYnJlYWRjcnVtYi5odG1sKHN0ci5zdWJzdHJpbmcoMCwgc3RyLmxlbmd0aCAtIDEpKTtcbn1cblxuXG5mdW5jdGlvbiByZW5kZXJEZWZhdWx0KGl0ZW0sIHBhdGgpXG57XG5cdCQuZWFjaChfLnNvcnRCeShpdGVtLml0ZW1zLCAnbmFtZScpLCBmdW5jdGlvbihpLHgpIHtcblx0XHR2YXIgbGkgPSAkKHRlbXBsYXRlcy5pdGVtRGVmYXVsdCh4KSk7XG5cdFx0JGxpc3QuYXBwZW5kKGxpKTtcblxuXHRcdHZhciBpdGVtUGF0aCA9IHBhdGguc2xpY2UoMCk7XG5cdFx0aXRlbVBhdGgucHVzaCh4Lm5hbWUpO1xuXHRcdCQobGkpLmRhdGEoJ3BhdGgnLCBpdGVtUGF0aCk7XG5cblx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBsaS5hZGRDbGFzcygnZW50ZXInKTsgfSwgMTApO1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyQXJ0aXN0KGl0ZW0sIHBhdGgpXG57XG5cdF8uZWFjaChpdGVtLml0ZW1zLCBmdW5jdGlvbih4KSBcblx0e1xuXHRcdHZhciBjb3ZlciA9IF8uZmluZCh4LmltYWdlcywgZnVuY3Rpb24oeSkgeyByZXR1cm4geS5zaXplID09PSAnbGFyZ2UnOyB9KTtcblx0XHR4LmNvdmVyID0gY292ZXIgPyBjb3ZlclsnI3RleHQnXSA6IG51bGw7XG5cblx0XHR2YXIgYWxidW0gPSAkKHRlbXBsYXRlcy5pdGVtQWxidW0oeCkpO1xuXHRcdCRsaXN0LmFwcGVuZChhbGJ1bSlcblxuXHRcdHZhciBhbGJ1bVBhdGggPSBwYXRoLnNsaWNlKDApO1xuXHRcdGFsYnVtUGF0aC5wdXNoKHgubmFtZSk7XG5cdFx0YWxidW0uZGF0YSgncGF0aCcsIGFsYnVtUGF0aCk7XG5cblx0XHRyZW5kZXJEZWZhdWx0KHgsIGFsYnVtUGF0aC5zbGljZSgwKSk7XG5cblx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBhbGJ1bS5maW5kKCcucm93JykuYWRkQ2xhc3MoJ2VudGVyJyk7IH0sIDEwKTtcblx0fSk7XG59XG5cblxuZnVuY3Rpb24gcG9wdWxhdGVMaXN0KHBhdGgpXG57XG5cdCRsaXN0Lmh0bWwoJycpO1xuXG5cdHBhdGggPSBwYXRoIHx8IFtdO1xuXHRjdXJyZW50UGF0aCA9IHBhdGg7XG5cblx0JGFydGlzdC5odG1sKHBhdGgubGVuZ3RoID09PSAwID8gJ0xpYnJhcnknIDogcGF0aFswXSlcblx0JGxpc3Quc2Nyb2xsVG9wKDApO1xuXG5cdGlmKGN1cnJlbnRQYXRoLmxlbmd0aCA9PT0gMSlcblx0XHRyZW5kZXJBcnRpc3QobGlicmFyeS5nZXQoY3VycmVudFBhdGgpLCBjdXJyZW50UGF0aC5zbGljZSgwKSk7XG5cdGVsc2Vcblx0XHRyZW5kZXJEZWZhdWx0KGxpYnJhcnkuZ2V0KGN1cnJlbnRQYXRoKSwgY3VycmVudFBhdGguc2xpY2UoMCkpO1xufVxuXG5mdW5jdGlvbiBpbml0aWFsaXplKCkge1xuXHRsaWJyYXJ5LmluaXRpYWxpemUoKS50aGVuKHBvcHVsYXRlTGlzdCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRpdGVtRHJhZ1N0YXJ0OiBpdGVtRHJhZ1N0YXJ0LFxuXHRhZGQ6IGFkZCxcblx0cG9wdWxhdGU6IHBvcHVsYXRlTGlzdCxcblx0aW5pdGlhbGl6ZTogaW5pdGlhbGl6ZVxufSIsInZhciBhdWRpb3BsYXllciA9IHJlcXVpcmUoJy4vYXVkaW9wbGF5ZXIuanMnKSxcblx0YXBpID0gcmVxdWlyZSgnLi9hcGkuanMnKSxcblx0dXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpLFxuXHRtb3VzZXRyYXAgPSByZXF1aXJlKCcuL3ZlbmRvci9tb3VzZXRyYXAubWluLmpzJyksXG5cdGN1cnJlbnRTb25ncyA9IFtdLFxuXHRjdXJyZW50SW5kZXggPSBudWxsLFxuXHRkcm9wSW5kZXggPSBudWxsLFxuXHQkcGxheWxpc3QsIFxuXHRjdXJyZW50RHJhZyxcblx0c2VsZWN0ZWRSb3dzID0gW10sXG5cdF8gPSByZXF1aXJlKCcuL3ZlbmRvci9sb2Rhc2gubWluLmpzJyksXG5cdHRlbXBsYXRlcyA9IHtcblx0XHRpdGVtOiByZXF1aXJlKCcuL3RlbXBsYXRlcy9wbGF5bGlzdC1pdGVtLmpzJylcblx0fTtcblxuJChmdW5jdGlvbigpIHtcblx0JHBsYXlsaXN0ID0gJChcIiNwbGF5bGlzdCB0YWJsZSB0Ym9keVwiKTtcblxuXHQkcGxheWxpc3Qub24oJ2RibGNsaWNrJywgJy5pdGVtJywgZnVuY3Rpb24oZSkge1xuXHRcdHZhciBjdXJyID0gdGhpcztcblxuXHRcdCRwbGF5bGlzdC5maW5kKCcuaXRlbScpLmVhY2goZnVuY3Rpb24oaSx4KSB7XG5cdFx0XHRpZih4ID09PSBjdXJyKVxuXHRcdFx0e1xuXHRcdFx0XHRjdXJyZW50SW5kZXggPSBpO1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRwbGF5KCk7XG5cdH0pO1xuXG5cdCRwbGF5bGlzdC5vbignY2xpY2snLCAnLml0ZW0nLCBmdW5jdGlvbihlKSB7XG5cdFx0aWYoZS5jdHJsS2V5KVxuXHRcdHtcblx0XHRcdGN0cmxTZWxlY3QuY2FsbCh0aGlzKTtcblx0XHR9XG5cdFx0ZWxzZSBpZihlLnNoaWZ0S2V5KVxuXHRcdHtcblx0XHRcdHNoaWZ0U2VsZWN0LmNhbGwodGhpcyk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0c2VsZWN0KFsgdGhpcyBdKTtcblx0XHR9XG5cdH0pO1xuXG5cdG1vdXNldHJhcC5iaW5kKCdkZWwnLCBkZWxldGVTZWxlY3RlZCk7XG5cblx0JCgnI3BsYXlsaXN0IHRhYmxlJykuc29ydGFibGUoe1xuXHRcdGNvbnRhaW5lclNlbGVjdG9yOiAndGFibGUnLFxuXHRcdGl0ZW1QYXRoOiAnPiB0Ym9keScsXG5cdFx0aXRlbVNlbGVjdG9yOiAndHInLFxuXHRcdHBsYWNlaG9sZGVyOiAnPHRyIGNsYXNzPVwicGxhY2Vob2xkZXJcIi8+Jyxcblx0XHRvbkRyb3A6IGZ1bmN0aW9uKCRpdGVtLCBjb250YWluZXIsIF9zdXBlcilcblx0XHR7XG5cdFx0XHR2YXIgbmV3T3JkZXIgPSBbXTtcblxuXHRcdFx0JHBsYXlsaXN0LmZpbmQoJy5pdGVtJykuZWFjaChmdW5jdGlvbihpLHgpIFxuXHRcdFx0e1xuXHRcdFx0XHRuZXdPcmRlci5wdXNoKF8uZmluZChjdXJyZW50U29uZ3MsIGZ1bmN0aW9uKHkpIHtcblx0XHRcdFx0XHRyZXR1cm4geS5zdHJlYW0gPT09ICQoeCkuZGF0YSgnc3RyZWFtJyk7XG5cdFx0XHRcdH0pKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRjdXJyZW50U29uZ3MgPSBuZXdPcmRlcjtcblx0XHRcdF9zdXBlcigkaXRlbSk7XG5cdFx0fVxuXHR9KTtcbn0pO1xuXG5cblxuZnVuY3Rpb24gZGVsZXRlU2VsZWN0ZWQoKSBcbntcblx0Zm9yKHZhciBpID0gMDsgaSA8IGN1cnJlbnRTb25ncy5sZW5ndGg7IGkrKylcblx0e1xuXHRcdGlmKF8uZmluZChzZWxlY3RlZFJvd3MsIGZ1bmN0aW9uKHgpIHsgcmV0dXJuIGN1cnJlbnRTb25nc1tpXS5zdHJlYW0gPT09ICQoeCkuZGF0YSgnc3RyZWFtJyk7IH0pKSB7XG5cdFx0XHRjdXJyZW50U29uZ3Muc3BsaWNlKGksIDEpO1xuXHRcdFx0aS0tO1xuXHRcdH1cblx0fVxuXG5cdGN1cnJlbnRJbmRleCA9IDA7XG5cdHJlbmRlcigpO1xufVxuXG5mdW5jdGlvbiBzaGlmdFNlbGVjdCgpIHtcblx0aWYoc2VsZWN0ZWRSb3dzLmxlbmd0aCA9PT0gMClcdFxuXHRcdHJldHVybjtcblxuXHR2YXIgaXRlbXMgPSAkcGxheWxpc3QuZmluZCgnLml0ZW0nKTtcblx0dmFyIHN0YXJ0SW5kZXggPSAwO1xuXHR2YXIgZW5kSW5kZXggPSAwO1xuXHR2YXIgY3VyciA9IHRoaXM7XG5cblx0aXRlbXMuZWFjaChmdW5jdGlvbihpLHgpIFxuXHR7XG5cdFx0aWYoeCA9PT0gc2VsZWN0ZWRSb3dzWzBdKVxuXHRcdFx0c3RhcnRJbmRleCA9IGk7XG5cblx0XHRpZih4ID09PSBjdXJyKVxuXHRcdFx0ZW5kSW5kZXggPSBpO1xuXHR9KTtcblxuXHRpZihzdGFydEluZGV4ID4gZW5kSW5kZXgpXG5cdHtcblx0XHR2YXIgbiA9IGVuZEluZGV4O1xuXHRcdGVuZEluZGV4ID0gc3RhcnRJbmRleDtcblx0XHRzdGFydEluZGV4ID0gbjtcblx0fVxuXG5cdHNlbGVjdGVkUm93cyA9IGl0ZW1zLnNsaWNlKHN0YXJ0SW5kZXgsIGVuZEluZGV4ICsgMSk7XG5cdHNlbGVjdChzZWxlY3RlZFJvd3MpO1xufVxuXG5mdW5jdGlvbiBjdHJsU2VsZWN0KCkge1xuXHRpZighXy5jb250YWlucyhzZWxlY3RlZFJvd3MsIHRoaXMpKVxuXHR7XG5cdFx0c2VsZWN0ZWRSb3dzLnB1c2godGhpcyk7XG5cdFx0c2VsZWN0KHNlbGVjdGVkUm93cyk7XG5cdH1cdFxufVxuXG5mdW5jdGlvbiBhZGRTb25ncyhzb25ncywgYmVmb3JlKVxue1xuXHRpZighYmVmb3JlKVxuXHRcdGN1cnJlbnRTb25ncyA9IGN1cnJlbnRTb25ncy5jb25jYXQoc29uZ3MpO1xuXHRlbHNlIHtcblx0XHR2YXIgYWZ0ZXIgPSBjdXJyZW50U29uZ3Muc3BsaWNlKGJlZm9yZSwgY3VycmVudFNvbmdzLmxlbmd0aCk7XG5cdFx0Y3VycmVudFNvbmdzID0gY3VycmVudFNvbmdzLmNvbmNhdChzb25ncywgYWZ0ZXIpO1xuXHR9XG5cblx0cmVuZGVyKCk7XG59XG5cbmZ1bmN0aW9uIHNlbGVjdChyb3dzKVxue1xuXHRzZWxlY3RlZFJvd3MgPSByb3dzO1xuXG5cdCRwbGF5bGlzdC5maW5kKCcuaXRlbScpLnJlbW92ZUNsYXNzKCdpbmZvJyk7XG5cblx0Xy5lYWNoKHJvd3MsIGZ1bmN0aW9uKHgpIHtcblx0XHQkKHgpLmFkZENsYXNzKCdpbmZvJylcblx0fSk7XG59XG5cbmZ1bmN0aW9uIHBsYXlTb25ncyhzb25ncylcbntcblx0Y3VycmVudFNvbmdzID0gW107XG5cblx0YWRkU29uZ3Moc29uZ3MpO1xuXHRjdXJyZW50SW5kZXggPSAwOyBcblx0cGxheSgpOyBcbn1cblxuZnVuY3Rpb24gcGxheSgpIHtcblx0aWYoY3VycmVudFNvbmdzLmxlbmd0aCA9PT0gMClcblx0XHRyZXR1cm47XG5cblx0aWYoIWN1cnJlbnRJbmRleCB8fCBjdXJyZW50SW5kZXggPj0gY3VycmVudFNvbmdzLmxlbmd0aClcblx0XHRjdXJyZW50SW5kZXggPSAwO1xuXG5cdHZhciBzb25nID0gY3VycmVudFNvbmdzW2N1cnJlbnRJbmRleF07XG5cdGF1ZGlvcGxheWVyLnBsYXkoc29uZyk7XG5cdFxuXHQkcGxheWxpc3QuZmluZCgnc3Bhbi5wbGF5aW5nJykuYWRkQ2xhc3MoJ2hpZGUnKTtcblx0JHBsYXlsaXN0LmZpbmQoJy5pdGVtJykuZWFjaChmdW5jdGlvbihpLHgpIHtcblxuXHRcdGlmKCQoeCkuZGF0YSgnc3RyZWFtJykgPT09IHNvbmcuc3RyZWFtKVxuXHRcdHtcblx0XHRcdCQoeCkuZmluZCgnLnBsYXlpbmcnKS5yZW1vdmVDbGFzcygnaGlkZScpO1xuXHRcdH1cblx0fSk7XG59XG5cbmZ1bmN0aW9uIG5leHQoKSB7XG5cdGN1cnJlbnRJbmRleCsrO1xuXHRwbGF5KCk7XG59XG5cbmZ1bmN0aW9uIHByZXYoKSB7XG5cdGlmKGN1cnJlbnRJbmRleCA9PT0gMClcblx0XHRyZXR1cm47XG5cblx0Y3VycmVudEluZGV4LS07XG5cdHBsYXkoKTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyKCkge1xuXHQkcGxheWxpc3QuaHRtbCgnJyk7XG5cdCQuZWFjaChjdXJyZW50U29uZ3MsIGZ1bmN0aW9uKGkseCkge1xuXHRcdHZhciByb3cgPSAkKHRlbXBsYXRlcy5pdGVtKHtcblx0XHRcdHN0cmVhbTogeC5zdHJlYW0sXG5cdFx0XHRzb25nOiB4LnNvbmcsXG5cdFx0XHRhcnRpc3Q6IHguYXJ0aXN0LFxuXHRcdFx0YWxidW06IHguYWxidW0sXG5cdFx0XHRkdXJhdGlvbjogdXRpbC5zZWNvbmRzVG9UaW1lKHguZHVyYXRpb24pXG5cdFx0fSkpO1xuXG5cdFx0JHBsYXlsaXN0LmFwcGVuZChyb3cpO1xuXHRcdHJvdy5kYXRhKCdpdGVtJywgeCk7XG5cdH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0YWRkU29uZ3M6IGFkZFNvbmdzLFxuXHRwcmV2OiBwcmV2LFxuXHRuZXh0OiBuZXh0LFxuXHRwbGF5U29uZ3M6IHBsYXlTb25nc1xufSIsImphZGUgPSByZXF1aXJlKFwiLi8uLi92ZW5kb3IvamFkZXJ1bnRpbWUuanNcIik7ZnVuY3Rpb24gdGVtcGxhdGUobG9jYWxzKSB7XG52YXIgYnVmID0gW107XG52YXIgamFkZV9taXhpbnMgPSB7fTtcbnZhciBsb2NhbHNfID0gKGxvY2FscyB8fCB7fSksY292ZXIgPSBsb2NhbHNfLmNvdmVyLG5hbWUgPSBsb2NhbHNfLm5hbWUsaXRlbXMgPSBsb2NhbHNfLml0ZW1zO1xuYnVmLnB1c2goXCI8bGkgY2xhc3M9XFxcImFsYnVtXFxcIj48ZGl2IGNsYXNzPVxcXCJyb3dcXFwiPjxkaXYgY2xhc3M9XFxcImNvbC14cy00IGNvdmVyXFxcIj48aW1nXCIgKyAoamFkZS5hdHRyKFwic3JjXCIsIChjb3ZlciB8fCAnL2ltYWdlcy9uby1jb3Zlci5wbmcnKSwgdHJ1ZSwgZmFsc2UpKSArIFwiLz48L2Rpdj48ZGl2IGNsYXNzPVxcXCJjb2wteHMtOCBpbmZvXFxcIj48aDM+XCIgKyAoamFkZS5lc2NhcGUobnVsbCA9PSAoamFkZS5pbnRlcnAgPSBuYW1lKSA/IFwiXCIgOiBqYWRlLmludGVycCkpICsgXCI8L2gzPjxoNT4yMDA3PC9oNT48aDU+XCIgKyAoamFkZS5lc2NhcGUobnVsbCA9PSAoamFkZS5pbnRlcnAgPSAoaXRlbXMubGVuZ3RoICsgXCIgc29uZ3NcIikpID8gXCJcIiA6IGphZGUuaW50ZXJwKSkgKyBcIjwvaDU+PGRpdiBjbGFzcz1cXFwiYnRuLWdyb3VwXFxcIj48YnV0dG9uIGNsYXNzPVxcXCJidG4gYnRuLWRlZmF1bHQgcGxheVxcXCI+PHNwYW4gY2xhc3M9XFxcImdseXBoaWNvbiBnbHlwaGljb24tcGxheVxcXCI+PC9zcGFuPjwvYnV0dG9uPjxidXR0b24gY2xhc3M9XFxcImJ0biBidG4tZGVmYXVsdCBhZGRcXFwiPjxzcGFuIGNsYXNzPVxcXCJnbHlwaGljb24gZ2x5cGhpY29uLWxvZy1pblxcXCI+PC9zcGFuPjwvYnV0dG9uPjwvZGl2PjwvZGl2PjwvZGl2PjwvbGk+XCIpOztyZXR1cm4gYnVmLmpvaW4oXCJcIik7XG59bW9kdWxlLmV4cG9ydHMgPSB0ZW1wbGF0ZTsiLCJqYWRlID0gcmVxdWlyZShcIi4vLi4vdmVuZG9yL2phZGVydW50aW1lLmpzXCIpO2Z1bmN0aW9uIHRlbXBsYXRlKGxvY2Fscykge1xudmFyIGJ1ZiA9IFtdO1xudmFyIGphZGVfbWl4aW5zID0ge307XG52YXIgbG9jYWxzXyA9IChsb2NhbHMgfHwge30pLGlzRmlsZSA9IGxvY2Fsc18uaXNGaWxlLHNvbmcgPSBsb2NhbHNfLnNvbmcsbmFtZSA9IGxvY2Fsc18ubmFtZTtcbmJ1Zi5wdXNoKFwiPGxpIGNsYXNzPVxcXCJnZW5lcmljXFxcIj5cIik7XG5pZiAoIGlzRmlsZSlcbntcbmJ1Zi5wdXNoKFwiPHNwYW4+XCIgKyAoamFkZS5lc2NhcGUobnVsbCA9PSAoamFkZS5pbnRlcnAgPSBzb25nKSA/IFwiXCIgOiBqYWRlLmludGVycCkpICsgXCI8L3NwYW4+XCIpO1xufVxuZWxzZVxue1xuYnVmLnB1c2goXCI8c3Bhbj5cIiArIChqYWRlLmVzY2FwZShudWxsID09IChqYWRlLmludGVycCA9IG5hbWUpID8gXCJcIiA6IGphZGUuaW50ZXJwKSkgKyBcIjwvc3Bhbj48ZGl2IGNsYXNzPVxcXCJidG4tZ3JvdXAgcHVsbC1yaWdodFxcXCI+PGJ1dHRvbiBjbGFzcz1cXFwiYnRuIGJ0bi1kZWZhdWx0IHBsYXlcXFwiPjxzcGFuIGNsYXNzPVxcXCJnbHlwaGljb24gZ2x5cGhpY29uLXBsYXlcXFwiPjwvc3Bhbj48L2J1dHRvbj48YnV0dG9uIGNsYXNzPVxcXCJidG4gYnRuLWRlZmF1bHQgYWRkXFxcIj48c3BhbiBjbGFzcz1cXFwiZ2x5cGhpY29uIGdseXBoaWNvbi1sb2ctaW5cXFwiPjwvc3Bhbj48L2J1dHRvbj48L2Rpdj5cIik7XG59XG5idWYucHVzaChcIjwvbGk+XCIpOztyZXR1cm4gYnVmLmpvaW4oXCJcIik7XG59bW9kdWxlLmV4cG9ydHMgPSB0ZW1wbGF0ZTsiLCJqYWRlID0gcmVxdWlyZShcIi4vLi4vdmVuZG9yL2phZGVydW50aW1lLmpzXCIpO2Z1bmN0aW9uIHRlbXBsYXRlKGxvY2Fscykge1xudmFyIGJ1ZiA9IFtdO1xudmFyIGphZGVfbWl4aW5zID0ge307XG52YXIgbG9jYWxzXyA9IChsb2NhbHMgfHwge30pLHN0cmVhbSA9IGxvY2Fsc18uc3RyZWFtLHNvbmcgPSBsb2NhbHNfLnNvbmcsYWxidW0gPSBsb2NhbHNfLmFsYnVtLGFydGlzdCA9IGxvY2Fsc18uYXJ0aXN0LGR1cmF0aW9uID0gbG9jYWxzXy5kdXJhdGlvbjtcbmJ1Zi5wdXNoKFwiPHRyXCIgKyAoamFkZS5hdHRyKFwiZGF0YS1zdHJlYW1cIiwgc3RyZWFtLCB0cnVlLCBmYWxzZSkpICsgXCIgY2xhc3M9XFxcIml0ZW1cXFwiPjx0ZD48c3BhbiBjbGFzcz1cXFwiZ2x5cGhpY29uIGdseXBoaWNvbi12b2x1bWUtdXAgcGxheWluZyBoaWRlXFxcIj48L3NwYW4+PHNwYW4+Jm5ic3A7PC9zcGFuPjxzcGFuPlwiICsgKGphZGUuZXNjYXBlKG51bGwgPT0gKGphZGUuaW50ZXJwID0gc29uZykgPyBcIlwiIDogamFkZS5pbnRlcnApKSArIFwiPC9zcGFuPjwvdGQ+PHRkPlwiICsgKGphZGUuZXNjYXBlKG51bGwgPT0gKGphZGUuaW50ZXJwID0gYWxidW0pID8gXCJcIiA6IGphZGUuaW50ZXJwKSkgKyBcIjwvdGQ+PHRkPlwiICsgKGphZGUuZXNjYXBlKG51bGwgPT0gKGphZGUuaW50ZXJwID0gYXJ0aXN0KSA/IFwiXCIgOiBqYWRlLmludGVycCkpICsgXCI8L3RkPjx0ZD5cIiArIChqYWRlLmVzY2FwZShudWxsID09IChqYWRlLmludGVycCA9IGR1cmF0aW9uKSA/IFwiXCIgOiBqYWRlLmludGVycCkpICsgXCI8L3RkPjwvdHI+XCIpOztyZXR1cm4gYnVmLmpvaW4oXCJcIik7XG59bW9kdWxlLmV4cG9ydHMgPSB0ZW1wbGF0ZTsiLCJ2YXIgbW9tZW50ID0gcmVxdWlyZSgnLi92ZW5kb3IvbW9tZW50LmpzJyk7XG5cbmZ1bmN0aW9uIHNlY29uZHNUb1RpbWUoc2VjKVxue1xuXHRyZXR1cm4gbW9tZW50KCkuc3RhcnRPZignZGF5JykuYWRkKCdzJywgc2VjKS5mb3JtYXQoJ21tOnNzJylcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdHNlY29uZHNUb1RpbWU6IHNlY29uZHNUb1RpbWVcbn07XG4iLCJ2YXIgZ2xvYmFsPXR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fTshZnVuY3Rpb24oZSl7aWYoXCJvYmplY3RcIj09dHlwZW9mIGV4cG9ydHMpbW9kdWxlLmV4cG9ydHM9ZSgpO2Vsc2UgaWYoXCJmdW5jdGlvblwiPT10eXBlb2YgZGVmaW5lJiZkZWZpbmUuYW1kKWRlZmluZShlKTtlbHNle3ZhciBmO1widW5kZWZpbmVkXCIhPXR5cGVvZiB3aW5kb3c/Zj13aW5kb3c6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIGdsb2JhbD9mPWdsb2JhbDpcInVuZGVmaW5lZFwiIT10eXBlb2Ygc2VsZiYmKGY9c2VsZiksZi5qYWRlPWUoKX19KGZ1bmN0aW9uKCl7dmFyIGRlZmluZSxtb2R1bGUsZXhwb3J0cztyZXR1cm4gKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkoezE6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIE1lcmdlIHR3byBhdHRyaWJ1dGUgb2JqZWN0cyBnaXZpbmcgcHJlY2VkZW5jZVxuICogdG8gdmFsdWVzIGluIG9iamVjdCBgYmAuIENsYXNzZXMgYXJlIHNwZWNpYWwtY2FzZWRcbiAqIGFsbG93aW5nIGZvciBhcnJheXMgYW5kIG1lcmdpbmcvam9pbmluZyBhcHByb3ByaWF0ZWx5XG4gKiByZXN1bHRpbmcgaW4gYSBzdHJpbmcuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGFcbiAqIEBwYXJhbSB7T2JqZWN0fSBiXG4gKiBAcmV0dXJuIHtPYmplY3R9IGFcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmV4cG9ydHMubWVyZ2UgPSBmdW5jdGlvbiBtZXJnZShhLCBiKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgdmFyIGF0dHJzID0gYVswXTtcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgIGF0dHJzID0gbWVyZ2UoYXR0cnMsIGFbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gYXR0cnM7XG4gIH1cbiAgdmFyIGFjID0gYVsnY2xhc3MnXTtcbiAgdmFyIGJjID0gYlsnY2xhc3MnXTtcblxuICBpZiAoYWMgfHwgYmMpIHtcbiAgICBhYyA9IGFjIHx8IFtdO1xuICAgIGJjID0gYmMgfHwgW107XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGFjKSkgYWMgPSBbYWNdO1xuICAgIGlmICghQXJyYXkuaXNBcnJheShiYykpIGJjID0gW2JjXTtcbiAgICBhWydjbGFzcyddID0gYWMuY29uY2F0KGJjKS5maWx0ZXIobnVsbHMpO1xuICB9XG5cbiAgZm9yICh2YXIga2V5IGluIGIpIHtcbiAgICBpZiAoa2V5ICE9ICdjbGFzcycpIHtcbiAgICAgIGFba2V5XSA9IGJba2V5XTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYTtcbn07XG5cbi8qKlxuICogRmlsdGVyIG51bGwgYHZhbGBzLlxuICpcbiAqIEBwYXJhbSB7Kn0gdmFsXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gbnVsbHModmFsKSB7XG4gIHJldHVybiB2YWwgIT0gbnVsbCAmJiB2YWwgIT09ICcnO1xufVxuXG4vKipcbiAqIGpvaW4gYXJyYXkgYXMgY2xhc3Nlcy5cbiAqXG4gKiBAcGFyYW0geyp9IHZhbFxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5leHBvcnRzLmpvaW5DbGFzc2VzID0gam9pbkNsYXNzZXM7XG5mdW5jdGlvbiBqb2luQ2xhc3Nlcyh2YWwpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsKSA/IHZhbC5tYXAoam9pbkNsYXNzZXMpLmZpbHRlcihudWxscykuam9pbignICcpIDogdmFsO1xufVxuXG4vKipcbiAqIFJlbmRlciB0aGUgZ2l2ZW4gY2xhc3Nlcy5cbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBjbGFzc2VzXG4gKiBAcGFyYW0ge0FycmF5LjxCb29sZWFuPn0gZXNjYXBlZFxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5leHBvcnRzLmNscyA9IGZ1bmN0aW9uIGNscyhjbGFzc2VzLCBlc2NhcGVkKSB7XG4gIHZhciBidWYgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBjbGFzc2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGVzY2FwZWQgJiYgZXNjYXBlZFtpXSkge1xuICAgICAgYnVmLnB1c2goZXhwb3J0cy5lc2NhcGUoam9pbkNsYXNzZXMoW2NsYXNzZXNbaV1dKSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBidWYucHVzaChqb2luQ2xhc3NlcyhjbGFzc2VzW2ldKSk7XG4gICAgfVxuICB9XG4gIHZhciB0ZXh0ID0gam9pbkNsYXNzZXMoYnVmKTtcbiAgaWYgKHRleHQubGVuZ3RoKSB7XG4gICAgcmV0dXJuICcgY2xhc3M9XCInICsgdGV4dCArICdcIic7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuICcnO1xuICB9XG59O1xuXG4vKipcbiAqIFJlbmRlciB0aGUgZ2l2ZW4gYXR0cmlidXRlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBrZXlcbiAqIEBwYXJhbSB7U3RyaW5nfSB2YWxcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gZXNjYXBlZFxuICogQHBhcmFtIHtCb29sZWFufSB0ZXJzZVxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5leHBvcnRzLmF0dHIgPSBmdW5jdGlvbiBhdHRyKGtleSwgdmFsLCBlc2NhcGVkLCB0ZXJzZSkge1xuICBpZiAoJ2Jvb2xlYW4nID09IHR5cGVvZiB2YWwgfHwgbnVsbCA9PSB2YWwpIHtcbiAgICBpZiAodmFsKSB7XG4gICAgICByZXR1cm4gJyAnICsgKHRlcnNlID8ga2V5IDoga2V5ICsgJz1cIicgKyBrZXkgKyAnXCInKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgfSBlbHNlIGlmICgwID09IGtleS5pbmRleE9mKCdkYXRhJykgJiYgJ3N0cmluZycgIT0gdHlwZW9mIHZhbCkge1xuICAgIHJldHVybiAnICcgKyBrZXkgKyBcIj0nXCIgKyBKU09OLnN0cmluZ2lmeSh2YWwpLnJlcGxhY2UoLycvZywgJyZhcG9zOycpICsgXCInXCI7XG4gIH0gZWxzZSBpZiAoZXNjYXBlZCkge1xuICAgIHJldHVybiAnICcgKyBrZXkgKyAnPVwiJyArIGV4cG9ydHMuZXNjYXBlKHZhbCkgKyAnXCInO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAnICcgKyBrZXkgKyAnPVwiJyArIHZhbCArICdcIic7XG4gIH1cbn07XG5cbi8qKlxuICogUmVuZGVyIHRoZSBnaXZlbiBhdHRyaWJ1dGVzIG9iamVjdC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcGFyYW0ge09iamVjdH0gZXNjYXBlZFxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5leHBvcnRzLmF0dHJzID0gZnVuY3Rpb24gYXR0cnMob2JqLCB0ZXJzZSl7XG4gIHZhciBidWYgPSBbXTtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG9iaik7XG5cbiAgaWYgKGtleXMubGVuZ3RoKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgKytpKSB7XG4gICAgICB2YXIga2V5ID0ga2V5c1tpXVxuICAgICAgICAsIHZhbCA9IG9ialtrZXldO1xuXG4gICAgICBpZiAoJ2NsYXNzJyA9PSBrZXkpIHtcbiAgICAgICAgaWYgKHZhbCA9IGpvaW5DbGFzc2VzKHZhbCkpIHtcbiAgICAgICAgICBidWYucHVzaCgnICcgKyBrZXkgKyAnPVwiJyArIHZhbCArICdcIicpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBidWYucHVzaChleHBvcnRzLmF0dHIoa2V5LCB2YWwsIGZhbHNlLCB0ZXJzZSkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBidWYuam9pbignJyk7XG59O1xuXG4vKipcbiAqIEVzY2FwZSB0aGUgZ2l2ZW4gc3RyaW5nIG9mIGBodG1sYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gaHRtbFxuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZXhwb3J0cy5lc2NhcGUgPSBmdW5jdGlvbiBlc2NhcGUoaHRtbCl7XG4gIHZhciByZXN1bHQgPSBTdHJpbmcoaHRtbClcbiAgICAucmVwbGFjZSgvJi9nLCAnJmFtcDsnKVxuICAgIC5yZXBsYWNlKC88L2csICcmbHQ7JylcbiAgICAucmVwbGFjZSgvPi9nLCAnJmd0OycpXG4gICAgLnJlcGxhY2UoL1wiL2csICcmcXVvdDsnKTtcbiAgaWYgKHJlc3VsdCA9PT0gJycgKyBodG1sKSByZXR1cm4gaHRtbDtcbiAgZWxzZSByZXR1cm4gcmVzdWx0O1xufTtcblxuLyoqXG4gKiBSZS10aHJvdyB0aGUgZ2l2ZW4gYGVycmAgaW4gY29udGV4dCB0byB0aGVcbiAqIHRoZSBqYWRlIGluIGBmaWxlbmFtZWAgYXQgdGhlIGdpdmVuIGBsaW5lbm9gLlxuICpcbiAqIEBwYXJhbSB7RXJyb3J9IGVyclxuICogQHBhcmFtIHtTdHJpbmd9IGZpbGVuYW1lXG4gKiBAcGFyYW0ge1N0cmluZ30gbGluZW5vXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5leHBvcnRzLnJldGhyb3cgPSBmdW5jdGlvbiByZXRocm93KGVyciwgZmlsZW5hbWUsIGxpbmVubywgc3RyKXtcbiAgaWYgKCEoZXJyIGluc3RhbmNlb2YgRXJyb3IpKSB0aHJvdyBlcnI7XG4gIGlmICgodHlwZW9mIHdpbmRvdyAhPSAndW5kZWZpbmVkJyB8fCAhZmlsZW5hbWUpICYmICFzdHIpIHtcbiAgICBlcnIubWVzc2FnZSArPSAnIG9uIGxpbmUgJyArIGxpbmVubztcbiAgICB0aHJvdyBlcnI7XG4gIH1cbiAgdHJ5IHtcbiAgICBzdHIgPSAgc3RyIHx8IHJlcXVpcmUoJ2ZzJykucmVhZEZpbGVTeW5jKGZpbGVuYW1lLCAndXRmOCcpXG4gIH0gY2F0Y2ggKGV4KSB7XG4gICAgcmV0aHJvdyhlcnIsIG51bGwsIGxpbmVubylcbiAgfVxuICB2YXIgY29udGV4dCA9IDNcbiAgICAsIGxpbmVzID0gc3RyLnNwbGl0KCdcXG4nKVxuICAgICwgc3RhcnQgPSBNYXRoLm1heChsaW5lbm8gLSBjb250ZXh0LCAwKVxuICAgICwgZW5kID0gTWF0aC5taW4obGluZXMubGVuZ3RoLCBsaW5lbm8gKyBjb250ZXh0KTtcblxuICAvLyBFcnJvciBjb250ZXh0XG4gIHZhciBjb250ZXh0ID0gbGluZXMuc2xpY2Uoc3RhcnQsIGVuZCkubWFwKGZ1bmN0aW9uKGxpbmUsIGkpe1xuICAgIHZhciBjdXJyID0gaSArIHN0YXJ0ICsgMTtcbiAgICByZXR1cm4gKGN1cnIgPT0gbGluZW5vID8gJyAgPiAnIDogJyAgICAnKVxuICAgICAgKyBjdXJyXG4gICAgICArICd8ICdcbiAgICAgICsgbGluZTtcbiAgfSkuam9pbignXFxuJyk7XG5cbiAgLy8gQWx0ZXIgZXhjZXB0aW9uIG1lc3NhZ2VcbiAgZXJyLnBhdGggPSBmaWxlbmFtZTtcbiAgZXJyLm1lc3NhZ2UgPSAoZmlsZW5hbWUgfHwgJ0phZGUnKSArICc6JyArIGxpbmVub1xuICAgICsgJ1xcbicgKyBjb250ZXh0ICsgJ1xcblxcbicgKyBlcnIubWVzc2FnZTtcbiAgdGhyb3cgZXJyO1xufTtcblxufSx7XCJmc1wiOjJ9XSwyOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcblxufSx7fV19LHt9LFsxXSlcbigxKVxufSk7IiwidmFyIGdsb2JhbD10eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge307LyoqXG4gKiBAbGljZW5zZVxuICogTG8tRGFzaCAyLjQuMSAoQ3VzdG9tIEJ1aWxkKSBsb2Rhc2guY29tL2xpY2Vuc2UgfCBVbmRlcnNjb3JlLmpzIDEuNS4yIHVuZGVyc2NvcmVqcy5vcmcvTElDRU5TRVxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kZXJuIC1vIC4vZGlzdC9sb2Rhc2guanNgXG4gKi9cbjsoZnVuY3Rpb24oKXtmdW5jdGlvbiBuKG4sdCxlKXtlPShlfHwwKS0xO2Zvcih2YXIgcj1uP24ubGVuZ3RoOjA7KytlPHI7KWlmKG5bZV09PT10KXJldHVybiBlO3JldHVybi0xfWZ1bmN0aW9uIHQodCxlKXt2YXIgcj10eXBlb2YgZTtpZih0PXQubCxcImJvb2xlYW5cIj09cnx8bnVsbD09ZSlyZXR1cm4gdFtlXT8wOi0xO1wibnVtYmVyXCIhPXImJlwic3RyaW5nXCIhPXImJihyPVwib2JqZWN0XCIpO3ZhciB1PVwibnVtYmVyXCI9PXI/ZTptK2U7cmV0dXJuIHQ9KHQ9dFtyXSkmJnRbdV0sXCJvYmplY3RcIj09cj90JiYtMTxuKHQsZSk/MDotMTp0PzA6LTF9ZnVuY3Rpb24gZShuKXt2YXIgdD10aGlzLmwsZT10eXBlb2YgbjtpZihcImJvb2xlYW5cIj09ZXx8bnVsbD09bil0W25dPXRydWU7ZWxzZXtcIm51bWJlclwiIT1lJiZcInN0cmluZ1wiIT1lJiYoZT1cIm9iamVjdFwiKTt2YXIgcj1cIm51bWJlclwiPT1lP246bStuLHQ9dFtlXXx8KHRbZV09e30pO1wib2JqZWN0XCI9PWU/KHRbcl18fCh0W3JdPVtdKSkucHVzaChuKTp0W3JdPXRydWVcbn19ZnVuY3Rpb24gcihuKXtyZXR1cm4gbi5jaGFyQ29kZUF0KDApfWZ1bmN0aW9uIHUobix0KXtmb3IodmFyIGU9bi5tLHI9dC5tLHU9LTEsbz1lLmxlbmd0aDsrK3U8bzspe3ZhciBpPWVbdV0sYT1yW3VdO2lmKGkhPT1hKXtpZihpPmF8fHR5cGVvZiBpPT1cInVuZGVmaW5lZFwiKXJldHVybiAxO2lmKGk8YXx8dHlwZW9mIGE9PVwidW5kZWZpbmVkXCIpcmV0dXJuLTF9fXJldHVybiBuLm4tdC5ufWZ1bmN0aW9uIG8obil7dmFyIHQ9LTEscj1uLmxlbmd0aCx1PW5bMF0sbz1uW3IvMnwwXSxpPW5bci0xXTtpZih1JiZ0eXBlb2YgdT09XCJvYmplY3RcIiYmbyYmdHlwZW9mIG89PVwib2JqZWN0XCImJmkmJnR5cGVvZiBpPT1cIm9iamVjdFwiKXJldHVybiBmYWxzZTtmb3IodT1mKCksdVtcImZhbHNlXCJdPXVbXCJudWxsXCJdPXVbXCJ0cnVlXCJdPXUudW5kZWZpbmVkPWZhbHNlLG89ZigpLG8uaz1uLG8ubD11LG8ucHVzaD1lOysrdDxyOylvLnB1c2goblt0XSk7cmV0dXJuIG99ZnVuY3Rpb24gaShuKXtyZXR1cm5cIlxcXFxcIitVW25dXG59ZnVuY3Rpb24gYSgpe3JldHVybiBoLnBvcCgpfHxbXX1mdW5jdGlvbiBmKCl7cmV0dXJuIGcucG9wKCl8fHtrOm51bGwsbDpudWxsLG06bnVsbCxcImZhbHNlXCI6ZmFsc2UsbjowLFwibnVsbFwiOmZhbHNlLG51bWJlcjpudWxsLG9iamVjdDpudWxsLHB1c2g6bnVsbCxzdHJpbmc6bnVsbCxcInRydWVcIjpmYWxzZSx1bmRlZmluZWQ6ZmFsc2UsbzpudWxsfX1mdW5jdGlvbiBsKG4pe24ubGVuZ3RoPTAsaC5sZW5ndGg8XyYmaC5wdXNoKG4pfWZ1bmN0aW9uIGMobil7dmFyIHQ9bi5sO3QmJmModCksbi5rPW4ubD1uLm09bi5vYmplY3Q9bi5udW1iZXI9bi5zdHJpbmc9bi5vPW51bGwsZy5sZW5ndGg8XyYmZy5wdXNoKG4pfWZ1bmN0aW9uIHAobix0LGUpe3R8fCh0PTApLHR5cGVvZiBlPT1cInVuZGVmaW5lZFwiJiYoZT1uP24ubGVuZ3RoOjApO3ZhciByPS0xO2U9ZS10fHwwO2Zvcih2YXIgdT1BcnJheSgwPmU/MDplKTsrK3I8ZTspdVtyXT1uW3Qrcl07cmV0dXJuIHV9ZnVuY3Rpb24gcyhlKXtmdW5jdGlvbiBoKG4sdCxlKXtpZighbnx8IVZbdHlwZW9mIG5dKXJldHVybiBuO1xudD10JiZ0eXBlb2YgZT09XCJ1bmRlZmluZWRcIj90OnR0KHQsZSwzKTtmb3IodmFyIHI9LTEsdT1WW3R5cGVvZiBuXSYmRmUobiksbz11P3UubGVuZ3RoOjA7KytyPG8mJihlPXVbcl0sZmFsc2UhPT10KG5bZV0sZSxuKSk7KTtyZXR1cm4gbn1mdW5jdGlvbiBnKG4sdCxlKXt2YXIgcjtpZighbnx8IVZbdHlwZW9mIG5dKXJldHVybiBuO3Q9dCYmdHlwZW9mIGU9PVwidW5kZWZpbmVkXCI/dDp0dCh0LGUsMyk7Zm9yKHIgaW4gbilpZihmYWxzZT09PXQobltyXSxyLG4pKWJyZWFrO3JldHVybiBufWZ1bmN0aW9uIF8obix0LGUpe3ZhciByLHU9bixvPXU7aWYoIXUpcmV0dXJuIG87Zm9yKHZhciBpPWFyZ3VtZW50cyxhPTAsZj10eXBlb2YgZT09XCJudW1iZXJcIj8yOmkubGVuZ3RoOysrYTxmOylpZigodT1pW2FdKSYmVlt0eXBlb2YgdV0pZm9yKHZhciBsPS0xLGM9Vlt0eXBlb2YgdV0mJkZlKHUpLHA9Yz9jLmxlbmd0aDowOysrbDxwOylyPWNbbF0sXCJ1bmRlZmluZWRcIj09dHlwZW9mIG9bcl0mJihvW3JdPXVbcl0pO1xucmV0dXJuIG99ZnVuY3Rpb24gVShuLHQsZSl7dmFyIHIsdT1uLG89dTtpZighdSlyZXR1cm4gbzt2YXIgaT1hcmd1bWVudHMsYT0wLGY9dHlwZW9mIGU9PVwibnVtYmVyXCI/MjppLmxlbmd0aDtpZigzPGYmJlwiZnVuY3Rpb25cIj09dHlwZW9mIGlbZi0yXSl2YXIgbD10dChpWy0tZi0xXSxpW2YtLV0sMik7ZWxzZSAyPGYmJlwiZnVuY3Rpb25cIj09dHlwZW9mIGlbZi0xXSYmKGw9aVstLWZdKTtmb3IoOysrYTxmOylpZigodT1pW2FdKSYmVlt0eXBlb2YgdV0pZm9yKHZhciBjPS0xLHA9Vlt0eXBlb2YgdV0mJkZlKHUpLHM9cD9wLmxlbmd0aDowOysrYzxzOylyPXBbY10sb1tyXT1sP2wob1tyXSx1W3JdKTp1W3JdO3JldHVybiBvfWZ1bmN0aW9uIEgobil7dmFyIHQsZT1bXTtpZighbnx8IVZbdHlwZW9mIG5dKXJldHVybiBlO2Zvcih0IGluIG4pbWUuY2FsbChuLHQpJiZlLnB1c2godCk7cmV0dXJuIGV9ZnVuY3Rpb24gSihuKXtyZXR1cm4gbiYmdHlwZW9mIG49PVwib2JqZWN0XCImJiFUZShuKSYmbWUuY2FsbChuLFwiX193cmFwcGVkX19cIik/bjpuZXcgUShuKVxufWZ1bmN0aW9uIFEobix0KXt0aGlzLl9fY2hhaW5fXz0hIXQsdGhpcy5fX3dyYXBwZWRfXz1ufWZ1bmN0aW9uIFgobil7ZnVuY3Rpb24gdCgpe2lmKHIpe3ZhciBuPXAocik7YmUuYXBwbHkobixhcmd1bWVudHMpfWlmKHRoaXMgaW5zdGFuY2VvZiB0KXt2YXIgbz1udChlLnByb3RvdHlwZSksbj1lLmFwcGx5KG8sbnx8YXJndW1lbnRzKTtyZXR1cm4gd3Qobik/bjpvfXJldHVybiBlLmFwcGx5KHUsbnx8YXJndW1lbnRzKX12YXIgZT1uWzBdLHI9blsyXSx1PW5bNF07cmV0dXJuICRlKHQsbiksdH1mdW5jdGlvbiBaKG4sdCxlLHIsdSl7aWYoZSl7dmFyIG89ZShuKTtpZih0eXBlb2YgbyE9XCJ1bmRlZmluZWRcIilyZXR1cm4gb31pZighd3QobikpcmV0dXJuIG47dmFyIGk9Y2UuY2FsbChuKTtpZighS1tpXSlyZXR1cm4gbjt2YXIgZj1BZVtpXTtzd2l0Y2goaSl7Y2FzZSBUOmNhc2UgRjpyZXR1cm4gbmV3IGYoK24pO2Nhc2UgVzpjYXNlIFA6cmV0dXJuIG5ldyBmKG4pO2Nhc2UgejpyZXR1cm4gbz1mKG4uc291cmNlLEMuZXhlYyhuKSksby5sYXN0SW5kZXg9bi5sYXN0SW5kZXgsb1xufWlmKGk9VGUobiksdCl7dmFyIGM9IXI7cnx8KHI9YSgpKSx1fHwodT1hKCkpO2Zvcih2YXIgcz1yLmxlbmd0aDtzLS07KWlmKHJbc109PW4pcmV0dXJuIHVbc107bz1pP2Yobi5sZW5ndGgpOnt9fWVsc2Ugbz1pP3Aobik6VSh7fSxuKTtyZXR1cm4gaSYmKG1lLmNhbGwobixcImluZGV4XCIpJiYoby5pbmRleD1uLmluZGV4KSxtZS5jYWxsKG4sXCJpbnB1dFwiKSYmKG8uaW5wdXQ9bi5pbnB1dCkpLHQ/KHIucHVzaChuKSx1LnB1c2gobyksKGk/U3Q6aCkobixmdW5jdGlvbihuLGkpe29baV09WihuLHQsZSxyLHUpfSksYyYmKGwociksbCh1KSksbyk6b31mdW5jdGlvbiBudChuKXtyZXR1cm4gd3Qobik/a2Uobik6e319ZnVuY3Rpb24gdHQobix0LGUpe2lmKHR5cGVvZiBuIT1cImZ1bmN0aW9uXCIpcmV0dXJuIFV0O2lmKHR5cGVvZiB0PT1cInVuZGVmaW5lZFwifHwhKFwicHJvdG90eXBlXCJpbiBuKSlyZXR1cm4gbjt2YXIgcj1uLl9fYmluZERhdGFfXztpZih0eXBlb2Ygcj09XCJ1bmRlZmluZWRcIiYmKERlLmZ1bmNOYW1lcyYmKHI9IW4ubmFtZSkscj1yfHwhRGUuZnVuY0RlY29tcCwhcikpe3ZhciB1PWdlLmNhbGwobik7XG5EZS5mdW5jTmFtZXN8fChyPSFPLnRlc3QodSkpLHJ8fChyPUUudGVzdCh1KSwkZShuLHIpKX1pZihmYWxzZT09PXJ8fHRydWUhPT1yJiYxJnJbMV0pcmV0dXJuIG47c3dpdGNoKGUpe2Nhc2UgMTpyZXR1cm4gZnVuY3Rpb24oZSl7cmV0dXJuIG4uY2FsbCh0LGUpfTtjYXNlIDI6cmV0dXJuIGZ1bmN0aW9uKGUscil7cmV0dXJuIG4uY2FsbCh0LGUscil9O2Nhc2UgMzpyZXR1cm4gZnVuY3Rpb24oZSxyLHUpe3JldHVybiBuLmNhbGwodCxlLHIsdSl9O2Nhc2UgNDpyZXR1cm4gZnVuY3Rpb24oZSxyLHUsbyl7cmV0dXJuIG4uY2FsbCh0LGUscix1LG8pfX1yZXR1cm4gTXQobix0KX1mdW5jdGlvbiBldChuKXtmdW5jdGlvbiB0KCl7dmFyIG49Zj9pOnRoaXM7aWYodSl7dmFyIGg9cCh1KTtiZS5hcHBseShoLGFyZ3VtZW50cyl9cmV0dXJuKG98fGMpJiYoaHx8KGg9cChhcmd1bWVudHMpKSxvJiZiZS5hcHBseShoLG8pLGMmJmgubGVuZ3RoPGEpPyhyfD0xNixldChbZSxzP3I6LTQmcixoLG51bGwsaSxhXSkpOihofHwoaD1hcmd1bWVudHMpLGwmJihlPW5bdl0pLHRoaXMgaW5zdGFuY2VvZiB0PyhuPW50KGUucHJvdG90eXBlKSxoPWUuYXBwbHkobixoKSx3dChoKT9oOm4pOmUuYXBwbHkobixoKSlcbn12YXIgZT1uWzBdLHI9blsxXSx1PW5bMl0sbz1uWzNdLGk9bls0XSxhPW5bNV0sZj0xJnIsbD0yJnIsYz00JnIscz04JnIsdj1lO3JldHVybiAkZSh0LG4pLHR9ZnVuY3Rpb24gcnQoZSxyKXt2YXIgdT0tMSxpPXN0KCksYT1lP2UubGVuZ3RoOjAsZj1hPj1iJiZpPT09bixsPVtdO2lmKGYpe3ZhciBwPW8ocik7cD8oaT10LHI9cCk6Zj1mYWxzZX1mb3IoOysrdTxhOylwPWVbdV0sMD5pKHIscCkmJmwucHVzaChwKTtyZXR1cm4gZiYmYyhyKSxsfWZ1bmN0aW9uIHV0KG4sdCxlLHIpe3I9KHJ8fDApLTE7Zm9yKHZhciB1PW4/bi5sZW5ndGg6MCxvPVtdOysrcjx1Oyl7dmFyIGk9bltyXTtpZihpJiZ0eXBlb2YgaT09XCJvYmplY3RcIiYmdHlwZW9mIGkubGVuZ3RoPT1cIm51bWJlclwiJiYoVGUoaSl8fHl0KGkpKSl7dHx8KGk9dXQoaSx0LGUpKTt2YXIgYT0tMSxmPWkubGVuZ3RoLGw9by5sZW5ndGg7Zm9yKG8ubGVuZ3RoKz1mOysrYTxmOylvW2wrK109aVthXX1lbHNlIGV8fG8ucHVzaChpKX1yZXR1cm4gb1xufWZ1bmN0aW9uIG90KG4sdCxlLHIsdSxvKXtpZihlKXt2YXIgaT1lKG4sdCk7aWYodHlwZW9mIGkhPVwidW5kZWZpbmVkXCIpcmV0dXJuISFpfWlmKG49PT10KXJldHVybiAwIT09bnx8MS9uPT0xL3Q7aWYobj09PW4mJiEobiYmVlt0eXBlb2Ygbl18fHQmJlZbdHlwZW9mIHRdKSlyZXR1cm4gZmFsc2U7aWYobnVsbD09bnx8bnVsbD09dClyZXR1cm4gbj09PXQ7dmFyIGY9Y2UuY2FsbChuKSxjPWNlLmNhbGwodCk7aWYoZj09RCYmKGY9cSksYz09RCYmKGM9cSksZiE9YylyZXR1cm4gZmFsc2U7c3dpdGNoKGYpe2Nhc2UgVDpjYXNlIEY6cmV0dXJuK249PSt0O2Nhc2UgVzpyZXR1cm4gbiE9K24/dCE9K3Q6MD09bj8xL249PTEvdDpuPT0rdDtjYXNlIHo6Y2FzZSBQOnJldHVybiBuPT1vZSh0KX1pZihjPWY9PSQsIWMpe3ZhciBwPW1lLmNhbGwobixcIl9fd3JhcHBlZF9fXCIpLHM9bWUuY2FsbCh0LFwiX193cmFwcGVkX19cIik7aWYocHx8cylyZXR1cm4gb3QocD9uLl9fd3JhcHBlZF9fOm4scz90Ll9fd3JhcHBlZF9fOnQsZSxyLHUsbyk7XG5pZihmIT1xKXJldHVybiBmYWxzZTtpZihmPW4uY29uc3RydWN0b3IscD10LmNvbnN0cnVjdG9yLGYhPXAmJiEoZHQoZikmJmYgaW5zdGFuY2VvZiBmJiZkdChwKSYmcCBpbnN0YW5jZW9mIHApJiZcImNvbnN0cnVjdG9yXCJpbiBuJiZcImNvbnN0cnVjdG9yXCJpbiB0KXJldHVybiBmYWxzZX1mb3IoZj0hdSx1fHwodT1hKCkpLG98fChvPWEoKSkscD11Lmxlbmd0aDtwLS07KWlmKHVbcF09PW4pcmV0dXJuIG9bcF09PXQ7dmFyIHY9MCxpPXRydWU7aWYodS5wdXNoKG4pLG8ucHVzaCh0KSxjKXtpZihwPW4ubGVuZ3RoLHY9dC5sZW5ndGgsKGk9dj09cCl8fHIpZm9yKDt2LS07KWlmKGM9cCxzPXRbdl0scilmb3IoO2MtLSYmIShpPW90KG5bY10scyxlLHIsdSxvKSk7KTtlbHNlIGlmKCEoaT1vdChuW3ZdLHMsZSxyLHUsbykpKWJyZWFrfWVsc2UgZyh0LGZ1bmN0aW9uKHQsYSxmKXtyZXR1cm4gbWUuY2FsbChmLGEpPyh2KyssaT1tZS5jYWxsKG4sYSkmJm90KG5bYV0sdCxlLHIsdSxvKSk6dm9pZCAwfSksaSYmIXImJmcobixmdW5jdGlvbihuLHQsZSl7cmV0dXJuIG1lLmNhbGwoZSx0KT9pPS0xPC0tdjp2b2lkIDBcbn0pO3JldHVybiB1LnBvcCgpLG8ucG9wKCksZiYmKGwodSksbChvKSksaX1mdW5jdGlvbiBpdChuLHQsZSxyLHUpeyhUZSh0KT9TdDpoKSh0LGZ1bmN0aW9uKHQsbyl7dmFyIGksYSxmPXQsbD1uW29dO2lmKHQmJigoYT1UZSh0KSl8fFBlKHQpKSl7Zm9yKGY9ci5sZW5ndGg7Zi0tOylpZihpPXJbZl09PXQpe2w9dVtmXTticmVha31pZighaSl7dmFyIGM7ZSYmKGY9ZShsLHQpLGM9dHlwZW9mIGYhPVwidW5kZWZpbmVkXCIpJiYobD1mKSxjfHwobD1hP1RlKGwpP2w6W106UGUobCk/bDp7fSksci5wdXNoKHQpLHUucHVzaChsKSxjfHxpdChsLHQsZSxyLHUpfX1lbHNlIGUmJihmPWUobCx0KSx0eXBlb2YgZj09XCJ1bmRlZmluZWRcIiYmKGY9dCkpLHR5cGVvZiBmIT1cInVuZGVmaW5lZFwiJiYobD1mKTtuW29dPWx9KX1mdW5jdGlvbiBhdChuLHQpe3JldHVybiBuK2hlKFJlKCkqKHQtbisxKSl9ZnVuY3Rpb24gZnQoZSxyLHUpe3ZhciBpPS0xLGY9c3QoKSxwPWU/ZS5sZW5ndGg6MCxzPVtdLHY9IXImJnA+PWImJmY9PT1uLGg9dXx8dj9hKCk6cztcbmZvcih2JiYoaD1vKGgpLGY9dCk7KytpPHA7KXt2YXIgZz1lW2ldLHk9dT91KGcsaSxlKTpnOyhyPyFpfHxoW2gubGVuZ3RoLTFdIT09eTowPmYoaCx5KSkmJigodXx8dikmJmgucHVzaCh5KSxzLnB1c2goZykpfXJldHVybiB2PyhsKGguayksYyhoKSk6dSYmbChoKSxzfWZ1bmN0aW9uIGx0KG4pe3JldHVybiBmdW5jdGlvbih0LGUscil7dmFyIHU9e307ZT1KLmNyZWF0ZUNhbGxiYWNrKGUsciwzKSxyPS0xO3ZhciBvPXQ/dC5sZW5ndGg6MDtpZih0eXBlb2Ygbz09XCJudW1iZXJcIilmb3IoOysrcjxvOyl7dmFyIGk9dFtyXTtuKHUsaSxlKGkscix0KSx0KX1lbHNlIGgodCxmdW5jdGlvbih0LHIsbyl7bih1LHQsZSh0LHIsbyksbyl9KTtyZXR1cm4gdX19ZnVuY3Rpb24gY3Qobix0LGUscix1LG8pe3ZhciBpPTEmdCxhPTQmdCxmPTE2JnQsbD0zMiZ0O2lmKCEoMiZ0fHxkdChuKSkpdGhyb3cgbmV3IGllO2YmJiFlLmxlbmd0aCYmKHQmPS0xNyxmPWU9ZmFsc2UpLGwmJiFyLmxlbmd0aCYmKHQmPS0zMyxsPXI9ZmFsc2UpO1xudmFyIGM9biYmbi5fX2JpbmREYXRhX187cmV0dXJuIGMmJnRydWUhPT1jPyhjPXAoYyksY1syXSYmKGNbMl09cChjWzJdKSksY1szXSYmKGNbM109cChjWzNdKSksIWl8fDEmY1sxXXx8KGNbNF09dSksIWkmJjEmY1sxXSYmKHR8PTgpLCFhfHw0JmNbMV18fChjWzVdPW8pLGYmJmJlLmFwcGx5KGNbMl18fChjWzJdPVtdKSxlKSxsJiZ3ZS5hcHBseShjWzNdfHwoY1szXT1bXSksciksY1sxXXw9dCxjdC5hcHBseShudWxsLGMpKTooMT09dHx8MTc9PT10P1g6ZXQpKFtuLHQsZSxyLHUsb10pfWZ1bmN0aW9uIHB0KG4pe3JldHVybiBCZVtuXX1mdW5jdGlvbiBzdCgpe3ZhciB0PSh0PUouaW5kZXhPZik9PT1XdD9uOnQ7cmV0dXJuIHR9ZnVuY3Rpb24gdnQobil7cmV0dXJuIHR5cGVvZiBuPT1cImZ1bmN0aW9uXCImJnBlLnRlc3Qobil9ZnVuY3Rpb24gaHQobil7dmFyIHQsZTtyZXR1cm4gbiYmY2UuY2FsbChuKT09cSYmKHQ9bi5jb25zdHJ1Y3RvciwhZHQodCl8fHQgaW5zdGFuY2VvZiB0KT8oZyhuLGZ1bmN0aW9uKG4sdCl7ZT10XG59KSx0eXBlb2YgZT09XCJ1bmRlZmluZWRcInx8bWUuY2FsbChuLGUpKTpmYWxzZX1mdW5jdGlvbiBndChuKXtyZXR1cm4gV2Vbbl19ZnVuY3Rpb24geXQobil7cmV0dXJuIG4mJnR5cGVvZiBuPT1cIm9iamVjdFwiJiZ0eXBlb2Ygbi5sZW5ndGg9PVwibnVtYmVyXCImJmNlLmNhbGwobik9PUR8fGZhbHNlfWZ1bmN0aW9uIG10KG4sdCxlKXt2YXIgcj1GZShuKSx1PXIubGVuZ3RoO2Zvcih0PXR0KHQsZSwzKTt1LS0mJihlPXJbdV0sZmFsc2UhPT10KG5bZV0sZSxuKSk7KTtyZXR1cm4gbn1mdW5jdGlvbiBidChuKXt2YXIgdD1bXTtyZXR1cm4gZyhuLGZ1bmN0aW9uKG4sZSl7ZHQobikmJnQucHVzaChlKX0pLHQuc29ydCgpfWZ1bmN0aW9uIF90KG4pe2Zvcih2YXIgdD0tMSxlPUZlKG4pLHI9ZS5sZW5ndGgsdT17fTsrK3Q8cjspe3ZhciBvPWVbdF07dVtuW29dXT1vfXJldHVybiB1fWZ1bmN0aW9uIGR0KG4pe3JldHVybiB0eXBlb2Ygbj09XCJmdW5jdGlvblwifWZ1bmN0aW9uIHd0KG4pe3JldHVybiEoIW58fCFWW3R5cGVvZiBuXSlcbn1mdW5jdGlvbiBqdChuKXtyZXR1cm4gdHlwZW9mIG49PVwibnVtYmVyXCJ8fG4mJnR5cGVvZiBuPT1cIm9iamVjdFwiJiZjZS5jYWxsKG4pPT1XfHxmYWxzZX1mdW5jdGlvbiBrdChuKXtyZXR1cm4gdHlwZW9mIG49PVwic3RyaW5nXCJ8fG4mJnR5cGVvZiBuPT1cIm9iamVjdFwiJiZjZS5jYWxsKG4pPT1QfHxmYWxzZX1mdW5jdGlvbiB4dChuKXtmb3IodmFyIHQ9LTEsZT1GZShuKSxyPWUubGVuZ3RoLHU9WHQocik7Kyt0PHI7KXVbdF09bltlW3RdXTtyZXR1cm4gdX1mdW5jdGlvbiBDdChuLHQsZSl7dmFyIHI9LTEsdT1zdCgpLG89bj9uLmxlbmd0aDowLGk9ZmFsc2U7cmV0dXJuIGU9KDA+ZT9JZSgwLG8rZSk6ZSl8fDAsVGUobik/aT0tMTx1KG4sdCxlKTp0eXBlb2Ygbz09XCJudW1iZXJcIj9pPS0xPChrdChuKT9uLmluZGV4T2YodCxlKTp1KG4sdCxlKSk6aChuLGZ1bmN0aW9uKG4pe3JldHVybisrcjxlP3ZvaWQgMDohKGk9bj09PXQpfSksaX1mdW5jdGlvbiBPdChuLHQsZSl7dmFyIHI9dHJ1ZTt0PUouY3JlYXRlQ2FsbGJhY2sodCxlLDMpLGU9LTE7XG52YXIgdT1uP24ubGVuZ3RoOjA7aWYodHlwZW9mIHU9PVwibnVtYmVyXCIpZm9yKDsrK2U8dSYmKHI9ISF0KG5bZV0sZSxuKSk7KTtlbHNlIGgobixmdW5jdGlvbihuLGUsdSl7cmV0dXJuIHI9ISF0KG4sZSx1KX0pO3JldHVybiByfWZ1bmN0aW9uIE50KG4sdCxlKXt2YXIgcj1bXTt0PUouY3JlYXRlQ2FsbGJhY2sodCxlLDMpLGU9LTE7dmFyIHU9bj9uLmxlbmd0aDowO2lmKHR5cGVvZiB1PT1cIm51bWJlclwiKWZvcig7KytlPHU7KXt2YXIgbz1uW2VdO3QobyxlLG4pJiZyLnB1c2gobyl9ZWxzZSBoKG4sZnVuY3Rpb24obixlLHUpe3QobixlLHUpJiZyLnB1c2gobil9KTtyZXR1cm4gcn1mdW5jdGlvbiBJdChuLHQsZSl7dD1KLmNyZWF0ZUNhbGxiYWNrKHQsZSwzKSxlPS0xO3ZhciByPW4/bi5sZW5ndGg6MDtpZih0eXBlb2YgciE9XCJudW1iZXJcIil7dmFyIHU7cmV0dXJuIGgobixmdW5jdGlvbihuLGUscil7cmV0dXJuIHQobixlLHIpPyh1PW4sZmFsc2UpOnZvaWQgMH0pLHV9Zm9yKDsrK2U8cjspe3ZhciBvPW5bZV07XG5pZih0KG8sZSxuKSlyZXR1cm4gb319ZnVuY3Rpb24gU3Qobix0LGUpe3ZhciByPS0xLHU9bj9uLmxlbmd0aDowO2lmKHQ9dCYmdHlwZW9mIGU9PVwidW5kZWZpbmVkXCI/dDp0dCh0LGUsMyksdHlwZW9mIHU9PVwibnVtYmVyXCIpZm9yKDsrK3I8dSYmZmFsc2UhPT10KG5bcl0scixuKTspO2Vsc2UgaChuLHQpO3JldHVybiBufWZ1bmN0aW9uIEV0KG4sdCxlKXt2YXIgcj1uP24ubGVuZ3RoOjA7aWYodD10JiZ0eXBlb2YgZT09XCJ1bmRlZmluZWRcIj90OnR0KHQsZSwzKSx0eXBlb2Ygcj09XCJudW1iZXJcIilmb3IoO3ItLSYmZmFsc2UhPT10KG5bcl0scixuKTspO2Vsc2V7dmFyIHU9RmUobikscj11Lmxlbmd0aDtoKG4sZnVuY3Rpb24obixlLG8pe3JldHVybiBlPXU/dVstLXJdOi0tcix0KG9bZV0sZSxvKX0pfXJldHVybiBufWZ1bmN0aW9uIFJ0KG4sdCxlKXt2YXIgcj0tMSx1PW4/bi5sZW5ndGg6MDtpZih0PUouY3JlYXRlQ2FsbGJhY2sodCxlLDMpLHR5cGVvZiB1PT1cIm51bWJlclwiKWZvcih2YXIgbz1YdCh1KTsrK3I8dTspb1tyXT10KG5bcl0scixuKTtcbmVsc2Ugbz1bXSxoKG4sZnVuY3Rpb24obixlLHUpe29bKytyXT10KG4sZSx1KX0pO3JldHVybiBvfWZ1bmN0aW9uIEF0KG4sdCxlKXt2YXIgdT0tMS8wLG89dTtpZih0eXBlb2YgdCE9XCJmdW5jdGlvblwiJiZlJiZlW3RdPT09biYmKHQ9bnVsbCksbnVsbD09dCYmVGUobikpe2U9LTE7Zm9yKHZhciBpPW4ubGVuZ3RoOysrZTxpOyl7dmFyIGE9bltlXTthPm8mJihvPWEpfX1lbHNlIHQ9bnVsbD09dCYma3Qobik/cjpKLmNyZWF0ZUNhbGxiYWNrKHQsZSwzKSxTdChuLGZ1bmN0aW9uKG4sZSxyKXtlPXQobixlLHIpLGU+dSYmKHU9ZSxvPW4pfSk7cmV0dXJuIG99ZnVuY3Rpb24gRHQobix0LGUscil7aWYoIW4pcmV0dXJuIGU7dmFyIHU9Mz5hcmd1bWVudHMubGVuZ3RoO3Q9Si5jcmVhdGVDYWxsYmFjayh0LHIsNCk7dmFyIG89LTEsaT1uLmxlbmd0aDtpZih0eXBlb2YgaT09XCJudW1iZXJcIilmb3IodSYmKGU9blsrK29dKTsrK288aTspZT10KGUsbltvXSxvLG4pO2Vsc2UgaChuLGZ1bmN0aW9uKG4scixvKXtlPXU/KHU9ZmFsc2Usbik6dChlLG4scixvKVxufSk7cmV0dXJuIGV9ZnVuY3Rpb24gJHQobix0LGUscil7dmFyIHU9Mz5hcmd1bWVudHMubGVuZ3RoO3JldHVybiB0PUouY3JlYXRlQ2FsbGJhY2sodCxyLDQpLEV0KG4sZnVuY3Rpb24obixyLG8pe2U9dT8odT1mYWxzZSxuKTp0KGUsbixyLG8pfSksZX1mdW5jdGlvbiBUdChuKXt2YXIgdD0tMSxlPW4/bi5sZW5ndGg6MCxyPVh0KHR5cGVvZiBlPT1cIm51bWJlclwiP2U6MCk7cmV0dXJuIFN0KG4sZnVuY3Rpb24obil7dmFyIGU9YXQoMCwrK3QpO3JbdF09cltlXSxyW2VdPW59KSxyfWZ1bmN0aW9uIEZ0KG4sdCxlKXt2YXIgcjt0PUouY3JlYXRlQ2FsbGJhY2sodCxlLDMpLGU9LTE7dmFyIHU9bj9uLmxlbmd0aDowO2lmKHR5cGVvZiB1PT1cIm51bWJlclwiKWZvcig7KytlPHUmJiEocj10KG5bZV0sZSxuKSk7KTtlbHNlIGgobixmdW5jdGlvbihuLGUsdSl7cmV0dXJuIShyPXQobixlLHUpKX0pO3JldHVybiEhcn1mdW5jdGlvbiBCdChuLHQsZSl7dmFyIHI9MCx1PW4/bi5sZW5ndGg6MDtpZih0eXBlb2YgdCE9XCJudW1iZXJcIiYmbnVsbCE9dCl7dmFyIG89LTE7XG5mb3IodD1KLmNyZWF0ZUNhbGxiYWNrKHQsZSwzKTsrK288dSYmdChuW29dLG8sbik7KXIrK31lbHNlIGlmKHI9dCxudWxsPT1yfHxlKXJldHVybiBuP25bMF06djtyZXR1cm4gcChuLDAsU2UoSWUoMCxyKSx1KSl9ZnVuY3Rpb24gV3QodCxlLHIpe2lmKHR5cGVvZiByPT1cIm51bWJlclwiKXt2YXIgdT10P3QubGVuZ3RoOjA7cj0wPnI/SWUoMCx1K3IpOnJ8fDB9ZWxzZSBpZihyKXJldHVybiByPXp0KHQsZSksdFtyXT09PWU/cjotMTtyZXR1cm4gbih0LGUscil9ZnVuY3Rpb24gcXQobix0LGUpe2lmKHR5cGVvZiB0IT1cIm51bWJlclwiJiZudWxsIT10KXt2YXIgcj0wLHU9LTEsbz1uP24ubGVuZ3RoOjA7Zm9yKHQ9Si5jcmVhdGVDYWxsYmFjayh0LGUsMyk7Kyt1PG8mJnQoblt1XSx1LG4pOylyKyt9ZWxzZSByPW51bGw9PXR8fGU/MTpJZSgwLHQpO3JldHVybiBwKG4scil9ZnVuY3Rpb24genQobix0LGUscil7dmFyIHU9MCxvPW4/bi5sZW5ndGg6dTtmb3IoZT1lP0ouY3JlYXRlQ2FsbGJhY2soZSxyLDEpOlV0LHQ9ZSh0KTt1PG87KXI9dStvPj4+MSxlKG5bcl0pPHQ/dT1yKzE6bz1yO1xucmV0dXJuIHV9ZnVuY3Rpb24gUHQobix0LGUscil7cmV0dXJuIHR5cGVvZiB0IT1cImJvb2xlYW5cIiYmbnVsbCE9dCYmKHI9ZSxlPXR5cGVvZiB0IT1cImZ1bmN0aW9uXCImJnImJnJbdF09PT1uP251bGw6dCx0PWZhbHNlKSxudWxsIT1lJiYoZT1KLmNyZWF0ZUNhbGxiYWNrKGUsciwzKSksZnQobix0LGUpfWZ1bmN0aW9uIEt0KCl7Zm9yKHZhciBuPTE8YXJndW1lbnRzLmxlbmd0aD9hcmd1bWVudHM6YXJndW1lbnRzWzBdLHQ9LTEsZT1uP0F0KFZlKG4sXCJsZW5ndGhcIikpOjAscj1YdCgwPmU/MDplKTsrK3Q8ZTspclt0XT1WZShuLHQpO3JldHVybiByfWZ1bmN0aW9uIEx0KG4sdCl7dmFyIGU9LTEscj1uP24ubGVuZ3RoOjAsdT17fTtmb3IodHx8IXJ8fFRlKG5bMF0pfHwodD1bXSk7KytlPHI7KXt2YXIgbz1uW2VdO3Q/dVtvXT10W2VdOm8mJih1W29bMF1dPW9bMV0pfXJldHVybiB1fWZ1bmN0aW9uIE10KG4sdCl7cmV0dXJuIDI8YXJndW1lbnRzLmxlbmd0aD9jdChuLDE3LHAoYXJndW1lbnRzLDIpLG51bGwsdCk6Y3QobiwxLG51bGwsbnVsbCx0KVxufWZ1bmN0aW9uIFZ0KG4sdCxlKXtmdW5jdGlvbiByKCl7YyYmdmUoYyksaT1jPXA9diwoZ3x8aCE9PXQpJiYocz1VZSgpLGE9bi5hcHBseShsLG8pLGN8fGl8fChvPWw9bnVsbCkpfWZ1bmN0aW9uIHUoKXt2YXIgZT10LShVZSgpLWYpOzA8ZT9jPV9lKHUsZSk6KGkmJnZlKGkpLGU9cCxpPWM9cD12LGUmJihzPVVlKCksYT1uLmFwcGx5KGwsbyksY3x8aXx8KG89bD1udWxsKSkpfXZhciBvLGksYSxmLGwsYyxwLHM9MCxoPWZhbHNlLGc9dHJ1ZTtpZighZHQobikpdGhyb3cgbmV3IGllO2lmKHQ9SWUoMCx0KXx8MCx0cnVlPT09ZSl2YXIgeT10cnVlLGc9ZmFsc2U7ZWxzZSB3dChlKSYmKHk9ZS5sZWFkaW5nLGg9XCJtYXhXYWl0XCJpbiBlJiYoSWUodCxlLm1heFdhaXQpfHwwKSxnPVwidHJhaWxpbmdcImluIGU/ZS50cmFpbGluZzpnKTtyZXR1cm4gZnVuY3Rpb24oKXtpZihvPWFyZ3VtZW50cyxmPVVlKCksbD10aGlzLHA9ZyYmKGN8fCF5KSxmYWxzZT09PWgpdmFyIGU9eSYmIWM7ZWxzZXtpfHx5fHwocz1mKTt2YXIgdj1oLShmLXMpLG09MD49djtcbm0/KGkmJihpPXZlKGkpKSxzPWYsYT1uLmFwcGx5KGwsbykpOml8fChpPV9lKHIsdikpfXJldHVybiBtJiZjP2M9dmUoYyk6Y3x8dD09PWh8fChjPV9lKHUsdCkpLGUmJihtPXRydWUsYT1uLmFwcGx5KGwsbykpLCFtfHxjfHxpfHwobz1sPW51bGwpLGF9fWZ1bmN0aW9uIFV0KG4pe3JldHVybiBufWZ1bmN0aW9uIEd0KG4sdCxlKXt2YXIgcj10cnVlLHU9dCYmYnQodCk7dCYmKGV8fHUubGVuZ3RoKXx8KG51bGw9PWUmJihlPXQpLG89USx0PW4sbj1KLHU9YnQodCkpLGZhbHNlPT09ZT9yPWZhbHNlOnd0KGUpJiZcImNoYWluXCJpbiBlJiYocj1lLmNoYWluKTt2YXIgbz1uLGk9ZHQobyk7U3QodSxmdW5jdGlvbihlKXt2YXIgdT1uW2VdPXRbZV07aSYmKG8ucHJvdG90eXBlW2VdPWZ1bmN0aW9uKCl7dmFyIHQ9dGhpcy5fX2NoYWluX18sZT10aGlzLl9fd3JhcHBlZF9fLGk9W2VdO2lmKGJlLmFwcGx5KGksYXJndW1lbnRzKSxpPXUuYXBwbHkobixpKSxyfHx0KXtpZihlPT09aSYmd3QoaSkpcmV0dXJuIHRoaXM7XG5pPW5ldyBvKGkpLGkuX19jaGFpbl9fPXR9cmV0dXJuIGl9KX0pfWZ1bmN0aW9uIEh0KCl7fWZ1bmN0aW9uIEp0KG4pe3JldHVybiBmdW5jdGlvbih0KXtyZXR1cm4gdFtuXX19ZnVuY3Rpb24gUXQoKXtyZXR1cm4gdGhpcy5fX3dyYXBwZWRfX31lPWU/WS5kZWZhdWx0cyhHLk9iamVjdCgpLGUsWS5waWNrKEcsQSkpOkc7dmFyIFh0PWUuQXJyYXksWXQ9ZS5Cb29sZWFuLFp0PWUuRGF0ZSxuZT1lLkZ1bmN0aW9uLHRlPWUuTWF0aCxlZT1lLk51bWJlcixyZT1lLk9iamVjdCx1ZT1lLlJlZ0V4cCxvZT1lLlN0cmluZyxpZT1lLlR5cGVFcnJvcixhZT1bXSxmZT1yZS5wcm90b3R5cGUsbGU9ZS5fLGNlPWZlLnRvU3RyaW5nLHBlPXVlKFwiXlwiK29lKGNlKS5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxdXFxcXF0vZyxcIlxcXFwkJlwiKS5yZXBsYWNlKC90b1N0cmluZ3wgZm9yIFteXFxdXSsvZyxcIi4qP1wiKStcIiRcIiksc2U9dGUuY2VpbCx2ZT1lLmNsZWFyVGltZW91dCxoZT10ZS5mbG9vcixnZT1uZS5wcm90b3R5cGUudG9TdHJpbmcseWU9dnQoeWU9cmUuZ2V0UHJvdG90eXBlT2YpJiZ5ZSxtZT1mZS5oYXNPd25Qcm9wZXJ0eSxiZT1hZS5wdXNoLF9lPWUuc2V0VGltZW91dCxkZT1hZS5zcGxpY2Usd2U9YWUudW5zaGlmdCxqZT1mdW5jdGlvbigpe3RyeXt2YXIgbj17fSx0PXZ0KHQ9cmUuZGVmaW5lUHJvcGVydHkpJiZ0LGU9dChuLG4sbikmJnRcbn1jYXRjaChyKXt9cmV0dXJuIGV9KCksa2U9dnQoa2U9cmUuY3JlYXRlKSYma2UseGU9dnQoeGU9WHQuaXNBcnJheSkmJnhlLENlPWUuaXNGaW5pdGUsT2U9ZS5pc05hTixOZT12dChOZT1yZS5rZXlzKSYmTmUsSWU9dGUubWF4LFNlPXRlLm1pbixFZT1lLnBhcnNlSW50LFJlPXRlLnJhbmRvbSxBZT17fTtBZVskXT1YdCxBZVtUXT1ZdCxBZVtGXT1adCxBZVtCXT1uZSxBZVtxXT1yZSxBZVtXXT1lZSxBZVt6XT11ZSxBZVtQXT1vZSxRLnByb3RvdHlwZT1KLnByb3RvdHlwZTt2YXIgRGU9Si5zdXBwb3J0PXt9O0RlLmZ1bmNEZWNvbXA9IXZ0KGUuYSkmJkUudGVzdChzKSxEZS5mdW5jTmFtZXM9dHlwZW9mIG5lLm5hbWU9PVwic3RyaW5nXCIsSi50ZW1wbGF0ZVNldHRpbmdzPXtlc2NhcGU6LzwlLShbXFxzXFxTXSs/KSU+L2csZXZhbHVhdGU6LzwlKFtcXHNcXFNdKz8pJT4vZyxpbnRlcnBvbGF0ZTpOLHZhcmlhYmxlOlwiXCIsaW1wb3J0czp7XzpKfX0sa2V8fChudD1mdW5jdGlvbigpe2Z1bmN0aW9uIG4oKXt9cmV0dXJuIGZ1bmN0aW9uKHQpe2lmKHd0KHQpKXtuLnByb3RvdHlwZT10O1xudmFyIHI9bmV3IG47bi5wcm90b3R5cGU9bnVsbH1yZXR1cm4gcnx8ZS5PYmplY3QoKX19KCkpO3ZhciAkZT1qZT9mdW5jdGlvbihuLHQpe00udmFsdWU9dCxqZShuLFwiX19iaW5kRGF0YV9fXCIsTSl9Okh0LFRlPXhlfHxmdW5jdGlvbihuKXtyZXR1cm4gbiYmdHlwZW9mIG49PVwib2JqZWN0XCImJnR5cGVvZiBuLmxlbmd0aD09XCJudW1iZXJcIiYmY2UuY2FsbChuKT09JHx8ZmFsc2V9LEZlPU5lP2Z1bmN0aW9uKG4pe3JldHVybiB3dChuKT9OZShuKTpbXX06SCxCZT17XCImXCI6XCImYW1wO1wiLFwiPFwiOlwiJmx0O1wiLFwiPlwiOlwiJmd0O1wiLCdcIic6XCImcXVvdDtcIixcIidcIjpcIiYjMzk7XCJ9LFdlPV90KEJlKSxxZT11ZShcIihcIitGZShXZSkuam9pbihcInxcIikrXCIpXCIsXCJnXCIpLHplPXVlKFwiW1wiK0ZlKEJlKS5qb2luKFwiXCIpK1wiXVwiLFwiZ1wiKSxQZT15ZT9mdW5jdGlvbihuKXtpZighbnx8Y2UuY2FsbChuKSE9cSlyZXR1cm4gZmFsc2U7dmFyIHQ9bi52YWx1ZU9mLGU9dnQodCkmJihlPXllKHQpKSYmeWUoZSk7cmV0dXJuIGU/bj09ZXx8eWUobik9PWU6aHQobilcbn06aHQsS2U9bHQoZnVuY3Rpb24obix0LGUpe21lLmNhbGwobixlKT9uW2VdKys6bltlXT0xfSksTGU9bHQoZnVuY3Rpb24obix0LGUpeyhtZS5jYWxsKG4sZSk/bltlXTpuW2VdPVtdKS5wdXNoKHQpfSksTWU9bHQoZnVuY3Rpb24obix0LGUpe25bZV09dH0pLFZlPVJ0LFVlPXZ0KFVlPVp0Lm5vdykmJlVlfHxmdW5jdGlvbigpe3JldHVybihuZXcgWnQpLmdldFRpbWUoKX0sR2U9OD09RWUoZCtcIjA4XCIpP0VlOmZ1bmN0aW9uKG4sdCl7cmV0dXJuIEVlKGt0KG4pP24ucmVwbGFjZShJLFwiXCIpOm4sdHx8MCl9O3JldHVybiBKLmFmdGVyPWZ1bmN0aW9uKG4sdCl7aWYoIWR0KHQpKXRocm93IG5ldyBpZTtyZXR1cm4gZnVuY3Rpb24oKXtyZXR1cm4gMT4tLW4/dC5hcHBseSh0aGlzLGFyZ3VtZW50cyk6dm9pZCAwfX0sSi5hc3NpZ249VSxKLmF0PWZ1bmN0aW9uKG4pe2Zvcih2YXIgdD1hcmd1bWVudHMsZT0tMSxyPXV0KHQsdHJ1ZSxmYWxzZSwxKSx0PXRbMl0mJnRbMl1bdFsxXV09PT1uPzE6ci5sZW5ndGgsdT1YdCh0KTsrK2U8dDspdVtlXT1uW3JbZV1dO1xucmV0dXJuIHV9LEouYmluZD1NdCxKLmJpbmRBbGw9ZnVuY3Rpb24obil7Zm9yKHZhciB0PTE8YXJndW1lbnRzLmxlbmd0aD91dChhcmd1bWVudHMsdHJ1ZSxmYWxzZSwxKTpidChuKSxlPS0xLHI9dC5sZW5ndGg7KytlPHI7KXt2YXIgdT10W2VdO25bdV09Y3Qoblt1XSwxLG51bGwsbnVsbCxuKX1yZXR1cm4gbn0sSi5iaW5kS2V5PWZ1bmN0aW9uKG4sdCl7cmV0dXJuIDI8YXJndW1lbnRzLmxlbmd0aD9jdCh0LDE5LHAoYXJndW1lbnRzLDIpLG51bGwsbik6Y3QodCwzLG51bGwsbnVsbCxuKX0sSi5jaGFpbj1mdW5jdGlvbihuKXtyZXR1cm4gbj1uZXcgUShuKSxuLl9fY2hhaW5fXz10cnVlLG59LEouY29tcGFjdD1mdW5jdGlvbihuKXtmb3IodmFyIHQ9LTEsZT1uP24ubGVuZ3RoOjAscj1bXTsrK3Q8ZTspe3ZhciB1PW5bdF07dSYmci5wdXNoKHUpfXJldHVybiByfSxKLmNvbXBvc2U9ZnVuY3Rpb24oKXtmb3IodmFyIG49YXJndW1lbnRzLHQ9bi5sZW5ndGg7dC0tOylpZighZHQoblt0XSkpdGhyb3cgbmV3IGllO1xucmV0dXJuIGZ1bmN0aW9uKCl7Zm9yKHZhciB0PWFyZ3VtZW50cyxlPW4ubGVuZ3RoO2UtLTspdD1bbltlXS5hcHBseSh0aGlzLHQpXTtyZXR1cm4gdFswXX19LEouY29uc3RhbnQ9ZnVuY3Rpb24obil7cmV0dXJuIGZ1bmN0aW9uKCl7cmV0dXJuIG59fSxKLmNvdW50Qnk9S2UsSi5jcmVhdGU9ZnVuY3Rpb24obix0KXt2YXIgZT1udChuKTtyZXR1cm4gdD9VKGUsdCk6ZX0sSi5jcmVhdGVDYWxsYmFjaz1mdW5jdGlvbihuLHQsZSl7dmFyIHI9dHlwZW9mIG47aWYobnVsbD09bnx8XCJmdW5jdGlvblwiPT1yKXJldHVybiB0dChuLHQsZSk7aWYoXCJvYmplY3RcIiE9cilyZXR1cm4gSnQobik7dmFyIHU9RmUobiksbz11WzBdLGk9bltvXTtyZXR1cm4gMSE9dS5sZW5ndGh8fGkhPT1pfHx3dChpKT9mdW5jdGlvbih0KXtmb3IodmFyIGU9dS5sZW5ndGgscj1mYWxzZTtlLS0mJihyPW90KHRbdVtlXV0sblt1W2VdXSxudWxsLHRydWUpKTspO3JldHVybiByfTpmdW5jdGlvbihuKXtyZXR1cm4gbj1uW29dLGk9PT1uJiYoMCE9PWl8fDEvaT09MS9uKVxufX0sSi5jdXJyeT1mdW5jdGlvbihuLHQpe3JldHVybiB0PXR5cGVvZiB0PT1cIm51bWJlclwiP3Q6K3R8fG4ubGVuZ3RoLGN0KG4sNCxudWxsLG51bGwsbnVsbCx0KX0sSi5kZWJvdW5jZT1WdCxKLmRlZmF1bHRzPV8sSi5kZWZlcj1mdW5jdGlvbihuKXtpZighZHQobikpdGhyb3cgbmV3IGllO3ZhciB0PXAoYXJndW1lbnRzLDEpO3JldHVybiBfZShmdW5jdGlvbigpe24uYXBwbHkodix0KX0sMSl9LEouZGVsYXk9ZnVuY3Rpb24obix0KXtpZighZHQobikpdGhyb3cgbmV3IGllO3ZhciBlPXAoYXJndW1lbnRzLDIpO3JldHVybiBfZShmdW5jdGlvbigpe24uYXBwbHkodixlKX0sdCl9LEouZGlmZmVyZW5jZT1mdW5jdGlvbihuKXtyZXR1cm4gcnQobix1dChhcmd1bWVudHMsdHJ1ZSx0cnVlLDEpKX0sSi5maWx0ZXI9TnQsSi5mbGF0dGVuPWZ1bmN0aW9uKG4sdCxlLHIpe3JldHVybiB0eXBlb2YgdCE9XCJib29sZWFuXCImJm51bGwhPXQmJihyPWUsZT10eXBlb2YgdCE9XCJmdW5jdGlvblwiJiZyJiZyW3RdPT09bj9udWxsOnQsdD1mYWxzZSksbnVsbCE9ZSYmKG49UnQobixlLHIpKSx1dChuLHQpXG59LEouZm9yRWFjaD1TdCxKLmZvckVhY2hSaWdodD1FdCxKLmZvckluPWcsSi5mb3JJblJpZ2h0PWZ1bmN0aW9uKG4sdCxlKXt2YXIgcj1bXTtnKG4sZnVuY3Rpb24obix0KXtyLnB1c2godCxuKX0pO3ZhciB1PXIubGVuZ3RoO2Zvcih0PXR0KHQsZSwzKTt1LS0mJmZhbHNlIT09dChyW3UtLV0sclt1XSxuKTspO3JldHVybiBufSxKLmZvck93bj1oLEouZm9yT3duUmlnaHQ9bXQsSi5mdW5jdGlvbnM9YnQsSi5ncm91cEJ5PUxlLEouaW5kZXhCeT1NZSxKLmluaXRpYWw9ZnVuY3Rpb24obix0LGUpe3ZhciByPTAsdT1uP24ubGVuZ3RoOjA7aWYodHlwZW9mIHQhPVwibnVtYmVyXCImJm51bGwhPXQpe3ZhciBvPXU7Zm9yKHQ9Si5jcmVhdGVDYWxsYmFjayh0LGUsMyk7by0tJiZ0KG5bb10sbyxuKTspcisrfWVsc2Ugcj1udWxsPT10fHxlPzE6dHx8cjtyZXR1cm4gcChuLDAsU2UoSWUoMCx1LXIpLHUpKX0sSi5pbnRlcnNlY3Rpb249ZnVuY3Rpb24oKXtmb3IodmFyIGU9W10scj0tMSx1PWFyZ3VtZW50cy5sZW5ndGgsaT1hKCksZj1zdCgpLHA9Zj09PW4scz1hKCk7KytyPHU7KXt2YXIgdj1hcmd1bWVudHNbcl07XG4oVGUodil8fHl0KHYpKSYmKGUucHVzaCh2KSxpLnB1c2gocCYmdi5sZW5ndGg+PWImJm8ocj9lW3JdOnMpKSl9dmFyIHA9ZVswXSxoPS0xLGc9cD9wLmxlbmd0aDowLHk9W107bjpmb3IoOysraDxnOyl7dmFyIG09aVswXSx2PXBbaF07aWYoMD4obT90KG0sdik6ZihzLHYpKSl7Zm9yKHI9dSwobXx8cykucHVzaCh2KTstLXI7KWlmKG09aVtyXSwwPihtP3QobSx2KTpmKGVbcl0sdikpKWNvbnRpbnVlIG47eS5wdXNoKHYpfX1mb3IoO3UtLTspKG09aVt1XSkmJmMobSk7cmV0dXJuIGwoaSksbChzKSx5fSxKLmludmVydD1fdCxKLmludm9rZT1mdW5jdGlvbihuLHQpe3ZhciBlPXAoYXJndW1lbnRzLDIpLHI9LTEsdT10eXBlb2YgdD09XCJmdW5jdGlvblwiLG89bj9uLmxlbmd0aDowLGk9WHQodHlwZW9mIG89PVwibnVtYmVyXCI/bzowKTtyZXR1cm4gU3QobixmdW5jdGlvbihuKXtpWysrcl09KHU/dDpuW3RdKS5hcHBseShuLGUpfSksaX0sSi5rZXlzPUZlLEoubWFwPVJ0LEoubWFwVmFsdWVzPWZ1bmN0aW9uKG4sdCxlKXt2YXIgcj17fTtcbnJldHVybiB0PUouY3JlYXRlQ2FsbGJhY2sodCxlLDMpLGgobixmdW5jdGlvbihuLGUsdSl7cltlXT10KG4sZSx1KX0pLHJ9LEoubWF4PUF0LEoubWVtb2l6ZT1mdW5jdGlvbihuLHQpe2Z1bmN0aW9uIGUoKXt2YXIgcj1lLmNhY2hlLHU9dD90LmFwcGx5KHRoaXMsYXJndW1lbnRzKTptK2FyZ3VtZW50c1swXTtyZXR1cm4gbWUuY2FsbChyLHUpP3JbdV06clt1XT1uLmFwcGx5KHRoaXMsYXJndW1lbnRzKX1pZighZHQobikpdGhyb3cgbmV3IGllO3JldHVybiBlLmNhY2hlPXt9LGV9LEoubWVyZ2U9ZnVuY3Rpb24obil7dmFyIHQ9YXJndW1lbnRzLGU9MjtpZighd3QobikpcmV0dXJuIG47aWYoXCJudW1iZXJcIiE9dHlwZW9mIHRbMl0mJihlPXQubGVuZ3RoKSwzPGUmJlwiZnVuY3Rpb25cIj09dHlwZW9mIHRbZS0yXSl2YXIgcj10dCh0Wy0tZS0xXSx0W2UtLV0sMik7ZWxzZSAyPGUmJlwiZnVuY3Rpb25cIj09dHlwZW9mIHRbZS0xXSYmKHI9dFstLWVdKTtmb3IodmFyIHQ9cChhcmd1bWVudHMsMSxlKSx1PS0xLG89YSgpLGk9YSgpOysrdTxlOylpdChuLHRbdV0scixvLGkpO1xucmV0dXJuIGwobyksbChpKSxufSxKLm1pbj1mdW5jdGlvbihuLHQsZSl7dmFyIHU9MS8wLG89dTtpZih0eXBlb2YgdCE9XCJmdW5jdGlvblwiJiZlJiZlW3RdPT09biYmKHQ9bnVsbCksbnVsbD09dCYmVGUobikpe2U9LTE7Zm9yKHZhciBpPW4ubGVuZ3RoOysrZTxpOyl7dmFyIGE9bltlXTthPG8mJihvPWEpfX1lbHNlIHQ9bnVsbD09dCYma3Qobik/cjpKLmNyZWF0ZUNhbGxiYWNrKHQsZSwzKSxTdChuLGZ1bmN0aW9uKG4sZSxyKXtlPXQobixlLHIpLGU8dSYmKHU9ZSxvPW4pfSk7cmV0dXJuIG99LEoub21pdD1mdW5jdGlvbihuLHQsZSl7dmFyIHI9e307aWYodHlwZW9mIHQhPVwiZnVuY3Rpb25cIil7dmFyIHU9W107ZyhuLGZ1bmN0aW9uKG4sdCl7dS5wdXNoKHQpfSk7Zm9yKHZhciB1PXJ0KHUsdXQoYXJndW1lbnRzLHRydWUsZmFsc2UsMSkpLG89LTEsaT11Lmxlbmd0aDsrK288aTspe3ZhciBhPXVbb107clthXT1uW2FdfX1lbHNlIHQ9Si5jcmVhdGVDYWxsYmFjayh0LGUsMyksZyhuLGZ1bmN0aW9uKG4sZSx1KXt0KG4sZSx1KXx8KHJbZV09bilcbn0pO3JldHVybiByfSxKLm9uY2U9ZnVuY3Rpb24obil7dmFyIHQsZTtpZighZHQobikpdGhyb3cgbmV3IGllO3JldHVybiBmdW5jdGlvbigpe3JldHVybiB0P2U6KHQ9dHJ1ZSxlPW4uYXBwbHkodGhpcyxhcmd1bWVudHMpLG49bnVsbCxlKX19LEoucGFpcnM9ZnVuY3Rpb24obil7Zm9yKHZhciB0PS0xLGU9RmUobikscj1lLmxlbmd0aCx1PVh0KHIpOysrdDxyOyl7dmFyIG89ZVt0XTt1W3RdPVtvLG5bb11dfXJldHVybiB1fSxKLnBhcnRpYWw9ZnVuY3Rpb24obil7cmV0dXJuIGN0KG4sMTYscChhcmd1bWVudHMsMSkpfSxKLnBhcnRpYWxSaWdodD1mdW5jdGlvbihuKXtyZXR1cm4gY3QobiwzMixudWxsLHAoYXJndW1lbnRzLDEpKX0sSi5waWNrPWZ1bmN0aW9uKG4sdCxlKXt2YXIgcj17fTtpZih0eXBlb2YgdCE9XCJmdW5jdGlvblwiKWZvcih2YXIgdT0tMSxvPXV0KGFyZ3VtZW50cyx0cnVlLGZhbHNlLDEpLGk9d3Qobik/by5sZW5ndGg6MDsrK3U8aTspe3ZhciBhPW9bdV07YSBpbiBuJiYoclthXT1uW2FdKVxufWVsc2UgdD1KLmNyZWF0ZUNhbGxiYWNrKHQsZSwzKSxnKG4sZnVuY3Rpb24obixlLHUpe3QobixlLHUpJiYocltlXT1uKX0pO3JldHVybiByfSxKLnBsdWNrPVZlLEoucHJvcGVydHk9SnQsSi5wdWxsPWZ1bmN0aW9uKG4pe2Zvcih2YXIgdD1hcmd1bWVudHMsZT0wLHI9dC5sZW5ndGgsdT1uP24ubGVuZ3RoOjA7KytlPHI7KWZvcih2YXIgbz0tMSxpPXRbZV07KytvPHU7KW5bb109PT1pJiYoZGUuY2FsbChuLG8tLSwxKSx1LS0pO3JldHVybiBufSxKLnJhbmdlPWZ1bmN0aW9uKG4sdCxlKXtuPStufHwwLGU9dHlwZW9mIGU9PVwibnVtYmVyXCI/ZTorZXx8MSxudWxsPT10JiYodD1uLG49MCk7dmFyIHI9LTE7dD1JZSgwLHNlKCh0LW4pLyhlfHwxKSkpO2Zvcih2YXIgdT1YdCh0KTsrK3I8dDspdVtyXT1uLG4rPWU7cmV0dXJuIHV9LEoucmVqZWN0PWZ1bmN0aW9uKG4sdCxlKXtyZXR1cm4gdD1KLmNyZWF0ZUNhbGxiYWNrKHQsZSwzKSxOdChuLGZ1bmN0aW9uKG4sZSxyKXtyZXR1cm4hdChuLGUscilcbn0pfSxKLnJlbW92ZT1mdW5jdGlvbihuLHQsZSl7dmFyIHI9LTEsdT1uP24ubGVuZ3RoOjAsbz1bXTtmb3IodD1KLmNyZWF0ZUNhbGxiYWNrKHQsZSwzKTsrK3I8dTspZT1uW3JdLHQoZSxyLG4pJiYoby5wdXNoKGUpLGRlLmNhbGwobixyLS0sMSksdS0tKTtyZXR1cm4gb30sSi5yZXN0PXF0LEouc2h1ZmZsZT1UdCxKLnNvcnRCeT1mdW5jdGlvbihuLHQsZSl7dmFyIHI9LTEsbz1UZSh0KSxpPW4/bi5sZW5ndGg6MCxwPVh0KHR5cGVvZiBpPT1cIm51bWJlclwiP2k6MCk7Zm9yKG98fCh0PUouY3JlYXRlQ2FsbGJhY2sodCxlLDMpKSxTdChuLGZ1bmN0aW9uKG4sZSx1KXt2YXIgaT1wWysrcl09ZigpO28/aS5tPVJ0KHQsZnVuY3Rpb24odCl7cmV0dXJuIG5bdF19KTooaS5tPWEoKSlbMF09dChuLGUsdSksaS5uPXIsaS5vPW59KSxpPXAubGVuZ3RoLHAuc29ydCh1KTtpLS07KW49cFtpXSxwW2ldPW4ubyxvfHxsKG4ubSksYyhuKTtyZXR1cm4gcH0sSi50YXA9ZnVuY3Rpb24obix0KXtyZXR1cm4gdChuKSxuXG59LEoudGhyb3R0bGU9ZnVuY3Rpb24obix0LGUpe3ZhciByPXRydWUsdT10cnVlO2lmKCFkdChuKSl0aHJvdyBuZXcgaWU7cmV0dXJuIGZhbHNlPT09ZT9yPWZhbHNlOnd0KGUpJiYocj1cImxlYWRpbmdcImluIGU/ZS5sZWFkaW5nOnIsdT1cInRyYWlsaW5nXCJpbiBlP2UudHJhaWxpbmc6dSksTC5sZWFkaW5nPXIsTC5tYXhXYWl0PXQsTC50cmFpbGluZz11LFZ0KG4sdCxMKX0sSi50aW1lcz1mdW5jdGlvbihuLHQsZSl7bj0tMTwobj0rbik/bjowO3ZhciByPS0xLHU9WHQobik7Zm9yKHQ9dHQodCxlLDEpOysrcjxuOyl1W3JdPXQocik7cmV0dXJuIHV9LEoudG9BcnJheT1mdW5jdGlvbihuKXtyZXR1cm4gbiYmdHlwZW9mIG4ubGVuZ3RoPT1cIm51bWJlclwiP3Aobik6eHQobil9LEoudHJhbnNmb3JtPWZ1bmN0aW9uKG4sdCxlLHIpe3ZhciB1PVRlKG4pO2lmKG51bGw9PWUpaWYodSllPVtdO2Vsc2V7dmFyIG89biYmbi5jb25zdHJ1Y3RvcjtlPW50KG8mJm8ucHJvdG90eXBlKX1yZXR1cm4gdCYmKHQ9Si5jcmVhdGVDYWxsYmFjayh0LHIsNCksKHU/U3Q6aCkobixmdW5jdGlvbihuLHIsdSl7cmV0dXJuIHQoZSxuLHIsdSlcbn0pKSxlfSxKLnVuaW9uPWZ1bmN0aW9uKCl7cmV0dXJuIGZ0KHV0KGFyZ3VtZW50cyx0cnVlLHRydWUpKX0sSi51bmlxPVB0LEoudmFsdWVzPXh0LEoud2hlcmU9TnQsSi53aXRob3V0PWZ1bmN0aW9uKG4pe3JldHVybiBydChuLHAoYXJndW1lbnRzLDEpKX0sSi53cmFwPWZ1bmN0aW9uKG4sdCl7cmV0dXJuIGN0KHQsMTYsW25dKX0sSi54b3I9ZnVuY3Rpb24oKXtmb3IodmFyIG49LTEsdD1hcmd1bWVudHMubGVuZ3RoOysrbjx0Oyl7dmFyIGU9YXJndW1lbnRzW25dO2lmKFRlKGUpfHx5dChlKSl2YXIgcj1yP2Z0KHJ0KHIsZSkuY29uY2F0KHJ0KGUscikpKTplfXJldHVybiByfHxbXX0sSi56aXA9S3QsSi56aXBPYmplY3Q9THQsSi5jb2xsZWN0PVJ0LEouZHJvcD1xdCxKLmVhY2g9U3QsSi5lYWNoUmlnaHQ9RXQsSi5leHRlbmQ9VSxKLm1ldGhvZHM9YnQsSi5vYmplY3Q9THQsSi5zZWxlY3Q9TnQsSi50YWlsPXF0LEoudW5pcXVlPVB0LEoudW56aXA9S3QsR3QoSiksSi5jbG9uZT1mdW5jdGlvbihuLHQsZSxyKXtyZXR1cm4gdHlwZW9mIHQhPVwiYm9vbGVhblwiJiZudWxsIT10JiYocj1lLGU9dCx0PWZhbHNlKSxaKG4sdCx0eXBlb2YgZT09XCJmdW5jdGlvblwiJiZ0dChlLHIsMSkpXG59LEouY2xvbmVEZWVwPWZ1bmN0aW9uKG4sdCxlKXtyZXR1cm4gWihuLHRydWUsdHlwZW9mIHQ9PVwiZnVuY3Rpb25cIiYmdHQodCxlLDEpKX0sSi5jb250YWlucz1DdCxKLmVzY2FwZT1mdW5jdGlvbihuKXtyZXR1cm4gbnVsbD09bj9cIlwiOm9lKG4pLnJlcGxhY2UoemUscHQpfSxKLmV2ZXJ5PU90LEouZmluZD1JdCxKLmZpbmRJbmRleD1mdW5jdGlvbihuLHQsZSl7dmFyIHI9LTEsdT1uP24ubGVuZ3RoOjA7Zm9yKHQ9Si5jcmVhdGVDYWxsYmFjayh0LGUsMyk7KytyPHU7KWlmKHQobltyXSxyLG4pKXJldHVybiByO3JldHVybi0xfSxKLmZpbmRLZXk9ZnVuY3Rpb24obix0LGUpe3ZhciByO3JldHVybiB0PUouY3JlYXRlQ2FsbGJhY2sodCxlLDMpLGgobixmdW5jdGlvbihuLGUsdSl7cmV0dXJuIHQobixlLHUpPyhyPWUsZmFsc2UpOnZvaWQgMH0pLHJ9LEouZmluZExhc3Q9ZnVuY3Rpb24obix0LGUpe3ZhciByO3JldHVybiB0PUouY3JlYXRlQ2FsbGJhY2sodCxlLDMpLEV0KG4sZnVuY3Rpb24obixlLHUpe3JldHVybiB0KG4sZSx1KT8ocj1uLGZhbHNlKTp2b2lkIDBcbn0pLHJ9LEouZmluZExhc3RJbmRleD1mdW5jdGlvbihuLHQsZSl7dmFyIHI9bj9uLmxlbmd0aDowO2Zvcih0PUouY3JlYXRlQ2FsbGJhY2sodCxlLDMpO3ItLTspaWYodChuW3JdLHIsbikpcmV0dXJuIHI7cmV0dXJuLTF9LEouZmluZExhc3RLZXk9ZnVuY3Rpb24obix0LGUpe3ZhciByO3JldHVybiB0PUouY3JlYXRlQ2FsbGJhY2sodCxlLDMpLG10KG4sZnVuY3Rpb24obixlLHUpe3JldHVybiB0KG4sZSx1KT8ocj1lLGZhbHNlKTp2b2lkIDB9KSxyfSxKLmhhcz1mdW5jdGlvbihuLHQpe3JldHVybiBuP21lLmNhbGwobix0KTpmYWxzZX0sSi5pZGVudGl0eT1VdCxKLmluZGV4T2Y9V3QsSi5pc0FyZ3VtZW50cz15dCxKLmlzQXJyYXk9VGUsSi5pc0Jvb2xlYW49ZnVuY3Rpb24obil7cmV0dXJuIHRydWU9PT1ufHxmYWxzZT09PW58fG4mJnR5cGVvZiBuPT1cIm9iamVjdFwiJiZjZS5jYWxsKG4pPT1UfHxmYWxzZX0sSi5pc0RhdGU9ZnVuY3Rpb24obil7cmV0dXJuIG4mJnR5cGVvZiBuPT1cIm9iamVjdFwiJiZjZS5jYWxsKG4pPT1GfHxmYWxzZVxufSxKLmlzRWxlbWVudD1mdW5jdGlvbihuKXtyZXR1cm4gbiYmMT09PW4ubm9kZVR5cGV8fGZhbHNlfSxKLmlzRW1wdHk9ZnVuY3Rpb24obil7dmFyIHQ9dHJ1ZTtpZighbilyZXR1cm4gdDt2YXIgZT1jZS5jYWxsKG4pLHI9bi5sZW5ndGg7cmV0dXJuIGU9PSR8fGU9PVB8fGU9PUR8fGU9PXEmJnR5cGVvZiByPT1cIm51bWJlclwiJiZkdChuLnNwbGljZSk/IXI6KGgobixmdW5jdGlvbigpe3JldHVybiB0PWZhbHNlfSksdCl9LEouaXNFcXVhbD1mdW5jdGlvbihuLHQsZSxyKXtyZXR1cm4gb3Qobix0LHR5cGVvZiBlPT1cImZ1bmN0aW9uXCImJnR0KGUsciwyKSl9LEouaXNGaW5pdGU9ZnVuY3Rpb24obil7cmV0dXJuIENlKG4pJiYhT2UocGFyc2VGbG9hdChuKSl9LEouaXNGdW5jdGlvbj1kdCxKLmlzTmFOPWZ1bmN0aW9uKG4pe3JldHVybiBqdChuKSYmbiE9K259LEouaXNOdWxsPWZ1bmN0aW9uKG4pe3JldHVybiBudWxsPT09bn0sSi5pc051bWJlcj1qdCxKLmlzT2JqZWN0PXd0LEouaXNQbGFpbk9iamVjdD1QZSxKLmlzUmVnRXhwPWZ1bmN0aW9uKG4pe3JldHVybiBuJiZ0eXBlb2Ygbj09XCJvYmplY3RcIiYmY2UuY2FsbChuKT09enx8ZmFsc2Vcbn0sSi5pc1N0cmluZz1rdCxKLmlzVW5kZWZpbmVkPWZ1bmN0aW9uKG4pe3JldHVybiB0eXBlb2Ygbj09XCJ1bmRlZmluZWRcIn0sSi5sYXN0SW5kZXhPZj1mdW5jdGlvbihuLHQsZSl7dmFyIHI9bj9uLmxlbmd0aDowO2Zvcih0eXBlb2YgZT09XCJudW1iZXJcIiYmKHI9KDA+ZT9JZSgwLHIrZSk6U2UoZSxyLTEpKSsxKTtyLS07KWlmKG5bcl09PT10KXJldHVybiByO3JldHVybi0xfSxKLm1peGluPUd0LEoubm9Db25mbGljdD1mdW5jdGlvbigpe3JldHVybiBlLl89bGUsdGhpc30sSi5ub29wPUh0LEoubm93PVVlLEoucGFyc2VJbnQ9R2UsSi5yYW5kb209ZnVuY3Rpb24obix0LGUpe3ZhciByPW51bGw9PW4sdT1udWxsPT10O3JldHVybiBudWxsPT1lJiYodHlwZW9mIG49PVwiYm9vbGVhblwiJiZ1PyhlPW4sbj0xKTp1fHx0eXBlb2YgdCE9XCJib29sZWFuXCJ8fChlPXQsdT10cnVlKSksciYmdSYmKHQ9MSksbj0rbnx8MCx1Pyh0PW4sbj0wKTp0PSt0fHwwLGV8fG4lMXx8dCUxPyhlPVJlKCksU2UobitlKih0LW4rcGFyc2VGbG9hdChcIjFlLVwiKygoZStcIlwiKS5sZW5ndGgtMSkpKSx0KSk6YXQobix0KVxufSxKLnJlZHVjZT1EdCxKLnJlZHVjZVJpZ2h0PSR0LEoucmVzdWx0PWZ1bmN0aW9uKG4sdCl7aWYobil7dmFyIGU9blt0XTtyZXR1cm4gZHQoZSk/blt0XSgpOmV9fSxKLnJ1bkluQ29udGV4dD1zLEouc2l6ZT1mdW5jdGlvbihuKXt2YXIgdD1uP24ubGVuZ3RoOjA7cmV0dXJuIHR5cGVvZiB0PT1cIm51bWJlclwiP3Q6RmUobikubGVuZ3RofSxKLnNvbWU9RnQsSi5zb3J0ZWRJbmRleD16dCxKLnRlbXBsYXRlPWZ1bmN0aW9uKG4sdCxlKXt2YXIgcj1KLnRlbXBsYXRlU2V0dGluZ3M7bj1vZShufHxcIlwiKSxlPV8oe30sZSxyKTt2YXIgdSxvPV8oe30sZS5pbXBvcnRzLHIuaW1wb3J0cykscj1GZShvKSxvPXh0KG8pLGE9MCxmPWUuaW50ZXJwb2xhdGV8fFMsbD1cIl9fcCs9J1wiLGY9dWUoKGUuZXNjYXBlfHxTKS5zb3VyY2UrXCJ8XCIrZi5zb3VyY2UrXCJ8XCIrKGY9PT1OP3g6Uykuc291cmNlK1wifFwiKyhlLmV2YWx1YXRlfHxTKS5zb3VyY2UrXCJ8JFwiLFwiZ1wiKTtuLnJlcGxhY2UoZixmdW5jdGlvbih0LGUscixvLGYsYyl7cmV0dXJuIHJ8fChyPW8pLGwrPW4uc2xpY2UoYSxjKS5yZXBsYWNlKFIsaSksZSYmKGwrPVwiJytfX2UoXCIrZStcIikrJ1wiKSxmJiYodT10cnVlLGwrPVwiJztcIitmK1wiO1xcbl9fcCs9J1wiKSxyJiYobCs9XCInKygoX190PShcIityK1wiKSk9PW51bGw/Jyc6X190KSsnXCIpLGE9Yyt0Lmxlbmd0aCx0XG59KSxsKz1cIic7XCIsZj1lPWUudmFyaWFibGUsZnx8KGU9XCJvYmpcIixsPVwid2l0aChcIitlK1wiKXtcIitsK1wifVwiKSxsPSh1P2wucmVwbGFjZSh3LFwiXCIpOmwpLnJlcGxhY2UoaixcIiQxXCIpLnJlcGxhY2UoayxcIiQxO1wiKSxsPVwiZnVuY3Rpb24oXCIrZStcIil7XCIrKGY/XCJcIjplK1wifHwoXCIrZStcIj17fSk7XCIpK1widmFyIF9fdCxfX3A9JycsX19lPV8uZXNjYXBlXCIrKHU/XCIsX19qPUFycmF5LnByb3RvdHlwZS5qb2luO2Z1bmN0aW9uIHByaW50KCl7X19wKz1fX2ouY2FsbChhcmd1bWVudHMsJycpfVwiOlwiO1wiKStsK1wicmV0dXJuIF9fcH1cIjt0cnl7dmFyIGM9bmUocixcInJldHVybiBcIitsKS5hcHBseSh2LG8pfWNhdGNoKHApe3Rocm93IHAuc291cmNlPWwscH1yZXR1cm4gdD9jKHQpOihjLnNvdXJjZT1sLGMpfSxKLnVuZXNjYXBlPWZ1bmN0aW9uKG4pe3JldHVybiBudWxsPT1uP1wiXCI6b2UobikucmVwbGFjZShxZSxndCl9LEoudW5pcXVlSWQ9ZnVuY3Rpb24obil7dmFyIHQ9Kyt5O3JldHVybiBvZShudWxsPT1uP1wiXCI6bikrdFxufSxKLmFsbD1PdCxKLmFueT1GdCxKLmRldGVjdD1JdCxKLmZpbmRXaGVyZT1JdCxKLmZvbGRsPUR0LEouZm9sZHI9JHQsSi5pbmNsdWRlPUN0LEouaW5qZWN0PUR0LEd0KGZ1bmN0aW9uKCl7dmFyIG49e307cmV0dXJuIGgoSixmdW5jdGlvbih0LGUpe0oucHJvdG90eXBlW2VdfHwobltlXT10KX0pLG59KCksZmFsc2UpLEouZmlyc3Q9QnQsSi5sYXN0PWZ1bmN0aW9uKG4sdCxlKXt2YXIgcj0wLHU9bj9uLmxlbmd0aDowO2lmKHR5cGVvZiB0IT1cIm51bWJlclwiJiZudWxsIT10KXt2YXIgbz11O2Zvcih0PUouY3JlYXRlQ2FsbGJhY2sodCxlLDMpO28tLSYmdChuW29dLG8sbik7KXIrK31lbHNlIGlmKHI9dCxudWxsPT1yfHxlKXJldHVybiBuP25bdS0xXTp2O3JldHVybiBwKG4sSWUoMCx1LXIpKX0sSi5zYW1wbGU9ZnVuY3Rpb24obix0LGUpe3JldHVybiBuJiZ0eXBlb2Ygbi5sZW5ndGghPVwibnVtYmVyXCImJihuPXh0KG4pKSxudWxsPT10fHxlP24/blthdCgwLG4ubGVuZ3RoLTEpXTp2OihuPVR0KG4pLG4ubGVuZ3RoPVNlKEllKDAsdCksbi5sZW5ndGgpLG4pXG59LEoudGFrZT1CdCxKLmhlYWQ9QnQsaChKLGZ1bmN0aW9uKG4sdCl7dmFyIGU9XCJzYW1wbGVcIiE9PXQ7Si5wcm90b3R5cGVbdF18fChKLnByb3RvdHlwZVt0XT1mdW5jdGlvbih0LHIpe3ZhciB1PXRoaXMuX19jaGFpbl9fLG89bih0aGlzLl9fd3JhcHBlZF9fLHQscik7cmV0dXJuIHV8fG51bGwhPXQmJighcnx8ZSYmdHlwZW9mIHQ9PVwiZnVuY3Rpb25cIik/bmV3IFEobyx1KTpvfSl9KSxKLlZFUlNJT049XCIyLjQuMVwiLEoucHJvdG90eXBlLmNoYWluPWZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuX19jaGFpbl9fPXRydWUsdGhpc30sSi5wcm90b3R5cGUudG9TdHJpbmc9ZnVuY3Rpb24oKXtyZXR1cm4gb2UodGhpcy5fX3dyYXBwZWRfXyl9LEoucHJvdG90eXBlLnZhbHVlPVF0LEoucHJvdG90eXBlLnZhbHVlT2Y9UXQsU3QoW1wiam9pblwiLFwicG9wXCIsXCJzaGlmdFwiXSxmdW5jdGlvbihuKXt2YXIgdD1hZVtuXTtKLnByb3RvdHlwZVtuXT1mdW5jdGlvbigpe3ZhciBuPXRoaXMuX19jaGFpbl9fLGU9dC5hcHBseSh0aGlzLl9fd3JhcHBlZF9fLGFyZ3VtZW50cyk7XG5yZXR1cm4gbj9uZXcgUShlLG4pOmV9fSksU3QoW1wicHVzaFwiLFwicmV2ZXJzZVwiLFwic29ydFwiLFwidW5zaGlmdFwiXSxmdW5jdGlvbihuKXt2YXIgdD1hZVtuXTtKLnByb3RvdHlwZVtuXT1mdW5jdGlvbigpe3JldHVybiB0LmFwcGx5KHRoaXMuX193cmFwcGVkX18sYXJndW1lbnRzKSx0aGlzfX0pLFN0KFtcImNvbmNhdFwiLFwic2xpY2VcIixcInNwbGljZVwiXSxmdW5jdGlvbihuKXt2YXIgdD1hZVtuXTtKLnByb3RvdHlwZVtuXT1mdW5jdGlvbigpe3JldHVybiBuZXcgUSh0LmFwcGx5KHRoaXMuX193cmFwcGVkX18sYXJndW1lbnRzKSx0aGlzLl9fY2hhaW5fXyl9fSksSn12YXIgdixoPVtdLGc9W10seT0wLG09K25ldyBEYXRlK1wiXCIsYj03NSxfPTQwLGQ9XCIgXFx0XFx4MEJcXGZcXHhhMFxcdWZlZmZcXG5cXHJcXHUyMDI4XFx1MjAyOVxcdTE2ODBcXHUxODBlXFx1MjAwMFxcdTIwMDFcXHUyMDAyXFx1MjAwM1xcdTIwMDRcXHUyMDA1XFx1MjAwNlxcdTIwMDdcXHUyMDA4XFx1MjAwOVxcdTIwMGFcXHUyMDJmXFx1MjA1ZlxcdTMwMDBcIix3PS9cXGJfX3BcXCs9Jyc7L2csaj0vXFxiKF9fcFxcKz0pJydcXCsvZyxrPS8oX19lXFwoLio/XFwpfFxcYl9fdFxcKSlcXCsnJzsvZyx4PS9cXCRcXHsoW15cXFxcfV0qKD86XFxcXC5bXlxcXFx9XSopKilcXH0vZyxDPS9cXHcqJC8sTz0vXlxccypmdW5jdGlvblsgXFxuXFxyXFx0XStcXHcvLE49LzwlPShbXFxzXFxTXSs/KSU+L2csST1SZWdFeHAoXCJeW1wiK2QrXCJdKjArKD89LiQpXCIpLFM9LygkXikvLEU9L1xcYnRoaXNcXGIvLFI9L1snXFxuXFxyXFx0XFx1MjAyOFxcdTIwMjlcXFxcXS9nLEE9XCJBcnJheSBCb29sZWFuIERhdGUgRnVuY3Rpb24gTWF0aCBOdW1iZXIgT2JqZWN0IFJlZ0V4cCBTdHJpbmcgXyBhdHRhY2hFdmVudCBjbGVhclRpbWVvdXQgaXNGaW5pdGUgaXNOYU4gcGFyc2VJbnQgc2V0VGltZW91dFwiLnNwbGl0KFwiIFwiKSxEPVwiW29iamVjdCBBcmd1bWVudHNdXCIsJD1cIltvYmplY3QgQXJyYXldXCIsVD1cIltvYmplY3QgQm9vbGVhbl1cIixGPVwiW29iamVjdCBEYXRlXVwiLEI9XCJbb2JqZWN0IEZ1bmN0aW9uXVwiLFc9XCJbb2JqZWN0IE51bWJlcl1cIixxPVwiW29iamVjdCBPYmplY3RdXCIsej1cIltvYmplY3QgUmVnRXhwXVwiLFA9XCJbb2JqZWN0IFN0cmluZ11cIixLPXt9O1xuS1tCXT1mYWxzZSxLW0RdPUtbJF09S1tUXT1LW0ZdPUtbV109S1txXT1LW3pdPUtbUF09dHJ1ZTt2YXIgTD17bGVhZGluZzpmYWxzZSxtYXhXYWl0OjAsdHJhaWxpbmc6ZmFsc2V9LE09e2NvbmZpZ3VyYWJsZTpmYWxzZSxlbnVtZXJhYmxlOmZhbHNlLHZhbHVlOm51bGwsd3JpdGFibGU6ZmFsc2V9LFY9e1wiYm9vbGVhblwiOmZhbHNlLFwiZnVuY3Rpb25cIjp0cnVlLG9iamVjdDp0cnVlLG51bWJlcjpmYWxzZSxzdHJpbmc6ZmFsc2UsdW5kZWZpbmVkOmZhbHNlfSxVPXtcIlxcXFxcIjpcIlxcXFxcIixcIidcIjpcIidcIixcIlxcblwiOlwiblwiLFwiXFxyXCI6XCJyXCIsXCJcXHRcIjpcInRcIixcIlxcdTIwMjhcIjpcInUyMDI4XCIsXCJcXHUyMDI5XCI6XCJ1MjAyOVwifSxHPVZbdHlwZW9mIHdpbmRvd10mJndpbmRvd3x8dGhpcyxIPVZbdHlwZW9mIGV4cG9ydHNdJiZleHBvcnRzJiYhZXhwb3J0cy5ub2RlVHlwZSYmZXhwb3J0cyxKPVZbdHlwZW9mIG1vZHVsZV0mJm1vZHVsZSYmIW1vZHVsZS5ub2RlVHlwZSYmbW9kdWxlLFE9SiYmSi5leHBvcnRzPT09SCYmSCxYPVZbdHlwZW9mIGdsb2JhbF0mJmdsb2JhbDshWHx8WC5nbG9iYWwhPT1YJiZYLndpbmRvdyE9PVh8fChHPVgpO1xudmFyIFk9cygpO3R5cGVvZiBkZWZpbmU9PVwiZnVuY3Rpb25cIiYmdHlwZW9mIGRlZmluZS5hbWQ9PVwib2JqZWN0XCImJmRlZmluZS5hbWQ/KEcuXz1ZLCBkZWZpbmUoZnVuY3Rpb24oKXtyZXR1cm4gWX0pKTpIJiZKP1E/KEouZXhwb3J0cz1ZKS5fPVk6SC5fPVk6Ry5fPVl9KS5jYWxsKHRoaXMpOyIsIi8vISBtb21lbnQuanNcbi8vISB2ZXJzaW9uIDogMi41LjFcbi8vISBhdXRob3JzIDogVGltIFdvb2QsIElza3JlbiBDaGVybmV2LCBNb21lbnQuanMgY29udHJpYnV0b3JzXG4vLyEgbGljZW5zZSA6IE1JVFxuLy8hIG1vbWVudGpzLmNvbVxuKGZ1bmN0aW9uKGEpe2Z1bmN0aW9uIGIoKXtyZXR1cm57ZW1wdHk6ITEsdW51c2VkVG9rZW5zOltdLHVudXNlZElucHV0OltdLG92ZXJmbG93Oi0yLGNoYXJzTGVmdE92ZXI6MCxudWxsSW5wdXQ6ITEsaW52YWxpZE1vbnRoOm51bGwsaW52YWxpZEZvcm1hdDohMSx1c2VySW52YWxpZGF0ZWQ6ITEsaXNvOiExfX1mdW5jdGlvbiBjKGEsYil7cmV0dXJuIGZ1bmN0aW9uKGMpe3JldHVybiBrKGEuY2FsbCh0aGlzLGMpLGIpfX1mdW5jdGlvbiBkKGEsYil7cmV0dXJuIGZ1bmN0aW9uKGMpe3JldHVybiB0aGlzLmxhbmcoKS5vcmRpbmFsKGEuY2FsbCh0aGlzLGMpLGIpfX1mdW5jdGlvbiBlKCl7fWZ1bmN0aW9uIGYoYSl7dyhhKSxoKHRoaXMsYSl9ZnVuY3Rpb24gZyhhKXt2YXIgYj1xKGEpLGM9Yi55ZWFyfHwwLGQ9Yi5tb250aHx8MCxlPWIud2Vla3x8MCxmPWIuZGF5fHwwLGc9Yi5ob3VyfHwwLGg9Yi5taW51dGV8fDAsaT1iLnNlY29uZHx8MCxqPWIubWlsbGlzZWNvbmR8fDA7dGhpcy5fbWlsbGlzZWNvbmRzPStqKzFlMyppKzZlNCpoKzM2ZTUqZyx0aGlzLl9kYXlzPStmKzcqZSx0aGlzLl9tb250aHM9K2QrMTIqYyx0aGlzLl9kYXRhPXt9LHRoaXMuX2J1YmJsZSgpfWZ1bmN0aW9uIGgoYSxiKXtmb3IodmFyIGMgaW4gYiliLmhhc093blByb3BlcnR5KGMpJiYoYVtjXT1iW2NdKTtyZXR1cm4gYi5oYXNPd25Qcm9wZXJ0eShcInRvU3RyaW5nXCIpJiYoYS50b1N0cmluZz1iLnRvU3RyaW5nKSxiLmhhc093blByb3BlcnR5KFwidmFsdWVPZlwiKSYmKGEudmFsdWVPZj1iLnZhbHVlT2YpLGF9ZnVuY3Rpb24gaShhKXt2YXIgYixjPXt9O2ZvcihiIGluIGEpYS5oYXNPd25Qcm9wZXJ0eShiKSYmcWIuaGFzT3duUHJvcGVydHkoYikmJihjW2JdPWFbYl0pO3JldHVybiBjfWZ1bmN0aW9uIGooYSl7cmV0dXJuIDA+YT9NYXRoLmNlaWwoYSk6TWF0aC5mbG9vcihhKX1mdW5jdGlvbiBrKGEsYixjKXtmb3IodmFyIGQ9XCJcIitNYXRoLmFicyhhKSxlPWE+PTA7ZC5sZW5ndGg8YjspZD1cIjBcIitkO3JldHVybihlP2M/XCIrXCI6XCJcIjpcIi1cIikrZH1mdW5jdGlvbiBsKGEsYixjLGQpe3ZhciBlLGYsZz1iLl9taWxsaXNlY29uZHMsaD1iLl9kYXlzLGk9Yi5fbW9udGhzO2cmJmEuX2Quc2V0VGltZSgrYS5fZCtnKmMpLChofHxpKSYmKGU9YS5taW51dGUoKSxmPWEuaG91cigpKSxoJiZhLmRhdGUoYS5kYXRlKCkraCpjKSxpJiZhLm1vbnRoKGEubW9udGgoKStpKmMpLGcmJiFkJiZkYi51cGRhdGVPZmZzZXQoYSksKGh8fGkpJiYoYS5taW51dGUoZSksYS5ob3VyKGYpKX1mdW5jdGlvbiBtKGEpe3JldHVyblwiW29iamVjdCBBcnJheV1cIj09PU9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhKX1mdW5jdGlvbiBuKGEpe3JldHVyblwiW29iamVjdCBEYXRlXVwiPT09T2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGEpfHxhIGluc3RhbmNlb2YgRGF0ZX1mdW5jdGlvbiBvKGEsYixjKXt2YXIgZCxlPU1hdGgubWluKGEubGVuZ3RoLGIubGVuZ3RoKSxmPU1hdGguYWJzKGEubGVuZ3RoLWIubGVuZ3RoKSxnPTA7Zm9yKGQ9MDtlPmQ7ZCsrKShjJiZhW2RdIT09YltkXXx8IWMmJnMoYVtkXSkhPT1zKGJbZF0pKSYmZysrO3JldHVybiBnK2Z9ZnVuY3Rpb24gcChhKXtpZihhKXt2YXIgYj1hLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvKC4pcyQvLFwiJDFcIik7YT1UYlthXXx8VWJbYl18fGJ9cmV0dXJuIGF9ZnVuY3Rpb24gcShhKXt2YXIgYixjLGQ9e307Zm9yKGMgaW4gYSlhLmhhc093blByb3BlcnR5KGMpJiYoYj1wKGMpLGImJihkW2JdPWFbY10pKTtyZXR1cm4gZH1mdW5jdGlvbiByKGIpe3ZhciBjLGQ7aWYoMD09PWIuaW5kZXhPZihcIndlZWtcIikpYz03LGQ9XCJkYXlcIjtlbHNle2lmKDAhPT1iLmluZGV4T2YoXCJtb250aFwiKSlyZXR1cm47Yz0xMixkPVwibW9udGhcIn1kYltiXT1mdW5jdGlvbihlLGYpe3ZhciBnLGgsaT1kYi5mbi5fbGFuZ1tiXSxqPVtdO2lmKFwibnVtYmVyXCI9PXR5cGVvZiBlJiYoZj1lLGU9YSksaD1mdW5jdGlvbihhKXt2YXIgYj1kYigpLnV0YygpLnNldChkLGEpO3JldHVybiBpLmNhbGwoZGIuZm4uX2xhbmcsYixlfHxcIlwiKX0sbnVsbCE9ZilyZXR1cm4gaChmKTtmb3IoZz0wO2M+ZztnKyspai5wdXNoKGgoZykpO3JldHVybiBqfX1mdW5jdGlvbiBzKGEpe3ZhciBiPSthLGM9MDtyZXR1cm4gMCE9PWImJmlzRmluaXRlKGIpJiYoYz1iPj0wP01hdGguZmxvb3IoYik6TWF0aC5jZWlsKGIpKSxjfWZ1bmN0aW9uIHQoYSxiKXtyZXR1cm4gbmV3IERhdGUoRGF0ZS5VVEMoYSxiKzEsMCkpLmdldFVUQ0RhdGUoKX1mdW5jdGlvbiB1KGEpe3JldHVybiB2KGEpPzM2NjozNjV9ZnVuY3Rpb24gdihhKXtyZXR1cm4gYSU0PT09MCYmYSUxMDAhPT0wfHxhJTQwMD09PTB9ZnVuY3Rpb24gdyhhKXt2YXIgYjthLl9hJiYtMj09PWEuX3BmLm92ZXJmbG93JiYoYj1hLl9hW2piXTwwfHxhLl9hW2piXT4xMT9qYjphLl9hW2tiXTwxfHxhLl9hW2tiXT50KGEuX2FbaWJdLGEuX2FbamJdKT9rYjphLl9hW2xiXTwwfHxhLl9hW2xiXT4yMz9sYjphLl9hW21iXTwwfHxhLl9hW21iXT41OT9tYjphLl9hW25iXTwwfHxhLl9hW25iXT41OT9uYjphLl9hW29iXTwwfHxhLl9hW29iXT45OTk/b2I6LTEsYS5fcGYuX292ZXJmbG93RGF5T2ZZZWFyJiYoaWI+Ynx8Yj5rYikmJihiPWtiKSxhLl9wZi5vdmVyZmxvdz1iKX1mdW5jdGlvbiB4KGEpe3JldHVybiBudWxsPT1hLl9pc1ZhbGlkJiYoYS5faXNWYWxpZD0haXNOYU4oYS5fZC5nZXRUaW1lKCkpJiZhLl9wZi5vdmVyZmxvdzwwJiYhYS5fcGYuZW1wdHkmJiFhLl9wZi5pbnZhbGlkTW9udGgmJiFhLl9wZi5udWxsSW5wdXQmJiFhLl9wZi5pbnZhbGlkRm9ybWF0JiYhYS5fcGYudXNlckludmFsaWRhdGVkLGEuX3N0cmljdCYmKGEuX2lzVmFsaWQ9YS5faXNWYWxpZCYmMD09PWEuX3BmLmNoYXJzTGVmdE92ZXImJjA9PT1hLl9wZi51bnVzZWRUb2tlbnMubGVuZ3RoKSksYS5faXNWYWxpZH1mdW5jdGlvbiB5KGEpe3JldHVybiBhP2EudG9Mb3dlckNhc2UoKS5yZXBsYWNlKFwiX1wiLFwiLVwiKTphfWZ1bmN0aW9uIHooYSxiKXtyZXR1cm4gYi5faXNVVEM/ZGIoYSkuem9uZShiLl9vZmZzZXR8fDApOmRiKGEpLmxvY2FsKCl9ZnVuY3Rpb24gQShhLGIpe3JldHVybiBiLmFiYnI9YSxwYlthXXx8KHBiW2FdPW5ldyBlKSxwYlthXS5zZXQoYikscGJbYV19ZnVuY3Rpb24gQihhKXtkZWxldGUgcGJbYV19ZnVuY3Rpb24gQyhhKXt2YXIgYixjLGQsZSxmPTAsZz1mdW5jdGlvbihhKXtpZighcGJbYV0mJnJiKXRyeXtyZXF1aXJlKFwiLi9sYW5nL1wiK2EpfWNhdGNoKGIpe31yZXR1cm4gcGJbYV19O2lmKCFhKXJldHVybiBkYi5mbi5fbGFuZztpZighbShhKSl7aWYoYz1nKGEpKXJldHVybiBjO2E9W2FdfWZvcig7ZjxhLmxlbmd0aDspe2ZvcihlPXkoYVtmXSkuc3BsaXQoXCItXCIpLGI9ZS5sZW5ndGgsZD15KGFbZisxXSksZD1kP2Quc3BsaXQoXCItXCIpOm51bGw7Yj4wOyl7aWYoYz1nKGUuc2xpY2UoMCxiKS5qb2luKFwiLVwiKSkpcmV0dXJuIGM7aWYoZCYmZC5sZW5ndGg+PWImJm8oZSxkLCEwKT49Yi0xKWJyZWFrO2ItLX1mKyt9cmV0dXJuIGRiLmZuLl9sYW5nfWZ1bmN0aW9uIEQoYSl7cmV0dXJuIGEubWF0Y2goL1xcW1tcXHNcXFNdLyk/YS5yZXBsYWNlKC9eXFxbfFxcXSQvZyxcIlwiKTphLnJlcGxhY2UoL1xcXFwvZyxcIlwiKX1mdW5jdGlvbiBFKGEpe3ZhciBiLGMsZD1hLm1hdGNoKHZiKTtmb3IoYj0wLGM9ZC5sZW5ndGg7Yz5iO2IrKylkW2JdPVliW2RbYl1dP1liW2RbYl1dOkQoZFtiXSk7cmV0dXJuIGZ1bmN0aW9uKGUpe3ZhciBmPVwiXCI7Zm9yKGI9MDtjPmI7YisrKWYrPWRbYl1pbnN0YW5jZW9mIEZ1bmN0aW9uP2RbYl0uY2FsbChlLGEpOmRbYl07cmV0dXJuIGZ9fWZ1bmN0aW9uIEYoYSxiKXtyZXR1cm4gYS5pc1ZhbGlkKCk/KGI9RyhiLGEubGFuZygpKSxWYltiXXx8KFZiW2JdPUUoYikpLFZiW2JdKGEpKTphLmxhbmcoKS5pbnZhbGlkRGF0ZSgpfWZ1bmN0aW9uIEcoYSxiKXtmdW5jdGlvbiBjKGEpe3JldHVybiBiLmxvbmdEYXRlRm9ybWF0KGEpfHxhfXZhciBkPTU7Zm9yKHdiLmxhc3RJbmRleD0wO2Q+PTAmJndiLnRlc3QoYSk7KWE9YS5yZXBsYWNlKHdiLGMpLHdiLmxhc3RJbmRleD0wLGQtPTE7cmV0dXJuIGF9ZnVuY3Rpb24gSChhLGIpe3ZhciBjLGQ9Yi5fc3RyaWN0O3N3aXRjaChhKXtjYXNlXCJEREREXCI6cmV0dXJuIEliO2Nhc2VcIllZWVlcIjpjYXNlXCJHR0dHXCI6Y2FzZVwiZ2dnZ1wiOnJldHVybiBkP0piOnpiO2Nhc2VcIllcIjpjYXNlXCJHXCI6Y2FzZVwiZ1wiOnJldHVybiBMYjtjYXNlXCJZWVlZWVlcIjpjYXNlXCJZWVlZWVwiOmNhc2VcIkdHR0dHXCI6Y2FzZVwiZ2dnZ2dcIjpyZXR1cm4gZD9LYjpBYjtjYXNlXCJTXCI6aWYoZClyZXR1cm4gR2I7Y2FzZVwiU1NcIjppZihkKXJldHVybiBIYjtjYXNlXCJTU1NcIjppZihkKXJldHVybiBJYjtjYXNlXCJERERcIjpyZXR1cm4geWI7Y2FzZVwiTU1NXCI6Y2FzZVwiTU1NTVwiOmNhc2VcImRkXCI6Y2FzZVwiZGRkXCI6Y2FzZVwiZGRkZFwiOnJldHVybiBDYjtjYXNlXCJhXCI6Y2FzZVwiQVwiOnJldHVybiBDKGIuX2wpLl9tZXJpZGllbVBhcnNlO2Nhc2VcIlhcIjpyZXR1cm4gRmI7Y2FzZVwiWlwiOmNhc2VcIlpaXCI6cmV0dXJuIERiO2Nhc2VcIlRcIjpyZXR1cm4gRWI7Y2FzZVwiU1NTU1wiOnJldHVybiBCYjtjYXNlXCJNTVwiOmNhc2VcIkREXCI6Y2FzZVwiWVlcIjpjYXNlXCJHR1wiOmNhc2VcImdnXCI6Y2FzZVwiSEhcIjpjYXNlXCJoaFwiOmNhc2VcIm1tXCI6Y2FzZVwic3NcIjpjYXNlXCJ3d1wiOmNhc2VcIldXXCI6cmV0dXJuIGQ/SGI6eGI7Y2FzZVwiTVwiOmNhc2VcIkRcIjpjYXNlXCJkXCI6Y2FzZVwiSFwiOmNhc2VcImhcIjpjYXNlXCJtXCI6Y2FzZVwic1wiOmNhc2VcIndcIjpjYXNlXCJXXCI6Y2FzZVwiZVwiOmNhc2VcIkVcIjpyZXR1cm4geGI7ZGVmYXVsdDpyZXR1cm4gYz1uZXcgUmVnRXhwKFAoTyhhLnJlcGxhY2UoXCJcXFxcXCIsXCJcIikpLFwiaVwiKSl9fWZ1bmN0aW9uIEkoYSl7YT1hfHxcIlwiO3ZhciBiPWEubWF0Y2goRGIpfHxbXSxjPWJbYi5sZW5ndGgtMV18fFtdLGQ9KGMrXCJcIikubWF0Y2goUWIpfHxbXCItXCIsMCwwXSxlPSsoNjAqZFsxXSkrcyhkWzJdKTtyZXR1cm5cIitcIj09PWRbMF0/LWU6ZX1mdW5jdGlvbiBKKGEsYixjKXt2YXIgZCxlPWMuX2E7c3dpdGNoKGEpe2Nhc2VcIk1cIjpjYXNlXCJNTVwiOm51bGwhPWImJihlW2piXT1zKGIpLTEpO2JyZWFrO2Nhc2VcIk1NTVwiOmNhc2VcIk1NTU1cIjpkPUMoYy5fbCkubW9udGhzUGFyc2UoYiksbnVsbCE9ZD9lW2piXT1kOmMuX3BmLmludmFsaWRNb250aD1iO2JyZWFrO2Nhc2VcIkRcIjpjYXNlXCJERFwiOm51bGwhPWImJihlW2tiXT1zKGIpKTticmVhaztjYXNlXCJERERcIjpjYXNlXCJEREREXCI6bnVsbCE9YiYmKGMuX2RheU9mWWVhcj1zKGIpKTticmVhaztjYXNlXCJZWVwiOmVbaWJdPXMoYikrKHMoYik+Njg/MTkwMDoyZTMpO2JyZWFrO2Nhc2VcIllZWVlcIjpjYXNlXCJZWVlZWVwiOmNhc2VcIllZWVlZWVwiOmVbaWJdPXMoYik7YnJlYWs7Y2FzZVwiYVwiOmNhc2VcIkFcIjpjLl9pc1BtPUMoYy5fbCkuaXNQTShiKTticmVhaztjYXNlXCJIXCI6Y2FzZVwiSEhcIjpjYXNlXCJoXCI6Y2FzZVwiaGhcIjplW2xiXT1zKGIpO2JyZWFrO2Nhc2VcIm1cIjpjYXNlXCJtbVwiOmVbbWJdPXMoYik7YnJlYWs7Y2FzZVwic1wiOmNhc2VcInNzXCI6ZVtuYl09cyhiKTticmVhaztjYXNlXCJTXCI6Y2FzZVwiU1NcIjpjYXNlXCJTU1NcIjpjYXNlXCJTU1NTXCI6ZVtvYl09cygxZTMqKFwiMC5cIitiKSk7YnJlYWs7Y2FzZVwiWFwiOmMuX2Q9bmV3IERhdGUoMWUzKnBhcnNlRmxvYXQoYikpO2JyZWFrO2Nhc2VcIlpcIjpjYXNlXCJaWlwiOmMuX3VzZVVUQz0hMCxjLl90em09SShiKTticmVhaztjYXNlXCJ3XCI6Y2FzZVwid3dcIjpjYXNlXCJXXCI6Y2FzZVwiV1dcIjpjYXNlXCJkXCI6Y2FzZVwiZGRcIjpjYXNlXCJkZGRcIjpjYXNlXCJkZGRkXCI6Y2FzZVwiZVwiOmNhc2VcIkVcIjphPWEuc3Vic3RyKDAsMSk7Y2FzZVwiZ2dcIjpjYXNlXCJnZ2dnXCI6Y2FzZVwiR0dcIjpjYXNlXCJHR0dHXCI6Y2FzZVwiR0dHR0dcIjphPWEuc3Vic3RyKDAsMiksYiYmKGMuX3c9Yy5fd3x8e30sYy5fd1thXT1iKX19ZnVuY3Rpb24gSyhhKXt2YXIgYixjLGQsZSxmLGcsaCxpLGosayxsPVtdO2lmKCFhLl9kKXtmb3IoZD1NKGEpLGEuX3cmJm51bGw9PWEuX2Fba2JdJiZudWxsPT1hLl9hW2piXSYmKGY9ZnVuY3Rpb24oYil7dmFyIGM9cGFyc2VJbnQoYiwxMCk7cmV0dXJuIGI/Yi5sZW5ndGg8Mz9jPjY4PzE5MDArYzoyZTMrYzpjOm51bGw9PWEuX2FbaWJdP2RiKCkud2Vla1llYXIoKTphLl9hW2liXX0sZz1hLl93LG51bGwhPWcuR0d8fG51bGwhPWcuV3x8bnVsbCE9Zy5FP2g9WihmKGcuR0cpLGcuV3x8MSxnLkUsNCwxKTooaT1DKGEuX2wpLGo9bnVsbCE9Zy5kP1YoZy5kLGkpOm51bGwhPWcuZT9wYXJzZUludChnLmUsMTApK2kuX3dlZWsuZG93OjAsaz1wYXJzZUludChnLncsMTApfHwxLG51bGwhPWcuZCYmajxpLl93ZWVrLmRvdyYmaysrLGg9WihmKGcuZ2cpLGssaixpLl93ZWVrLmRveSxpLl93ZWVrLmRvdykpLGEuX2FbaWJdPWgueWVhcixhLl9kYXlPZlllYXI9aC5kYXlPZlllYXIpLGEuX2RheU9mWWVhciYmKGU9bnVsbD09YS5fYVtpYl0/ZFtpYl06YS5fYVtpYl0sYS5fZGF5T2ZZZWFyPnUoZSkmJihhLl9wZi5fb3ZlcmZsb3dEYXlPZlllYXI9ITApLGM9VShlLDAsYS5fZGF5T2ZZZWFyKSxhLl9hW2piXT1jLmdldFVUQ01vbnRoKCksYS5fYVtrYl09Yy5nZXRVVENEYXRlKCkpLGI9MDszPmImJm51bGw9PWEuX2FbYl07KytiKWEuX2FbYl09bFtiXT1kW2JdO2Zvcig7Nz5iO2IrKylhLl9hW2JdPWxbYl09bnVsbD09YS5fYVtiXT8yPT09Yj8xOjA6YS5fYVtiXTtsW2xiXSs9cygoYS5fdHptfHwwKS82MCksbFttYl0rPXMoKGEuX3R6bXx8MCklNjApLGEuX2Q9KGEuX3VzZVVUQz9VOlQpLmFwcGx5KG51bGwsbCl9fWZ1bmN0aW9uIEwoYSl7dmFyIGI7YS5fZHx8KGI9cShhLl9pKSxhLl9hPVtiLnllYXIsYi5tb250aCxiLmRheSxiLmhvdXIsYi5taW51dGUsYi5zZWNvbmQsYi5taWxsaXNlY29uZF0sSyhhKSl9ZnVuY3Rpb24gTShhKXt2YXIgYj1uZXcgRGF0ZTtyZXR1cm4gYS5fdXNlVVRDP1tiLmdldFVUQ0Z1bGxZZWFyKCksYi5nZXRVVENNb250aCgpLGIuZ2V0VVRDRGF0ZSgpXTpbYi5nZXRGdWxsWWVhcigpLGIuZ2V0TW9udGgoKSxiLmdldERhdGUoKV19ZnVuY3Rpb24gTihhKXthLl9hPVtdLGEuX3BmLmVtcHR5PSEwO3ZhciBiLGMsZCxlLGYsZz1DKGEuX2wpLGg9XCJcIithLl9pLGk9aC5sZW5ndGgsaj0wO2ZvcihkPUcoYS5fZixnKS5tYXRjaCh2Yil8fFtdLGI9MDtiPGQubGVuZ3RoO2IrKyllPWRbYl0sYz0oaC5tYXRjaChIKGUsYSkpfHxbXSlbMF0sYyYmKGY9aC5zdWJzdHIoMCxoLmluZGV4T2YoYykpLGYubGVuZ3RoPjAmJmEuX3BmLnVudXNlZElucHV0LnB1c2goZiksaD1oLnNsaWNlKGguaW5kZXhPZihjKStjLmxlbmd0aCksais9Yy5sZW5ndGgpLFliW2VdPyhjP2EuX3BmLmVtcHR5PSExOmEuX3BmLnVudXNlZFRva2Vucy5wdXNoKGUpLEooZSxjLGEpKTphLl9zdHJpY3QmJiFjJiZhLl9wZi51bnVzZWRUb2tlbnMucHVzaChlKTthLl9wZi5jaGFyc0xlZnRPdmVyPWktaixoLmxlbmd0aD4wJiZhLl9wZi51bnVzZWRJbnB1dC5wdXNoKGgpLGEuX2lzUG0mJmEuX2FbbGJdPDEyJiYoYS5fYVtsYl0rPTEyKSxhLl9pc1BtPT09ITEmJjEyPT09YS5fYVtsYl0mJihhLl9hW2xiXT0wKSxLKGEpLHcoYSl9ZnVuY3Rpb24gTyhhKXtyZXR1cm4gYS5yZXBsYWNlKC9cXFxcKFxcWyl8XFxcXChcXF0pfFxcWyhbXlxcXVxcW10qKVxcXXxcXFxcKC4pL2csZnVuY3Rpb24oYSxiLGMsZCxlKXtyZXR1cm4gYnx8Y3x8ZHx8ZX0pfWZ1bmN0aW9uIFAoYSl7cmV0dXJuIGEucmVwbGFjZSgvWy1cXC9cXFxcXiQqKz8uKCl8W1xcXXt9XS9nLFwiXFxcXCQmXCIpfWZ1bmN0aW9uIFEoYSl7dmFyIGMsZCxlLGYsZztpZigwPT09YS5fZi5sZW5ndGgpcmV0dXJuIGEuX3BmLmludmFsaWRGb3JtYXQ9ITAsYS5fZD1uZXcgRGF0ZSgwLzApLHZvaWQgMDtmb3IoZj0wO2Y8YS5fZi5sZW5ndGg7ZisrKWc9MCxjPWgoe30sYSksYy5fcGY9YigpLGMuX2Y9YS5fZltmXSxOKGMpLHgoYykmJihnKz1jLl9wZi5jaGFyc0xlZnRPdmVyLGcrPTEwKmMuX3BmLnVudXNlZFRva2Vucy5sZW5ndGgsYy5fcGYuc2NvcmU9ZywobnVsbD09ZXx8ZT5nKSYmKGU9ZyxkPWMpKTtoKGEsZHx8Yyl9ZnVuY3Rpb24gUihhKXt2YXIgYixjLGQ9YS5faSxlPU1iLmV4ZWMoZCk7aWYoZSl7Zm9yKGEuX3BmLmlzbz0hMCxiPTAsYz1PYi5sZW5ndGg7Yz5iO2IrKylpZihPYltiXVsxXS5leGVjKGQpKXthLl9mPU9iW2JdWzBdKyhlWzZdfHxcIiBcIik7YnJlYWt9Zm9yKGI9MCxjPVBiLmxlbmd0aDtjPmI7YisrKWlmKFBiW2JdWzFdLmV4ZWMoZCkpe2EuX2YrPVBiW2JdWzBdO2JyZWFrfWQubWF0Y2goRGIpJiYoYS5fZis9XCJaXCIpLE4oYSl9ZWxzZSBhLl9kPW5ldyBEYXRlKGQpfWZ1bmN0aW9uIFMoYil7dmFyIGM9Yi5faSxkPXNiLmV4ZWMoYyk7Yz09PWE/Yi5fZD1uZXcgRGF0ZTpkP2IuX2Q9bmV3IERhdGUoK2RbMV0pOlwic3RyaW5nXCI9PXR5cGVvZiBjP1IoYik6bShjKT8oYi5fYT1jLnNsaWNlKDApLEsoYikpOm4oYyk/Yi5fZD1uZXcgRGF0ZSgrYyk6XCJvYmplY3RcIj09dHlwZW9mIGM/TChiKTpiLl9kPW5ldyBEYXRlKGMpfWZ1bmN0aW9uIFQoYSxiLGMsZCxlLGYsZyl7dmFyIGg9bmV3IERhdGUoYSxiLGMsZCxlLGYsZyk7cmV0dXJuIDE5NzA+YSYmaC5zZXRGdWxsWWVhcihhKSxofWZ1bmN0aW9uIFUoYSl7dmFyIGI9bmV3IERhdGUoRGF0ZS5VVEMuYXBwbHkobnVsbCxhcmd1bWVudHMpKTtyZXR1cm4gMTk3MD5hJiZiLnNldFVUQ0Z1bGxZZWFyKGEpLGJ9ZnVuY3Rpb24gVihhLGIpe2lmKFwic3RyaW5nXCI9PXR5cGVvZiBhKWlmKGlzTmFOKGEpKXtpZihhPWIud2Vla2RheXNQYXJzZShhKSxcIm51bWJlclwiIT10eXBlb2YgYSlyZXR1cm4gbnVsbH1lbHNlIGE9cGFyc2VJbnQoYSwxMCk7cmV0dXJuIGF9ZnVuY3Rpb24gVyhhLGIsYyxkLGUpe3JldHVybiBlLnJlbGF0aXZlVGltZShifHwxLCEhYyxhLGQpfWZ1bmN0aW9uIFgoYSxiLGMpe3ZhciBkPWhiKE1hdGguYWJzKGEpLzFlMyksZT1oYihkLzYwKSxmPWhiKGUvNjApLGc9aGIoZi8yNCksaD1oYihnLzM2NSksaT00NT5kJiZbXCJzXCIsZF18fDE9PT1lJiZbXCJtXCJdfHw0NT5lJiZbXCJtbVwiLGVdfHwxPT09ZiYmW1wiaFwiXXx8MjI+ZiYmW1wiaGhcIixmXXx8MT09PWcmJltcImRcIl18fDI1Pj1nJiZbXCJkZFwiLGddfHw0NT49ZyYmW1wiTVwiXXx8MzQ1PmcmJltcIk1NXCIsaGIoZy8zMCldfHwxPT09aCYmW1wieVwiXXx8W1wieXlcIixoXTtyZXR1cm4gaVsyXT1iLGlbM109YT4wLGlbNF09YyxXLmFwcGx5KHt9LGkpfWZ1bmN0aW9uIFkoYSxiLGMpe3ZhciBkLGU9Yy1iLGY9Yy1hLmRheSgpO3JldHVybiBmPmUmJihmLT03KSxlLTc+ZiYmKGYrPTcpLGQ9ZGIoYSkuYWRkKFwiZFwiLGYpLHt3ZWVrOk1hdGguY2VpbChkLmRheU9mWWVhcigpLzcpLHllYXI6ZC55ZWFyKCl9fWZ1bmN0aW9uIFooYSxiLGMsZCxlKXt2YXIgZixnLGg9VShhLDAsMSkuZ2V0VVRDRGF5KCk7cmV0dXJuIGM9bnVsbCE9Yz9jOmUsZj1lLWgrKGg+ZD83OjApLShlPmg/NzowKSxnPTcqKGItMSkrKGMtZSkrZisxLHt5ZWFyOmc+MD9hOmEtMSxkYXlPZlllYXI6Zz4wP2c6dShhLTEpK2d9fWZ1bmN0aW9uICQoYSl7dmFyIGI9YS5faSxjPWEuX2Y7cmV0dXJuIG51bGw9PT1iP2RiLmludmFsaWQoe251bGxJbnB1dDohMH0pOihcInN0cmluZ1wiPT10eXBlb2YgYiYmKGEuX2k9Yj1DKCkucHJlcGFyc2UoYikpLGRiLmlzTW9tZW50KGIpPyhhPWkoYiksYS5fZD1uZXcgRGF0ZSgrYi5fZCkpOmM/bShjKT9RKGEpOk4oYSk6UyhhKSxuZXcgZihhKSl9ZnVuY3Rpb24gXyhhLGIpe2RiLmZuW2FdPWRiLmZuW2ErXCJzXCJdPWZ1bmN0aW9uKGEpe3ZhciBjPXRoaXMuX2lzVVRDP1wiVVRDXCI6XCJcIjtyZXR1cm4gbnVsbCE9YT8odGhpcy5fZFtcInNldFwiK2MrYl0oYSksZGIudXBkYXRlT2Zmc2V0KHRoaXMpLHRoaXMpOnRoaXMuX2RbXCJnZXRcIitjK2JdKCl9fWZ1bmN0aW9uIGFiKGEpe2RiLmR1cmF0aW9uLmZuW2FdPWZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuX2RhdGFbYV19fWZ1bmN0aW9uIGJiKGEsYil7ZGIuZHVyYXRpb24uZm5bXCJhc1wiK2FdPWZ1bmN0aW9uKCl7cmV0dXJuK3RoaXMvYn19ZnVuY3Rpb24gY2IoYSl7dmFyIGI9ITEsYz1kYjtcInVuZGVmaW5lZFwiPT10eXBlb2YgZW5kZXImJihhPyhnYi5tb21lbnQ9ZnVuY3Rpb24oKXtyZXR1cm4hYiYmY29uc29sZSYmY29uc29sZS53YXJuJiYoYj0hMCxjb25zb2xlLndhcm4oXCJBY2Nlc3NpbmcgTW9tZW50IHRocm91Z2ggdGhlIGdsb2JhbCBzY29wZSBpcyBkZXByZWNhdGVkLCBhbmQgd2lsbCBiZSByZW1vdmVkIGluIGFuIHVwY29taW5nIHJlbGVhc2UuXCIpKSxjLmFwcGx5KG51bGwsYXJndW1lbnRzKX0saChnYi5tb21lbnQsYykpOmdiLm1vbWVudD1kYil9Zm9yKHZhciBkYixlYixmYj1cIjIuNS4xXCIsZ2I9dGhpcyxoYj1NYXRoLnJvdW5kLGliPTAsamI9MSxrYj0yLGxiPTMsbWI9NCxuYj01LG9iPTYscGI9e30scWI9e19pc0FNb21lbnRPYmplY3Q6bnVsbCxfaTpudWxsLF9mOm51bGwsX2w6bnVsbCxfc3RyaWN0Om51bGwsX2lzVVRDOm51bGwsX29mZnNldDpudWxsLF9wZjpudWxsLF9sYW5nOm51bGx9LHJiPVwidW5kZWZpbmVkXCIhPXR5cGVvZiBtb2R1bGUmJm1vZHVsZS5leHBvcnRzJiZcInVuZGVmaW5lZFwiIT10eXBlb2YgcmVxdWlyZSxzYj0vXlxcLz9EYXRlXFwoKFxcLT9cXGQrKS9pLHRiPS8oXFwtKT8oPzooXFxkKilcXC4pPyhcXGQrKVxcOihcXGQrKSg/OlxcOihcXGQrKVxcLj8oXFxkezN9KT8pPy8sdWI9L14oLSk/UCg/Oig/OihbMC05LC5dKilZKT8oPzooWzAtOSwuXSopTSk/KD86KFswLTksLl0qKUQpPyg/OlQoPzooWzAtOSwuXSopSCk/KD86KFswLTksLl0qKU0pPyg/OihbMC05LC5dKilTKT8pP3woWzAtOSwuXSopVykkLyx2Yj0vKFxcW1teXFxbXSpcXF0pfChcXFxcKT8oTW98TU0/TT9NP3xEb3xERERvfEREP0Q/RD98ZGRkP2Q/fGRvP3x3W298d10/fFdbb3xXXT98WVlZWVlZfFlZWVlZfFlZWVl8WVl8Z2coZ2dnPyk/fEdHKEdHRz8pP3xlfEV8YXxBfGhoP3xISD98bW0/fHNzP3xTezEsNH18WHx6ej98Wlo/fC4pL2csd2I9LyhcXFtbXlxcW10qXFxdKXwoXFxcXCk/KExUfExMP0w/TD98bHsxLDR9KS9nLHhiPS9cXGRcXGQ/Lyx5Yj0vXFxkezEsM30vLHpiPS9cXGR7MSw0fS8sQWI9L1srXFwtXT9cXGR7MSw2fS8sQmI9L1xcZCsvLENiPS9bMC05XSpbJ2EtelxcdTAwQTAtXFx1MDVGRlxcdTA3MDAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0rfFtcXHUwNjAwLVxcdTA2RkZcXC9dKyhcXHMqP1tcXHUwNjAwLVxcdTA2RkZdKyl7MSwyfS9pLERiPS9afFtcXCtcXC1dXFxkXFxkOj9cXGRcXGQvZ2ksRWI9L1QvaSxGYj0vW1xcK1xcLV0/XFxkKyhcXC5cXGR7MSwzfSk/LyxHYj0vXFxkLyxIYj0vXFxkXFxkLyxJYj0vXFxkezN9LyxKYj0vXFxkezR9LyxLYj0vWystXT9cXGR7Nn0vLExiPS9bKy1dP1xcZCsvLE1iPS9eXFxzKig/OlsrLV1cXGR7Nn18XFxkezR9KS0oPzooXFxkXFxkLVxcZFxcZCl8KFdcXGRcXGQkKXwoV1xcZFxcZC1cXGQpfChcXGRcXGRcXGQpKSgoVHwgKShcXGRcXGQoOlxcZFxcZCg6XFxkXFxkKFxcLlxcZCspPyk/KT8pPyhbXFwrXFwtXVxcZFxcZCg/Ojo/XFxkXFxkKT98XFxzKlopPyk/JC8sTmI9XCJZWVlZLU1NLUREVEhIOm1tOnNzWlwiLE9iPVtbXCJZWVlZWVktTU0tRERcIiwvWystXVxcZHs2fS1cXGR7Mn0tXFxkezJ9L10sW1wiWVlZWS1NTS1ERFwiLC9cXGR7NH0tXFxkezJ9LVxcZHsyfS9dLFtcIkdHR0ctW1ddV1ctRVwiLC9cXGR7NH0tV1xcZHsyfS1cXGQvXSxbXCJHR0dHLVtXXVdXXCIsL1xcZHs0fS1XXFxkezJ9L10sW1wiWVlZWS1ERERcIiwvXFxkezR9LVxcZHszfS9dXSxQYj1bW1wiSEg6bW06c3MuU1NTU1wiLC8oVHwgKVxcZFxcZDpcXGRcXGQ6XFxkXFxkXFwuXFxkezEsM30vXSxbXCJISDptbTpzc1wiLC8oVHwgKVxcZFxcZDpcXGRcXGQ6XFxkXFxkL10sW1wiSEg6bW1cIiwvKFR8IClcXGRcXGQ6XFxkXFxkL10sW1wiSEhcIiwvKFR8IClcXGRcXGQvXV0sUWI9LyhbXFwrXFwtXXxcXGRcXGQpL2dpLFJiPVwiRGF0ZXxIb3Vyc3xNaW51dGVzfFNlY29uZHN8TWlsbGlzZWNvbmRzXCIuc3BsaXQoXCJ8XCIpLFNiPXtNaWxsaXNlY29uZHM6MSxTZWNvbmRzOjFlMyxNaW51dGVzOjZlNCxIb3VyczozNmU1LERheXM6ODY0ZTUsTW9udGhzOjI1OTJlNixZZWFyczozMTUzNmU2fSxUYj17bXM6XCJtaWxsaXNlY29uZFwiLHM6XCJzZWNvbmRcIixtOlwibWludXRlXCIsaDpcImhvdXJcIixkOlwiZGF5XCIsRDpcImRhdGVcIix3Olwid2Vla1wiLFc6XCJpc29XZWVrXCIsTTpcIm1vbnRoXCIseTpcInllYXJcIixEREQ6XCJkYXlPZlllYXJcIixlOlwid2Vla2RheVwiLEU6XCJpc29XZWVrZGF5XCIsZ2c6XCJ3ZWVrWWVhclwiLEdHOlwiaXNvV2Vla1llYXJcIn0sVWI9e2RheW9meWVhcjpcImRheU9mWWVhclwiLGlzb3dlZWtkYXk6XCJpc29XZWVrZGF5XCIsaXNvd2VlazpcImlzb1dlZWtcIix3ZWVreWVhcjpcIndlZWtZZWFyXCIsaXNvd2Vla3llYXI6XCJpc29XZWVrWWVhclwifSxWYj17fSxXYj1cIkRERCB3IFcgTSBEIGRcIi5zcGxpdChcIiBcIiksWGI9XCJNIEQgSCBoIG0gcyB3IFdcIi5zcGxpdChcIiBcIiksWWI9e006ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5tb250aCgpKzF9LE1NTTpmdW5jdGlvbihhKXtyZXR1cm4gdGhpcy5sYW5nKCkubW9udGhzU2hvcnQodGhpcyxhKX0sTU1NTTpmdW5jdGlvbihhKXtyZXR1cm4gdGhpcy5sYW5nKCkubW9udGhzKHRoaXMsYSl9LEQ6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5kYXRlKCl9LERERDpmdW5jdGlvbigpe3JldHVybiB0aGlzLmRheU9mWWVhcigpfSxkOmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuZGF5KCl9LGRkOmZ1bmN0aW9uKGEpe3JldHVybiB0aGlzLmxhbmcoKS53ZWVrZGF5c01pbih0aGlzLGEpfSxkZGQ6ZnVuY3Rpb24oYSl7cmV0dXJuIHRoaXMubGFuZygpLndlZWtkYXlzU2hvcnQodGhpcyxhKX0sZGRkZDpmdW5jdGlvbihhKXtyZXR1cm4gdGhpcy5sYW5nKCkud2Vla2RheXModGhpcyxhKX0sdzpmdW5jdGlvbigpe3JldHVybiB0aGlzLndlZWsoKX0sVzpmdW5jdGlvbigpe3JldHVybiB0aGlzLmlzb1dlZWsoKX0sWVk6ZnVuY3Rpb24oKXtyZXR1cm4gayh0aGlzLnllYXIoKSUxMDAsMil9LFlZWVk6ZnVuY3Rpb24oKXtyZXR1cm4gayh0aGlzLnllYXIoKSw0KX0sWVlZWVk6ZnVuY3Rpb24oKXtyZXR1cm4gayh0aGlzLnllYXIoKSw1KX0sWVlZWVlZOmZ1bmN0aW9uKCl7dmFyIGE9dGhpcy55ZWFyKCksYj1hPj0wP1wiK1wiOlwiLVwiO3JldHVybiBiK2soTWF0aC5hYnMoYSksNil9LGdnOmZ1bmN0aW9uKCl7cmV0dXJuIGsodGhpcy53ZWVrWWVhcigpJTEwMCwyKX0sZ2dnZzpmdW5jdGlvbigpe3JldHVybiBrKHRoaXMud2Vla1llYXIoKSw0KX0sZ2dnZ2c6ZnVuY3Rpb24oKXtyZXR1cm4gayh0aGlzLndlZWtZZWFyKCksNSl9LEdHOmZ1bmN0aW9uKCl7cmV0dXJuIGsodGhpcy5pc29XZWVrWWVhcigpJTEwMCwyKX0sR0dHRzpmdW5jdGlvbigpe3JldHVybiBrKHRoaXMuaXNvV2Vla1llYXIoKSw0KX0sR0dHR0c6ZnVuY3Rpb24oKXtyZXR1cm4gayh0aGlzLmlzb1dlZWtZZWFyKCksNSl9LGU6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy53ZWVrZGF5KCl9LEU6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5pc29XZWVrZGF5KCl9LGE6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5sYW5nKCkubWVyaWRpZW0odGhpcy5ob3VycygpLHRoaXMubWludXRlcygpLCEwKX0sQTpmdW5jdGlvbigpe3JldHVybiB0aGlzLmxhbmcoKS5tZXJpZGllbSh0aGlzLmhvdXJzKCksdGhpcy5taW51dGVzKCksITEpfSxIOmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuaG91cnMoKX0saDpmdW5jdGlvbigpe3JldHVybiB0aGlzLmhvdXJzKCklMTJ8fDEyfSxtOmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMubWludXRlcygpfSxzOmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuc2Vjb25kcygpfSxTOmZ1bmN0aW9uKCl7cmV0dXJuIHModGhpcy5taWxsaXNlY29uZHMoKS8xMDApfSxTUzpmdW5jdGlvbigpe3JldHVybiBrKHModGhpcy5taWxsaXNlY29uZHMoKS8xMCksMil9LFNTUzpmdW5jdGlvbigpe3JldHVybiBrKHRoaXMubWlsbGlzZWNvbmRzKCksMyl9LFNTU1M6ZnVuY3Rpb24oKXtyZXR1cm4gayh0aGlzLm1pbGxpc2Vjb25kcygpLDMpfSxaOmZ1bmN0aW9uKCl7dmFyIGE9LXRoaXMuem9uZSgpLGI9XCIrXCI7cmV0dXJuIDA+YSYmKGE9LWEsYj1cIi1cIiksYitrKHMoYS82MCksMikrXCI6XCIrayhzKGEpJTYwLDIpfSxaWjpmdW5jdGlvbigpe3ZhciBhPS10aGlzLnpvbmUoKSxiPVwiK1wiO3JldHVybiAwPmEmJihhPS1hLGI9XCItXCIpLGIrayhzKGEvNjApLDIpK2socyhhKSU2MCwyKX0sejpmdW5jdGlvbigpe3JldHVybiB0aGlzLnpvbmVBYmJyKCl9LHp6OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuem9uZU5hbWUoKX0sWDpmdW5jdGlvbigpe3JldHVybiB0aGlzLnVuaXgoKX0sUTpmdW5jdGlvbigpe3JldHVybiB0aGlzLnF1YXJ0ZXIoKX19LFpiPVtcIm1vbnRoc1wiLFwibW9udGhzU2hvcnRcIixcIndlZWtkYXlzXCIsXCJ3ZWVrZGF5c1Nob3J0XCIsXCJ3ZWVrZGF5c01pblwiXTtXYi5sZW5ndGg7KWViPVdiLnBvcCgpLFliW2ViK1wib1wiXT1kKFliW2ViXSxlYik7Zm9yKDtYYi5sZW5ndGg7KWViPVhiLnBvcCgpLFliW2ViK2ViXT1jKFliW2ViXSwyKTtmb3IoWWIuRERERD1jKFliLkRERCwzKSxoKGUucHJvdG90eXBlLHtzZXQ6ZnVuY3Rpb24oYSl7dmFyIGIsYztmb3IoYyBpbiBhKWI9YVtjXSxcImZ1bmN0aW9uXCI9PXR5cGVvZiBiP3RoaXNbY109Yjp0aGlzW1wiX1wiK2NdPWJ9LF9tb250aHM6XCJKYW51YXJ5X0ZlYnJ1YXJ5X01hcmNoX0FwcmlsX01heV9KdW5lX0p1bHlfQXVndXN0X1NlcHRlbWJlcl9PY3RvYmVyX05vdmVtYmVyX0RlY2VtYmVyXCIuc3BsaXQoXCJfXCIpLG1vbnRoczpmdW5jdGlvbihhKXtyZXR1cm4gdGhpcy5fbW9udGhzW2EubW9udGgoKV19LF9tb250aHNTaG9ydDpcIkphbl9GZWJfTWFyX0Fwcl9NYXlfSnVuX0p1bF9BdWdfU2VwX09jdF9Ob3ZfRGVjXCIuc3BsaXQoXCJfXCIpLG1vbnRoc1Nob3J0OmZ1bmN0aW9uKGEpe3JldHVybiB0aGlzLl9tb250aHNTaG9ydFthLm1vbnRoKCldfSxtb250aHNQYXJzZTpmdW5jdGlvbihhKXt2YXIgYixjLGQ7Zm9yKHRoaXMuX21vbnRoc1BhcnNlfHwodGhpcy5fbW9udGhzUGFyc2U9W10pLGI9MDsxMj5iO2IrKylpZih0aGlzLl9tb250aHNQYXJzZVtiXXx8KGM9ZGIudXRjKFsyZTMsYl0pLGQ9XCJeXCIrdGhpcy5tb250aHMoYyxcIlwiKStcInxeXCIrdGhpcy5tb250aHNTaG9ydChjLFwiXCIpLHRoaXMuX21vbnRoc1BhcnNlW2JdPW5ldyBSZWdFeHAoZC5yZXBsYWNlKFwiLlwiLFwiXCIpLFwiaVwiKSksdGhpcy5fbW9udGhzUGFyc2VbYl0udGVzdChhKSlyZXR1cm4gYn0sX3dlZWtkYXlzOlwiU3VuZGF5X01vbmRheV9UdWVzZGF5X1dlZG5lc2RheV9UaHVyc2RheV9GcmlkYXlfU2F0dXJkYXlcIi5zcGxpdChcIl9cIiksd2Vla2RheXM6ZnVuY3Rpb24oYSl7cmV0dXJuIHRoaXMuX3dlZWtkYXlzW2EuZGF5KCldfSxfd2Vla2RheXNTaG9ydDpcIlN1bl9Nb25fVHVlX1dlZF9UaHVfRnJpX1NhdFwiLnNwbGl0KFwiX1wiKSx3ZWVrZGF5c1Nob3J0OmZ1bmN0aW9uKGEpe3JldHVybiB0aGlzLl93ZWVrZGF5c1Nob3J0W2EuZGF5KCldfSxfd2Vla2RheXNNaW46XCJTdV9Nb19UdV9XZV9UaF9Gcl9TYVwiLnNwbGl0KFwiX1wiKSx3ZWVrZGF5c01pbjpmdW5jdGlvbihhKXtyZXR1cm4gdGhpcy5fd2Vla2RheXNNaW5bYS5kYXkoKV19LHdlZWtkYXlzUGFyc2U6ZnVuY3Rpb24oYSl7dmFyIGIsYyxkO2Zvcih0aGlzLl93ZWVrZGF5c1BhcnNlfHwodGhpcy5fd2Vla2RheXNQYXJzZT1bXSksYj0wOzc+YjtiKyspaWYodGhpcy5fd2Vla2RheXNQYXJzZVtiXXx8KGM9ZGIoWzJlMywxXSkuZGF5KGIpLGQ9XCJeXCIrdGhpcy53ZWVrZGF5cyhjLFwiXCIpK1wifF5cIit0aGlzLndlZWtkYXlzU2hvcnQoYyxcIlwiKStcInxeXCIrdGhpcy53ZWVrZGF5c01pbihjLFwiXCIpLHRoaXMuX3dlZWtkYXlzUGFyc2VbYl09bmV3IFJlZ0V4cChkLnJlcGxhY2UoXCIuXCIsXCJcIiksXCJpXCIpKSx0aGlzLl93ZWVrZGF5c1BhcnNlW2JdLnRlc3QoYSkpcmV0dXJuIGJ9LF9sb25nRGF0ZUZvcm1hdDp7TFQ6XCJoOm1tIEFcIixMOlwiTU0vREQvWVlZWVwiLExMOlwiTU1NTSBEIFlZWVlcIixMTEw6XCJNTU1NIEQgWVlZWSBMVFwiLExMTEw6XCJkZGRkLCBNTU1NIEQgWVlZWSBMVFwifSxsb25nRGF0ZUZvcm1hdDpmdW5jdGlvbihhKXt2YXIgYj10aGlzLl9sb25nRGF0ZUZvcm1hdFthXTtyZXR1cm4hYiYmdGhpcy5fbG9uZ0RhdGVGb3JtYXRbYS50b1VwcGVyQ2FzZSgpXSYmKGI9dGhpcy5fbG9uZ0RhdGVGb3JtYXRbYS50b1VwcGVyQ2FzZSgpXS5yZXBsYWNlKC9NTU1NfE1NfEREfGRkZGQvZyxmdW5jdGlvbihhKXtyZXR1cm4gYS5zbGljZSgxKX0pLHRoaXMuX2xvbmdEYXRlRm9ybWF0W2FdPWIpLGJ9LGlzUE06ZnVuY3Rpb24oYSl7cmV0dXJuXCJwXCI9PT0oYStcIlwiKS50b0xvd2VyQ2FzZSgpLmNoYXJBdCgwKX0sX21lcmlkaWVtUGFyc2U6L1thcF1cXC4/bT9cXC4/L2ksbWVyaWRpZW06ZnVuY3Rpb24oYSxiLGMpe3JldHVybiBhPjExP2M/XCJwbVwiOlwiUE1cIjpjP1wiYW1cIjpcIkFNXCJ9LF9jYWxlbmRhcjp7c2FtZURheTpcIltUb2RheSBhdF0gTFRcIixuZXh0RGF5OlwiW1RvbW9ycm93IGF0XSBMVFwiLG5leHRXZWVrOlwiZGRkZCBbYXRdIExUXCIsbGFzdERheTpcIltZZXN0ZXJkYXkgYXRdIExUXCIsbGFzdFdlZWs6XCJbTGFzdF0gZGRkZCBbYXRdIExUXCIsc2FtZUVsc2U6XCJMXCJ9LGNhbGVuZGFyOmZ1bmN0aW9uKGEsYil7dmFyIGM9dGhpcy5fY2FsZW5kYXJbYV07cmV0dXJuXCJmdW5jdGlvblwiPT10eXBlb2YgYz9jLmFwcGx5KGIpOmN9LF9yZWxhdGl2ZVRpbWU6e2Z1dHVyZTpcImluICVzXCIscGFzdDpcIiVzIGFnb1wiLHM6XCJhIGZldyBzZWNvbmRzXCIsbTpcImEgbWludXRlXCIsbW06XCIlZCBtaW51dGVzXCIsaDpcImFuIGhvdXJcIixoaDpcIiVkIGhvdXJzXCIsZDpcImEgZGF5XCIsZGQ6XCIlZCBkYXlzXCIsTTpcImEgbW9udGhcIixNTTpcIiVkIG1vbnRoc1wiLHk6XCJhIHllYXJcIix5eTpcIiVkIHllYXJzXCJ9LHJlbGF0aXZlVGltZTpmdW5jdGlvbihhLGIsYyxkKXt2YXIgZT10aGlzLl9yZWxhdGl2ZVRpbWVbY107cmV0dXJuXCJmdW5jdGlvblwiPT10eXBlb2YgZT9lKGEsYixjLGQpOmUucmVwbGFjZSgvJWQvaSxhKX0scGFzdEZ1dHVyZTpmdW5jdGlvbihhLGIpe3ZhciBjPXRoaXMuX3JlbGF0aXZlVGltZVthPjA/XCJmdXR1cmVcIjpcInBhc3RcIl07cmV0dXJuXCJmdW5jdGlvblwiPT10eXBlb2YgYz9jKGIpOmMucmVwbGFjZSgvJXMvaSxiKX0sb3JkaW5hbDpmdW5jdGlvbihhKXtyZXR1cm4gdGhpcy5fb3JkaW5hbC5yZXBsYWNlKFwiJWRcIixhKX0sX29yZGluYWw6XCIlZFwiLHByZXBhcnNlOmZ1bmN0aW9uKGEpe3JldHVybiBhfSxwb3N0Zm9ybWF0OmZ1bmN0aW9uKGEpe3JldHVybiBhfSx3ZWVrOmZ1bmN0aW9uKGEpe3JldHVybiBZKGEsdGhpcy5fd2Vlay5kb3csdGhpcy5fd2Vlay5kb3kpLndlZWt9LF93ZWVrOntkb3c6MCxkb3k6Nn0sX2ludmFsaWREYXRlOlwiSW52YWxpZCBkYXRlXCIsaW52YWxpZERhdGU6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5faW52YWxpZERhdGV9fSksZGI9ZnVuY3Rpb24oYyxkLGUsZil7dmFyIGc7cmV0dXJuXCJib29sZWFuXCI9PXR5cGVvZiBlJiYoZj1lLGU9YSksZz17fSxnLl9pc0FNb21lbnRPYmplY3Q9ITAsZy5faT1jLGcuX2Y9ZCxnLl9sPWUsZy5fc3RyaWN0PWYsZy5faXNVVEM9ITEsZy5fcGY9YigpLCQoZyl9LGRiLnV0Yz1mdW5jdGlvbihjLGQsZSxmKXt2YXIgZztyZXR1cm5cImJvb2xlYW5cIj09dHlwZW9mIGUmJihmPWUsZT1hKSxnPXt9LGcuX2lzQU1vbWVudE9iamVjdD0hMCxnLl91c2VVVEM9ITAsZy5faXNVVEM9ITAsZy5fbD1lLGcuX2k9YyxnLl9mPWQsZy5fc3RyaWN0PWYsZy5fcGY9YigpLCQoZykudXRjKCl9LGRiLnVuaXg9ZnVuY3Rpb24oYSl7cmV0dXJuIGRiKDFlMyphKX0sZGIuZHVyYXRpb249ZnVuY3Rpb24oYSxiKXt2YXIgYyxkLGUsZj1hLGg9bnVsbDtyZXR1cm4gZGIuaXNEdXJhdGlvbihhKT9mPXttczphLl9taWxsaXNlY29uZHMsZDphLl9kYXlzLE06YS5fbW9udGhzfTpcIm51bWJlclwiPT10eXBlb2YgYT8oZj17fSxiP2ZbYl09YTpmLm1pbGxpc2Vjb25kcz1hKTooaD10Yi5leGVjKGEpKT8oYz1cIi1cIj09PWhbMV0/LTE6MSxmPXt5OjAsZDpzKGhba2JdKSpjLGg6cyhoW2xiXSkqYyxtOnMoaFttYl0pKmMsczpzKGhbbmJdKSpjLG1zOnMoaFtvYl0pKmN9KTooaD11Yi5leGVjKGEpKSYmKGM9XCItXCI9PT1oWzFdPy0xOjEsZT1mdW5jdGlvbihhKXt2YXIgYj1hJiZwYXJzZUZsb2F0KGEucmVwbGFjZShcIixcIixcIi5cIikpO3JldHVybihpc05hTihiKT8wOmIpKmN9LGY9e3k6ZShoWzJdKSxNOmUoaFszXSksZDplKGhbNF0pLGg6ZShoWzVdKSxtOmUoaFs2XSksczplKGhbN10pLHc6ZShoWzhdKX0pLGQ9bmV3IGcoZiksZGIuaXNEdXJhdGlvbihhKSYmYS5oYXNPd25Qcm9wZXJ0eShcIl9sYW5nXCIpJiYoZC5fbGFuZz1hLl9sYW5nKSxkfSxkYi52ZXJzaW9uPWZiLGRiLmRlZmF1bHRGb3JtYXQ9TmIsZGIudXBkYXRlT2Zmc2V0PWZ1bmN0aW9uKCl7fSxkYi5sYW5nPWZ1bmN0aW9uKGEsYil7dmFyIGM7cmV0dXJuIGE/KGI/QSh5KGEpLGIpOm51bGw9PT1iPyhCKGEpLGE9XCJlblwiKTpwYlthXXx8QyhhKSxjPWRiLmR1cmF0aW9uLmZuLl9sYW5nPWRiLmZuLl9sYW5nPUMoYSksYy5fYWJicik6ZGIuZm4uX2xhbmcuX2FiYnJ9LGRiLmxhbmdEYXRhPWZ1bmN0aW9uKGEpe3JldHVybiBhJiZhLl9sYW5nJiZhLl9sYW5nLl9hYmJyJiYoYT1hLl9sYW5nLl9hYmJyKSxDKGEpfSxkYi5pc01vbWVudD1mdW5jdGlvbihhKXtyZXR1cm4gYSBpbnN0YW5jZW9mIGZ8fG51bGwhPWEmJmEuaGFzT3duUHJvcGVydHkoXCJfaXNBTW9tZW50T2JqZWN0XCIpfSxkYi5pc0R1cmF0aW9uPWZ1bmN0aW9uKGEpe3JldHVybiBhIGluc3RhbmNlb2YgZ30sZWI9WmIubGVuZ3RoLTE7ZWI+PTA7LS1lYilyKFpiW2ViXSk7Zm9yKGRiLm5vcm1hbGl6ZVVuaXRzPWZ1bmN0aW9uKGEpe3JldHVybiBwKGEpfSxkYi5pbnZhbGlkPWZ1bmN0aW9uKGEpe3ZhciBiPWRiLnV0YygwLzApO3JldHVybiBudWxsIT1hP2goYi5fcGYsYSk6Yi5fcGYudXNlckludmFsaWRhdGVkPSEwLGJ9LGRiLnBhcnNlWm9uZT1mdW5jdGlvbihhKXtyZXR1cm4gZGIoYSkucGFyc2Vab25lKCl9LGgoZGIuZm49Zi5wcm90b3R5cGUse2Nsb25lOmZ1bmN0aW9uKCl7cmV0dXJuIGRiKHRoaXMpfSx2YWx1ZU9mOmZ1bmN0aW9uKCl7cmV0dXJuK3RoaXMuX2QrNmU0Kih0aGlzLl9vZmZzZXR8fDApfSx1bml4OmZ1bmN0aW9uKCl7cmV0dXJuIE1hdGguZmxvb3IoK3RoaXMvMWUzKX0sdG9TdHJpbmc6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5jbG9uZSgpLmxhbmcoXCJlblwiKS5mb3JtYXQoXCJkZGQgTU1NIEREIFlZWVkgSEg6bW06c3MgW0dNVF1aWlwiKX0sdG9EYXRlOmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuX29mZnNldD9uZXcgRGF0ZSgrdGhpcyk6dGhpcy5fZH0sdG9JU09TdHJpbmc6ZnVuY3Rpb24oKXt2YXIgYT1kYih0aGlzKS51dGMoKTtyZXR1cm4gMDxhLnllYXIoKSYmYS55ZWFyKCk8PTk5OTk/RihhLFwiWVlZWS1NTS1ERFtUXUhIOm1tOnNzLlNTU1taXVwiKTpGKGEsXCJZWVlZWVktTU0tRERbVF1ISDptbTpzcy5TU1NbWl1cIil9LHRvQXJyYXk6ZnVuY3Rpb24oKXt2YXIgYT10aGlzO3JldHVyblthLnllYXIoKSxhLm1vbnRoKCksYS5kYXRlKCksYS5ob3VycygpLGEubWludXRlcygpLGEuc2Vjb25kcygpLGEubWlsbGlzZWNvbmRzKCldfSxpc1ZhbGlkOmZ1bmN0aW9uKCl7cmV0dXJuIHgodGhpcyl9LGlzRFNUU2hpZnRlZDpmdW5jdGlvbigpe3JldHVybiB0aGlzLl9hP3RoaXMuaXNWYWxpZCgpJiZvKHRoaXMuX2EsKHRoaXMuX2lzVVRDP2RiLnV0Yyh0aGlzLl9hKTpkYih0aGlzLl9hKSkudG9BcnJheSgpKT4wOiExfSxwYXJzaW5nRmxhZ3M6ZnVuY3Rpb24oKXtyZXR1cm4gaCh7fSx0aGlzLl9wZil9LGludmFsaWRBdDpmdW5jdGlvbigpe3JldHVybiB0aGlzLl9wZi5vdmVyZmxvd30sdXRjOmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuem9uZSgwKX0sbG9jYWw6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy56b25lKDApLHRoaXMuX2lzVVRDPSExLHRoaXN9LGZvcm1hdDpmdW5jdGlvbihhKXt2YXIgYj1GKHRoaXMsYXx8ZGIuZGVmYXVsdEZvcm1hdCk7cmV0dXJuIHRoaXMubGFuZygpLnBvc3Rmb3JtYXQoYil9LGFkZDpmdW5jdGlvbihhLGIpe3ZhciBjO3JldHVybiBjPVwic3RyaW5nXCI9PXR5cGVvZiBhP2RiLmR1cmF0aW9uKCtiLGEpOmRiLmR1cmF0aW9uKGEsYiksbCh0aGlzLGMsMSksdGhpc30sc3VidHJhY3Q6ZnVuY3Rpb24oYSxiKXt2YXIgYztyZXR1cm4gYz1cInN0cmluZ1wiPT10eXBlb2YgYT9kYi5kdXJhdGlvbigrYixhKTpkYi5kdXJhdGlvbihhLGIpLGwodGhpcyxjLC0xKSx0aGlzfSxkaWZmOmZ1bmN0aW9uKGEsYixjKXt2YXIgZCxlLGY9eihhLHRoaXMpLGc9NmU0Kih0aGlzLnpvbmUoKS1mLnpvbmUoKSk7cmV0dXJuIGI9cChiKSxcInllYXJcIj09PWJ8fFwibW9udGhcIj09PWI/KGQ9NDMyZTUqKHRoaXMuZGF5c0luTW9udGgoKStmLmRheXNJbk1vbnRoKCkpLGU9MTIqKHRoaXMueWVhcigpLWYueWVhcigpKSsodGhpcy5tb250aCgpLWYubW9udGgoKSksZSs9KHRoaXMtZGIodGhpcykuc3RhcnRPZihcIm1vbnRoXCIpLShmLWRiKGYpLnN0YXJ0T2YoXCJtb250aFwiKSkpL2QsZS09NmU0Kih0aGlzLnpvbmUoKS1kYih0aGlzKS5zdGFydE9mKFwibW9udGhcIikuem9uZSgpLShmLnpvbmUoKS1kYihmKS5zdGFydE9mKFwibW9udGhcIikuem9uZSgpKSkvZCxcInllYXJcIj09PWImJihlLz0xMikpOihkPXRoaXMtZixlPVwic2Vjb25kXCI9PT1iP2QvMWUzOlwibWludXRlXCI9PT1iP2QvNmU0OlwiaG91clwiPT09Yj9kLzM2ZTU6XCJkYXlcIj09PWI/KGQtZykvODY0ZTU6XCJ3ZWVrXCI9PT1iPyhkLWcpLzYwNDhlNTpkKSxjP2U6aihlKX0sZnJvbTpmdW5jdGlvbihhLGIpe3JldHVybiBkYi5kdXJhdGlvbih0aGlzLmRpZmYoYSkpLmxhbmcodGhpcy5sYW5nKCkuX2FiYnIpLmh1bWFuaXplKCFiKX0sZnJvbU5vdzpmdW5jdGlvbihhKXtyZXR1cm4gdGhpcy5mcm9tKGRiKCksYSl9LGNhbGVuZGFyOmZ1bmN0aW9uKCl7dmFyIGE9eihkYigpLHRoaXMpLnN0YXJ0T2YoXCJkYXlcIiksYj10aGlzLmRpZmYoYSxcImRheXNcIiwhMCksYz0tNj5iP1wic2FtZUVsc2VcIjotMT5iP1wibGFzdFdlZWtcIjowPmI/XCJsYXN0RGF5XCI6MT5iP1wic2FtZURheVwiOjI+Yj9cIm5leHREYXlcIjo3PmI/XCJuZXh0V2Vla1wiOlwic2FtZUVsc2VcIjtyZXR1cm4gdGhpcy5mb3JtYXQodGhpcy5sYW5nKCkuY2FsZW5kYXIoYyx0aGlzKSl9LGlzTGVhcFllYXI6ZnVuY3Rpb24oKXtyZXR1cm4gdih0aGlzLnllYXIoKSl9LGlzRFNUOmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuem9uZSgpPHRoaXMuY2xvbmUoKS5tb250aCgwKS56b25lKCl8fHRoaXMuem9uZSgpPHRoaXMuY2xvbmUoKS5tb250aCg1KS56b25lKCl9LGRheTpmdW5jdGlvbihhKXt2YXIgYj10aGlzLl9pc1VUQz90aGlzLl9kLmdldFVUQ0RheSgpOnRoaXMuX2QuZ2V0RGF5KCk7cmV0dXJuIG51bGwhPWE/KGE9VihhLHRoaXMubGFuZygpKSx0aGlzLmFkZCh7ZDphLWJ9KSk6Yn0sbW9udGg6ZnVuY3Rpb24oYSl7dmFyIGIsYz10aGlzLl9pc1VUQz9cIlVUQ1wiOlwiXCI7cmV0dXJuIG51bGwhPWE/XCJzdHJpbmdcIj09dHlwZW9mIGEmJihhPXRoaXMubGFuZygpLm1vbnRoc1BhcnNlKGEpLFwibnVtYmVyXCIhPXR5cGVvZiBhKT90aGlzOihiPXRoaXMuZGF0ZSgpLHRoaXMuZGF0ZSgxKSx0aGlzLl9kW1wic2V0XCIrYytcIk1vbnRoXCJdKGEpLHRoaXMuZGF0ZShNYXRoLm1pbihiLHRoaXMuZGF5c0luTW9udGgoKSkpLGRiLnVwZGF0ZU9mZnNldCh0aGlzKSx0aGlzKTp0aGlzLl9kW1wiZ2V0XCIrYytcIk1vbnRoXCJdKCl9LHN0YXJ0T2Y6ZnVuY3Rpb24oYSl7c3dpdGNoKGE9cChhKSl7Y2FzZVwieWVhclwiOnRoaXMubW9udGgoMCk7Y2FzZVwibW9udGhcIjp0aGlzLmRhdGUoMSk7Y2FzZVwid2Vla1wiOmNhc2VcImlzb1dlZWtcIjpjYXNlXCJkYXlcIjp0aGlzLmhvdXJzKDApO2Nhc2VcImhvdXJcIjp0aGlzLm1pbnV0ZXMoMCk7Y2FzZVwibWludXRlXCI6dGhpcy5zZWNvbmRzKDApO2Nhc2VcInNlY29uZFwiOnRoaXMubWlsbGlzZWNvbmRzKDApfXJldHVyblwid2Vla1wiPT09YT90aGlzLndlZWtkYXkoMCk6XCJpc29XZWVrXCI9PT1hJiZ0aGlzLmlzb1dlZWtkYXkoMSksdGhpc30sZW5kT2Y6ZnVuY3Rpb24oYSl7cmV0dXJuIGE9cChhKSx0aGlzLnN0YXJ0T2YoYSkuYWRkKFwiaXNvV2Vla1wiPT09YT9cIndlZWtcIjphLDEpLnN1YnRyYWN0KFwibXNcIiwxKX0saXNBZnRlcjpmdW5jdGlvbihhLGIpe3JldHVybiBiPVwidW5kZWZpbmVkXCIhPXR5cGVvZiBiP2I6XCJtaWxsaXNlY29uZFwiLCt0aGlzLmNsb25lKCkuc3RhcnRPZihiKT4rZGIoYSkuc3RhcnRPZihiKX0saXNCZWZvcmU6ZnVuY3Rpb24oYSxiKXtyZXR1cm4gYj1cInVuZGVmaW5lZFwiIT10eXBlb2YgYj9iOlwibWlsbGlzZWNvbmRcIiwrdGhpcy5jbG9uZSgpLnN0YXJ0T2YoYik8K2RiKGEpLnN0YXJ0T2YoYil9LGlzU2FtZTpmdW5jdGlvbihhLGIpe3JldHVybiBiPWJ8fFwibXNcIiwrdGhpcy5jbG9uZSgpLnN0YXJ0T2YoYik9PT0reihhLHRoaXMpLnN0YXJ0T2YoYil9LG1pbjpmdW5jdGlvbihhKXtyZXR1cm4gYT1kYi5hcHBseShudWxsLGFyZ3VtZW50cyksdGhpcz5hP3RoaXM6YX0sbWF4OmZ1bmN0aW9uKGEpe3JldHVybiBhPWRiLmFwcGx5KG51bGwsYXJndW1lbnRzKSxhPnRoaXM/dGhpczphfSx6b25lOmZ1bmN0aW9uKGEpe3ZhciBiPXRoaXMuX29mZnNldHx8MDtyZXR1cm4gbnVsbD09YT90aGlzLl9pc1VUQz9iOnRoaXMuX2QuZ2V0VGltZXpvbmVPZmZzZXQoKTooXCJzdHJpbmdcIj09dHlwZW9mIGEmJihhPUkoYSkpLE1hdGguYWJzKGEpPDE2JiYoYT02MCphKSx0aGlzLl9vZmZzZXQ9YSx0aGlzLl9pc1VUQz0hMCxiIT09YSYmbCh0aGlzLGRiLmR1cmF0aW9uKGItYSxcIm1cIiksMSwhMCksdGhpcyl9LHpvbmVBYmJyOmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuX2lzVVRDP1wiVVRDXCI6XCJcIn0sem9uZU5hbWU6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5faXNVVEM/XCJDb29yZGluYXRlZCBVbml2ZXJzYWwgVGltZVwiOlwiXCJ9LHBhcnNlWm9uZTpmdW5jdGlvbigpe3JldHVybiB0aGlzLl90em0/dGhpcy56b25lKHRoaXMuX3R6bSk6XCJzdHJpbmdcIj09dHlwZW9mIHRoaXMuX2kmJnRoaXMuem9uZSh0aGlzLl9pKSx0aGlzfSxoYXNBbGlnbmVkSG91ck9mZnNldDpmdW5jdGlvbihhKXtyZXR1cm4gYT1hP2RiKGEpLnpvbmUoKTowLCh0aGlzLnpvbmUoKS1hKSU2MD09PTB9LGRheXNJbk1vbnRoOmZ1bmN0aW9uKCl7cmV0dXJuIHQodGhpcy55ZWFyKCksdGhpcy5tb250aCgpKX0sZGF5T2ZZZWFyOmZ1bmN0aW9uKGEpe3ZhciBiPWhiKChkYih0aGlzKS5zdGFydE9mKFwiZGF5XCIpLWRiKHRoaXMpLnN0YXJ0T2YoXCJ5ZWFyXCIpKS84NjRlNSkrMTtyZXR1cm4gbnVsbD09YT9iOnRoaXMuYWRkKFwiZFwiLGEtYil9LHF1YXJ0ZXI6ZnVuY3Rpb24oKXtyZXR1cm4gTWF0aC5jZWlsKCh0aGlzLm1vbnRoKCkrMSkvMyl9LHdlZWtZZWFyOmZ1bmN0aW9uKGEpe3ZhciBiPVkodGhpcyx0aGlzLmxhbmcoKS5fd2Vlay5kb3csdGhpcy5sYW5nKCkuX3dlZWsuZG95KS55ZWFyO3JldHVybiBudWxsPT1hP2I6dGhpcy5hZGQoXCJ5XCIsYS1iKX0saXNvV2Vla1llYXI6ZnVuY3Rpb24oYSl7dmFyIGI9WSh0aGlzLDEsNCkueWVhcjtyZXR1cm4gbnVsbD09YT9iOnRoaXMuYWRkKFwieVwiLGEtYil9LHdlZWs6ZnVuY3Rpb24oYSl7dmFyIGI9dGhpcy5sYW5nKCkud2Vlayh0aGlzKTtyZXR1cm4gbnVsbD09YT9iOnRoaXMuYWRkKFwiZFwiLDcqKGEtYikpfSxpc29XZWVrOmZ1bmN0aW9uKGEpe3ZhciBiPVkodGhpcywxLDQpLndlZWs7cmV0dXJuIG51bGw9PWE/Yjp0aGlzLmFkZChcImRcIiw3KihhLWIpKX0sd2Vla2RheTpmdW5jdGlvbihhKXt2YXIgYj0odGhpcy5kYXkoKSs3LXRoaXMubGFuZygpLl93ZWVrLmRvdyklNztyZXR1cm4gbnVsbD09YT9iOnRoaXMuYWRkKFwiZFwiLGEtYil9LGlzb1dlZWtkYXk6ZnVuY3Rpb24oYSl7cmV0dXJuIG51bGw9PWE/dGhpcy5kYXkoKXx8Nzp0aGlzLmRheSh0aGlzLmRheSgpJTc/YTphLTcpfSxnZXQ6ZnVuY3Rpb24oYSl7cmV0dXJuIGE9cChhKSx0aGlzW2FdKCl9LHNldDpmdW5jdGlvbihhLGIpe3JldHVybiBhPXAoYSksXCJmdW5jdGlvblwiPT10eXBlb2YgdGhpc1thXSYmdGhpc1thXShiKSx0aGlzfSxsYW5nOmZ1bmN0aW9uKGIpe3JldHVybiBiPT09YT90aGlzLl9sYW5nOih0aGlzLl9sYW5nPUMoYiksdGhpcyl9fSksZWI9MDtlYjxSYi5sZW5ndGg7ZWIrKylfKFJiW2ViXS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL3MkLyxcIlwiKSxSYltlYl0pO18oXCJ5ZWFyXCIsXCJGdWxsWWVhclwiKSxkYi5mbi5kYXlzPWRiLmZuLmRheSxkYi5mbi5tb250aHM9ZGIuZm4ubW9udGgsZGIuZm4ud2Vla3M9ZGIuZm4ud2VlayxkYi5mbi5pc29XZWVrcz1kYi5mbi5pc29XZWVrLGRiLmZuLnRvSlNPTj1kYi5mbi50b0lTT1N0cmluZyxoKGRiLmR1cmF0aW9uLmZuPWcucHJvdG90eXBlLHtfYnViYmxlOmZ1bmN0aW9uKCl7dmFyIGEsYixjLGQsZT10aGlzLl9taWxsaXNlY29uZHMsZj10aGlzLl9kYXlzLGc9dGhpcy5fbW9udGhzLGg9dGhpcy5fZGF0YTtoLm1pbGxpc2Vjb25kcz1lJTFlMyxhPWooZS8xZTMpLGguc2Vjb25kcz1hJTYwLGI9aihhLzYwKSxoLm1pbnV0ZXM9YiU2MCxjPWooYi82MCksaC5ob3Vycz1jJTI0LGYrPWooYy8yNCksaC5kYXlzPWYlMzAsZys9aihmLzMwKSxoLm1vbnRocz1nJTEyLGQ9aihnLzEyKSxoLnllYXJzPWR9LHdlZWtzOmZ1bmN0aW9uKCl7cmV0dXJuIGoodGhpcy5kYXlzKCkvNyl9LHZhbHVlT2Y6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5fbWlsbGlzZWNvbmRzKzg2NGU1KnRoaXMuX2RheXMrdGhpcy5fbW9udGhzJTEyKjI1OTJlNiszMTUzNmU2KnModGhpcy5fbW9udGhzLzEyKX0saHVtYW5pemU6ZnVuY3Rpb24oYSl7dmFyIGI9K3RoaXMsYz1YKGIsIWEsdGhpcy5sYW5nKCkpO3JldHVybiBhJiYoYz10aGlzLmxhbmcoKS5wYXN0RnV0dXJlKGIsYykpLHRoaXMubGFuZygpLnBvc3Rmb3JtYXQoYyl9LGFkZDpmdW5jdGlvbihhLGIpe3ZhciBjPWRiLmR1cmF0aW9uKGEsYik7cmV0dXJuIHRoaXMuX21pbGxpc2Vjb25kcys9Yy5fbWlsbGlzZWNvbmRzLHRoaXMuX2RheXMrPWMuX2RheXMsdGhpcy5fbW9udGhzKz1jLl9tb250aHMsdGhpcy5fYnViYmxlKCksdGhpc30sc3VidHJhY3Q6ZnVuY3Rpb24oYSxiKXt2YXIgYz1kYi5kdXJhdGlvbihhLGIpO3JldHVybiB0aGlzLl9taWxsaXNlY29uZHMtPWMuX21pbGxpc2Vjb25kcyx0aGlzLl9kYXlzLT1jLl9kYXlzLHRoaXMuX21vbnRocy09Yy5fbW9udGhzLHRoaXMuX2J1YmJsZSgpLHRoaXN9LGdldDpmdW5jdGlvbihhKXtyZXR1cm4gYT1wKGEpLHRoaXNbYS50b0xvd2VyQ2FzZSgpK1wic1wiXSgpfSxhczpmdW5jdGlvbihhKXtyZXR1cm4gYT1wKGEpLHRoaXNbXCJhc1wiK2EuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkrYS5zbGljZSgxKStcInNcIl0oKX0sbGFuZzpkYi5mbi5sYW5nLHRvSXNvU3RyaW5nOmZ1bmN0aW9uKCl7dmFyIGE9TWF0aC5hYnModGhpcy55ZWFycygpKSxiPU1hdGguYWJzKHRoaXMubW9udGhzKCkpLGM9TWF0aC5hYnModGhpcy5kYXlzKCkpLGQ9TWF0aC5hYnModGhpcy5ob3VycygpKSxlPU1hdGguYWJzKHRoaXMubWludXRlcygpKSxmPU1hdGguYWJzKHRoaXMuc2Vjb25kcygpK3RoaXMubWlsbGlzZWNvbmRzKCkvMWUzKTtyZXR1cm4gdGhpcy5hc1NlY29uZHMoKT8odGhpcy5hc1NlY29uZHMoKTwwP1wiLVwiOlwiXCIpK1wiUFwiKyhhP2ErXCJZXCI6XCJcIikrKGI/YitcIk1cIjpcIlwiKSsoYz9jK1wiRFwiOlwiXCIpKyhkfHxlfHxmP1wiVFwiOlwiXCIpKyhkP2QrXCJIXCI6XCJcIikrKGU/ZStcIk1cIjpcIlwiKSsoZj9mK1wiU1wiOlwiXCIpOlwiUDBEXCJ9fSk7Zm9yKGViIGluIFNiKVNiLmhhc093blByb3BlcnR5KGViKSYmKGJiKGViLFNiW2ViXSksYWIoZWIudG9Mb3dlckNhc2UoKSkpO2JiKFwiV2Vla3NcIiw2MDQ4ZTUpLGRiLmR1cmF0aW9uLmZuLmFzTW9udGhzPWZ1bmN0aW9uKCl7cmV0dXJuKCt0aGlzLTMxNTM2ZTYqdGhpcy55ZWFycygpKS8yNTkyZTYrMTIqdGhpcy55ZWFycygpfSxkYi5sYW5nKFwiZW5cIix7b3JkaW5hbDpmdW5jdGlvbihhKXt2YXIgYj1hJTEwLGM9MT09PXMoYSUxMDAvMTApP1widGhcIjoxPT09Yj9cInN0XCI6Mj09PWI/XCJuZFwiOjM9PT1iP1wicmRcIjpcInRoXCI7cmV0dXJuIGErY319KSxyYj8obW9kdWxlLmV4cG9ydHM9ZGIsY2IoITApKTpcImZ1bmN0aW9uXCI9PXR5cGVvZiBkZWZpbmUmJmRlZmluZS5hbWQ/ZGVmaW5lKFwibW9tZW50XCIsZnVuY3Rpb24oYixjLGQpe3JldHVybiBkLmNvbmZpZyYmZC5jb25maWcoKSYmZC5jb25maWcoKS5ub0dsb2JhbCE9PSEwJiZjYihkLmNvbmZpZygpLm5vR2xvYmFsPT09YSksZGJ9KTpjYigpfSkuY2FsbCh0aGlzKTsiLCIvKiBtb3VzZXRyYXAgdjEuNC42IGNyYWlnLmlzL2tpbGxpbmcvbWljZSAqL1xuKGZ1bmN0aW9uKEoscixmKXtmdW5jdGlvbiBzKGEsYixkKXthLmFkZEV2ZW50TGlzdGVuZXI/YS5hZGRFdmVudExpc3RlbmVyKGIsZCwhMSk6YS5hdHRhY2hFdmVudChcIm9uXCIrYixkKX1mdW5jdGlvbiBBKGEpe2lmKFwia2V5cHJlc3NcIj09YS50eXBlKXt2YXIgYj1TdHJpbmcuZnJvbUNoYXJDb2RlKGEud2hpY2gpO2Euc2hpZnRLZXl8fChiPWIudG9Mb3dlckNhc2UoKSk7cmV0dXJuIGJ9cmV0dXJuIGhbYS53aGljaF0/aFthLndoaWNoXTpCW2Eud2hpY2hdP0JbYS53aGljaF06U3RyaW5nLmZyb21DaGFyQ29kZShhLndoaWNoKS50b0xvd2VyQ2FzZSgpfWZ1bmN0aW9uIHQoYSl7YT1hfHx7fTt2YXIgYj0hMSxkO2ZvcihkIGluIG4pYVtkXT9iPSEwOm5bZF09MDtifHwodT0hMSl9ZnVuY3Rpb24gQyhhLGIsZCxjLGUsdil7dmFyIGcsayxmPVtdLGg9ZC50eXBlO2lmKCFsW2FdKXJldHVybltdO1wia2V5dXBcIj09aCYmdyhhKSYmKGI9W2FdKTtmb3IoZz0wO2c8bFthXS5sZW5ndGg7KytnKWlmKGs9XG5sW2FdW2ddLCEoIWMmJmsuc2VxJiZuW2suc2VxXSE9ay5sZXZlbHx8aCE9ay5hY3Rpb258fChcImtleXByZXNzXCIhPWh8fGQubWV0YUtleXx8ZC5jdHJsS2V5KSYmYi5zb3J0KCkuam9pbihcIixcIikhPT1rLm1vZGlmaWVycy5zb3J0KCkuam9pbihcIixcIikpKXt2YXIgbT1jJiZrLnNlcT09YyYmay5sZXZlbD09djsoIWMmJmsuY29tYm89PWV8fG0pJiZsW2FdLnNwbGljZShnLDEpO2YucHVzaChrKX1yZXR1cm4gZn1mdW5jdGlvbiBLKGEpe3ZhciBiPVtdO2Euc2hpZnRLZXkmJmIucHVzaChcInNoaWZ0XCIpO2EuYWx0S2V5JiZiLnB1c2goXCJhbHRcIik7YS5jdHJsS2V5JiZiLnB1c2goXCJjdHJsXCIpO2EubWV0YUtleSYmYi5wdXNoKFwibWV0YVwiKTtyZXR1cm4gYn1mdW5jdGlvbiB4KGEsYixkLGMpe20uc3RvcENhbGxiYWNrKGIsYi50YXJnZXR8fGIuc3JjRWxlbWVudCxkLGMpfHwhMSE9PWEoYixkKXx8KGIucHJldmVudERlZmF1bHQ/Yi5wcmV2ZW50RGVmYXVsdCgpOmIucmV0dXJuVmFsdWU9ITEsYi5zdG9wUHJvcGFnYXRpb24/XG5iLnN0b3BQcm9wYWdhdGlvbigpOmIuY2FuY2VsQnViYmxlPSEwKX1mdW5jdGlvbiB5KGEpe1wibnVtYmVyXCIhPT10eXBlb2YgYS53aGljaCYmKGEud2hpY2g9YS5rZXlDb2RlKTt2YXIgYj1BKGEpO2ImJihcImtleXVwXCI9PWEudHlwZSYmej09PWI/ej0hMTptLmhhbmRsZUtleShiLEsoYSksYSkpfWZ1bmN0aW9uIHcoYSl7cmV0dXJuXCJzaGlmdFwiPT1hfHxcImN0cmxcIj09YXx8XCJhbHRcIj09YXx8XCJtZXRhXCI9PWF9ZnVuY3Rpb24gTChhLGIsZCxjKXtmdW5jdGlvbiBlKGIpe3JldHVybiBmdW5jdGlvbigpe3U9YjsrK25bYV07Y2xlYXJUaW1lb3V0KEQpO0Q9c2V0VGltZW91dCh0LDFFMyl9fWZ1bmN0aW9uIHYoYil7eChkLGIsYSk7XCJrZXl1cFwiIT09YyYmKHo9QShiKSk7c2V0VGltZW91dCh0LDEwKX1mb3IodmFyIGc9blthXT0wO2c8Yi5sZW5ndGg7KytnKXt2YXIgZj1nKzE9PT1iLmxlbmd0aD92OmUoY3x8RShiW2crMV0pLmFjdGlvbik7RihiW2ddLGYsYyxhLGcpfX1mdW5jdGlvbiBFKGEsYil7dmFyIGQsXG5jLGUsZj1bXTtkPVwiK1wiPT09YT9bXCIrXCJdOmEuc3BsaXQoXCIrXCIpO2ZvcihlPTA7ZTxkLmxlbmd0aDsrK2UpYz1kW2VdLEdbY10mJihjPUdbY10pLGImJlwia2V5cHJlc3NcIiE9YiYmSFtjXSYmKGM9SFtjXSxmLnB1c2goXCJzaGlmdFwiKSksdyhjKSYmZi5wdXNoKGMpO2Q9YztlPWI7aWYoIWUpe2lmKCFwKXtwPXt9O2Zvcih2YXIgZyBpbiBoKTk1PGcmJjExMj5nfHxoLmhhc093blByb3BlcnR5KGcpJiYocFtoW2ddXT1nKX1lPXBbZF0/XCJrZXlkb3duXCI6XCJrZXlwcmVzc1wifVwia2V5cHJlc3NcIj09ZSYmZi5sZW5ndGgmJihlPVwia2V5ZG93blwiKTtyZXR1cm57a2V5OmMsbW9kaWZpZXJzOmYsYWN0aW9uOmV9fWZ1bmN0aW9uIEYoYSxiLGQsYyxlKXtxW2ErXCI6XCIrZF09YjthPWEucmVwbGFjZSgvXFxzKy9nLFwiIFwiKTt2YXIgZj1hLnNwbGl0KFwiIFwiKTsxPGYubGVuZ3RoP0woYSxmLGIsZCk6KGQ9RShhLGQpLGxbZC5rZXldPWxbZC5rZXldfHxbXSxDKGQua2V5LGQubW9kaWZpZXJzLHt0eXBlOmQuYWN0aW9ufSxcbmMsYSxlKSxsW2Qua2V5XVtjP1widW5zaGlmdFwiOlwicHVzaFwiXSh7Y2FsbGJhY2s6Yixtb2RpZmllcnM6ZC5tb2RpZmllcnMsYWN0aW9uOmQuYWN0aW9uLHNlcTpjLGxldmVsOmUsY29tYm86YX0pKX12YXIgaD17ODpcImJhY2tzcGFjZVwiLDk6XCJ0YWJcIiwxMzpcImVudGVyXCIsMTY6XCJzaGlmdFwiLDE3OlwiY3RybFwiLDE4OlwiYWx0XCIsMjA6XCJjYXBzbG9ja1wiLDI3OlwiZXNjXCIsMzI6XCJzcGFjZVwiLDMzOlwicGFnZXVwXCIsMzQ6XCJwYWdlZG93blwiLDM1OlwiZW5kXCIsMzY6XCJob21lXCIsMzc6XCJsZWZ0XCIsMzg6XCJ1cFwiLDM5OlwicmlnaHRcIiw0MDpcImRvd25cIiw0NTpcImluc1wiLDQ2OlwiZGVsXCIsOTE6XCJtZXRhXCIsOTM6XCJtZXRhXCIsMjI0OlwibWV0YVwifSxCPXsxMDY6XCIqXCIsMTA3OlwiK1wiLDEwOTpcIi1cIiwxMTA6XCIuXCIsMTExOlwiL1wiLDE4NjpcIjtcIiwxODc6XCI9XCIsMTg4OlwiLFwiLDE4OTpcIi1cIiwxOTA6XCIuXCIsMTkxOlwiL1wiLDE5MjpcImBcIiwyMTk6XCJbXCIsMjIwOlwiXFxcXFwiLDIyMTpcIl1cIiwyMjI6XCInXCJ9LEg9e1wiflwiOlwiYFwiLFwiIVwiOlwiMVwiLFxuXCJAXCI6XCIyXCIsXCIjXCI6XCIzXCIsJDpcIjRcIixcIiVcIjpcIjVcIixcIl5cIjpcIjZcIixcIiZcIjpcIjdcIixcIipcIjpcIjhcIixcIihcIjpcIjlcIixcIilcIjpcIjBcIixfOlwiLVwiLFwiK1wiOlwiPVwiLFwiOlwiOlwiO1wiLCdcIic6XCInXCIsXCI8XCI6XCIsXCIsXCI+XCI6XCIuXCIsXCI/XCI6XCIvXCIsXCJ8XCI6XCJcXFxcXCJ9LEc9e29wdGlvbjpcImFsdFwiLGNvbW1hbmQ6XCJtZXRhXCIsXCJyZXR1cm5cIjpcImVudGVyXCIsZXNjYXBlOlwiZXNjXCIsbW9kOi9NYWN8aVBvZHxpUGhvbmV8aVBhZC8udGVzdChuYXZpZ2F0b3IucGxhdGZvcm0pP1wibWV0YVwiOlwiY3RybFwifSxwLGw9e30scT17fSxuPXt9LEQsej0hMSxJPSExLHU9ITE7Zm9yKGY9MTsyMD5mOysrZiloWzExMStmXT1cImZcIitmO2ZvcihmPTA7OT49ZjsrK2YpaFtmKzk2XT1mO3MocixcImtleXByZXNzXCIseSk7cyhyLFwia2V5ZG93blwiLHkpO3MocixcImtleXVwXCIseSk7dmFyIG09e2JpbmQ6ZnVuY3Rpb24oYSxiLGQpe2E9YSBpbnN0YW5jZW9mIEFycmF5P2E6W2FdO2Zvcih2YXIgYz0wO2M8YS5sZW5ndGg7KytjKUYoYVtjXSxiLGQpO3JldHVybiB0aGlzfSxcbnVuYmluZDpmdW5jdGlvbihhLGIpe3JldHVybiBtLmJpbmQoYSxmdW5jdGlvbigpe30sYil9LHRyaWdnZXI6ZnVuY3Rpb24oYSxiKXtpZihxW2ErXCI6XCIrYl0pcVthK1wiOlwiK2JdKHt9LGEpO3JldHVybiB0aGlzfSxyZXNldDpmdW5jdGlvbigpe2w9e307cT17fTtyZXR1cm4gdGhpc30sc3RvcENhbGxiYWNrOmZ1bmN0aW9uKGEsYil7cmV0dXJuLTE8KFwiIFwiK2IuY2xhc3NOYW1lK1wiIFwiKS5pbmRleE9mKFwiIG1vdXNldHJhcCBcIik/ITE6XCJJTlBVVFwiPT1iLnRhZ05hbWV8fFwiU0VMRUNUXCI9PWIudGFnTmFtZXx8XCJURVhUQVJFQVwiPT1iLnRhZ05hbWV8fGIuaXNDb250ZW50RWRpdGFibGV9LGhhbmRsZUtleTpmdW5jdGlvbihhLGIsZCl7dmFyIGM9QyhhLGIsZCksZTtiPXt9O3ZhciBmPTAsZz0hMTtmb3IoZT0wO2U8Yy5sZW5ndGg7KytlKWNbZV0uc2VxJiYoZj1NYXRoLm1heChmLGNbZV0ubGV2ZWwpKTtmb3IoZT0wO2U8Yy5sZW5ndGg7KytlKWNbZV0uc2VxP2NbZV0ubGV2ZWw9PWYmJihnPSEwLFxuYltjW2VdLnNlcV09MSx4KGNbZV0uY2FsbGJhY2ssZCxjW2VdLmNvbWJvLGNbZV0uc2VxKSk6Z3x8eChjW2VdLmNhbGxiYWNrLGQsY1tlXS5jb21ibyk7Yz1cImtleXByZXNzXCI9PWQudHlwZSYmSTtkLnR5cGUhPXV8fHcoYSl8fGN8fHQoYik7ST1nJiZcImtleWRvd25cIj09ZC50eXBlfX07Si5Nb3VzZXRyYXA9bTtcImZ1bmN0aW9uXCI9PT10eXBlb2YgZGVmaW5lJiZkZWZpbmUuYW1kJiZkZWZpbmUobSl9KSh3aW5kb3csZG9jdW1lbnQpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHdpbmRvdy5Nb3VzZXRyYXA7XG53aW5kb3cuTW91c2V0cmFwID0gbnVsbDsiLCIvKlxuXG4gSlMgU2lnbmFscyA8aHR0cDovL21pbGxlcm1lZGVpcm9zLmdpdGh1Yi5jb20vanMtc2lnbmFscy8+XG4gUmVsZWFzZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlXG4gQXV0aG9yOiBNaWxsZXIgTWVkZWlyb3NcbiBWZXJzaW9uOiAxLjAuMCAtIEJ1aWxkOiAyNjggKDIwMTIvMTEvMjkgMDU6NDggUE0pXG4qL1xuKGZ1bmN0aW9uKGkpe2Z1bmN0aW9uIGgoYSxiLGMsZCxlKXt0aGlzLl9saXN0ZW5lcj1iO3RoaXMuX2lzT25jZT1jO3RoaXMuY29udGV4dD1kO3RoaXMuX3NpZ25hbD1hO3RoaXMuX3ByaW9yaXR5PWV8fDB9ZnVuY3Rpb24gZyhhLGIpe2lmKHR5cGVvZiBhIT09XCJmdW5jdGlvblwiKXRocm93IEVycm9yKFwibGlzdGVuZXIgaXMgYSByZXF1aXJlZCBwYXJhbSBvZiB7Zm59KCkgYW5kIHNob3VsZCBiZSBhIEZ1bmN0aW9uLlwiLnJlcGxhY2UoXCJ7Zm59XCIsYikpO31mdW5jdGlvbiBlKCl7dGhpcy5fYmluZGluZ3M9W107dGhpcy5fcHJldlBhcmFtcz1udWxsO3ZhciBhPXRoaXM7dGhpcy5kaXNwYXRjaD1mdW5jdGlvbigpe2UucHJvdG90eXBlLmRpc3BhdGNoLmFwcGx5KGEsYXJndW1lbnRzKX19aC5wcm90b3R5cGU9e2FjdGl2ZTohMCxwYXJhbXM6bnVsbCxleGVjdXRlOmZ1bmN0aW9uKGEpe3ZhciBiO3RoaXMuYWN0aXZlJiZ0aGlzLl9saXN0ZW5lciYmKGE9dGhpcy5wYXJhbXM/dGhpcy5wYXJhbXMuY29uY2F0KGEpOlxuYSxiPXRoaXMuX2xpc3RlbmVyLmFwcGx5KHRoaXMuY29udGV4dCxhKSx0aGlzLl9pc09uY2UmJnRoaXMuZGV0YWNoKCkpO3JldHVybiBifSxkZXRhY2g6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5pc0JvdW5kKCk/dGhpcy5fc2lnbmFsLnJlbW92ZSh0aGlzLl9saXN0ZW5lcix0aGlzLmNvbnRleHQpOm51bGx9LGlzQm91bmQ6ZnVuY3Rpb24oKXtyZXR1cm4hIXRoaXMuX3NpZ25hbCYmISF0aGlzLl9saXN0ZW5lcn0saXNPbmNlOmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuX2lzT25jZX0sZ2V0TGlzdGVuZXI6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5fbGlzdGVuZXJ9LGdldFNpZ25hbDpmdW5jdGlvbigpe3JldHVybiB0aGlzLl9zaWduYWx9LF9kZXN0cm95OmZ1bmN0aW9uKCl7ZGVsZXRlIHRoaXMuX3NpZ25hbDtkZWxldGUgdGhpcy5fbGlzdGVuZXI7ZGVsZXRlIHRoaXMuY29udGV4dH0sdG9TdHJpbmc6ZnVuY3Rpb24oKXtyZXR1cm5cIltTaWduYWxCaW5kaW5nIGlzT25jZTpcIit0aGlzLl9pc09uY2UrXG5cIiwgaXNCb3VuZDpcIit0aGlzLmlzQm91bmQoKStcIiwgYWN0aXZlOlwiK3RoaXMuYWN0aXZlK1wiXVwifX07ZS5wcm90b3R5cGU9e1ZFUlNJT046XCIxLjAuMFwiLG1lbW9yaXplOiExLF9zaG91bGRQcm9wYWdhdGU6ITAsYWN0aXZlOiEwLF9yZWdpc3Rlckxpc3RlbmVyOmZ1bmN0aW9uKGEsYixjLGQpe3ZhciBlPXRoaXMuX2luZGV4T2ZMaXN0ZW5lcihhLGMpO2lmKGUhPT0tMSl7aWYoYT10aGlzLl9iaW5kaW5nc1tlXSxhLmlzT25jZSgpIT09Yil0aHJvdyBFcnJvcihcIllvdSBjYW5ub3QgYWRkXCIrKGI/XCJcIjpcIk9uY2VcIikrXCIoKSB0aGVuIGFkZFwiKyghYj9cIlwiOlwiT25jZVwiKStcIigpIHRoZSBzYW1lIGxpc3RlbmVyIHdpdGhvdXQgcmVtb3ZpbmcgdGhlIHJlbGF0aW9uc2hpcCBmaXJzdC5cIik7fWVsc2UgYT1uZXcgaCh0aGlzLGEsYixjLGQpLHRoaXMuX2FkZEJpbmRpbmcoYSk7dGhpcy5tZW1vcml6ZSYmdGhpcy5fcHJldlBhcmFtcyYmYS5leGVjdXRlKHRoaXMuX3ByZXZQYXJhbXMpO3JldHVybiBhfSxcbl9hZGRCaW5kaW5nOmZ1bmN0aW9uKGEpe3ZhciBiPXRoaXMuX2JpbmRpbmdzLmxlbmd0aDtkby0tYjt3aGlsZSh0aGlzLl9iaW5kaW5nc1tiXSYmYS5fcHJpb3JpdHk8PXRoaXMuX2JpbmRpbmdzW2JdLl9wcmlvcml0eSk7dGhpcy5fYmluZGluZ3Muc3BsaWNlKGIrMSwwLGEpfSxfaW5kZXhPZkxpc3RlbmVyOmZ1bmN0aW9uKGEsYil7Zm9yKHZhciBjPXRoaXMuX2JpbmRpbmdzLmxlbmd0aCxkO2MtLTspaWYoZD10aGlzLl9iaW5kaW5nc1tjXSxkLl9saXN0ZW5lcj09PWEmJmQuY29udGV4dD09PWIpcmV0dXJuIGM7cmV0dXJuLTF9LGhhczpmdW5jdGlvbihhLGIpe3JldHVybiB0aGlzLl9pbmRleE9mTGlzdGVuZXIoYSxiKSE9PS0xfSxhZGQ6ZnVuY3Rpb24oYSxiLGMpe2coYSxcImFkZFwiKTtyZXR1cm4gdGhpcy5fcmVnaXN0ZXJMaXN0ZW5lcihhLCExLGIsYyl9LGFkZE9uY2U6ZnVuY3Rpb24oYSxiLGMpe2coYSxcImFkZE9uY2VcIik7cmV0dXJuIHRoaXMuX3JlZ2lzdGVyTGlzdGVuZXIoYSxcbiEwLGIsYyl9LHJlbW92ZTpmdW5jdGlvbihhLGIpe2coYSxcInJlbW92ZVwiKTt2YXIgYz10aGlzLl9pbmRleE9mTGlzdGVuZXIoYSxiKTtjIT09LTEmJih0aGlzLl9iaW5kaW5nc1tjXS5fZGVzdHJveSgpLHRoaXMuX2JpbmRpbmdzLnNwbGljZShjLDEpKTtyZXR1cm4gYX0scmVtb3ZlQWxsOmZ1bmN0aW9uKCl7Zm9yKHZhciBhPXRoaXMuX2JpbmRpbmdzLmxlbmd0aDthLS07KXRoaXMuX2JpbmRpbmdzW2FdLl9kZXN0cm95KCk7dGhpcy5fYmluZGluZ3MubGVuZ3RoPTB9LGdldE51bUxpc3RlbmVyczpmdW5jdGlvbigpe3JldHVybiB0aGlzLl9iaW5kaW5ncy5sZW5ndGh9LGhhbHQ6ZnVuY3Rpb24oKXt0aGlzLl9zaG91bGRQcm9wYWdhdGU9ITF9LGRpc3BhdGNoOmZ1bmN0aW9uKGEpe2lmKHRoaXMuYWN0aXZlKXt2YXIgYj1BcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLGM9dGhpcy5fYmluZGluZ3MubGVuZ3RoLGQ7aWYodGhpcy5tZW1vcml6ZSl0aGlzLl9wcmV2UGFyYW1zPVxuYjtpZihjKXtkPXRoaXMuX2JpbmRpbmdzLnNsaWNlKCk7dGhpcy5fc2hvdWxkUHJvcGFnYXRlPSEwO2RvIGMtLTt3aGlsZShkW2NdJiZ0aGlzLl9zaG91bGRQcm9wYWdhdGUmJmRbY10uZXhlY3V0ZShiKSE9PSExKX19fSxmb3JnZXQ6ZnVuY3Rpb24oKXt0aGlzLl9wcmV2UGFyYW1zPW51bGx9LGRpc3Bvc2U6ZnVuY3Rpb24oKXt0aGlzLnJlbW92ZUFsbCgpO2RlbGV0ZSB0aGlzLl9iaW5kaW5ncztkZWxldGUgdGhpcy5fcHJldlBhcmFtc30sdG9TdHJpbmc6ZnVuY3Rpb24oKXtyZXR1cm5cIltTaWduYWwgYWN0aXZlOlwiK3RoaXMuYWN0aXZlK1wiIG51bUxpc3RlbmVyczpcIit0aGlzLmdldE51bUxpc3RlbmVycygpK1wiXVwifX07dmFyIGY9ZTtmLlNpZ25hbD1lO3R5cGVvZiBkZWZpbmU9PT1cImZ1bmN0aW9uXCImJmRlZmluZS5hbWQ/ZGVmaW5lKGZ1bmN0aW9uKCl7cmV0dXJuIGZ9KTp0eXBlb2YgbW9kdWxlIT09XCJ1bmRlZmluZWRcIiYmbW9kdWxlLmV4cG9ydHM/bW9kdWxlLmV4cG9ydHM9ZjppLnNpZ25hbHM9XG5mfSkodGhpcyk7IixudWxsXX0=
