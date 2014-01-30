var player = require('./player.js');
var api = require('./api.js');
var util = require('./util.js');
var list = require('./list.js');

var currentSongs = [];
var currentIndex = null;
var dropIndex = null;
var $playlist, currentDrag, $pause, $prev, $next;

$(function() {
	$playlist = $("#playlist table tbody");

	$playlist.on('dblclick', '.item', function(e) {
		currentIndex = $(this).data('index');
		play();
	});

	$pause = $("#pause");
	$next = $("#next");
	$prev = $("#prev");

	//hookupDragDrop();
	hookupEvents();
});


function hookupEvents() {

	$pause.click(function() {
		if(!player.isPlaying())
		{
			play();
			return;
		}
		
		if($pause.is('.playing'))
		{
			player.pause();
			$pause.removeClass('playing');
		}
		else 
		{
			player.resume();
			$pause.addClass('playing');
		}
	});

	$next.click(next);
	$prev.click(prev);
}



/*function hookupDragDrop() {
	document.getElementById("playlist").ondrop = function(e) {
		e.preventDefault();
		list.add(JSON.parse(e.dataTransfer.getData("item")), dropIndex);
		dropIndex = null;
	}

	document.getElementById("playlist").ondragover = function(e) {
		e.preventDefault();
	}
}*/

function addSongs(path, before, cb)
{
	api.listsongs(path).done(function(songs) {
		if(!before)
			currentSongs = currentSongs.concat(songs);
		else {

			var after = currentSongs.splice(before, currentSongs.length);
			currentSongs = currentSongs.concat(songs, after);
		}

		render();
		if(cb)
		{
			cb();
		}
	});
}

function playSongs(path)
{
	currentSongs = [];
	addSongs(path, null, function() { currentIndex = 0; play() });
}

function play() {
	if(currentSongs.length === 0)
		return;

	if(!currentIndex || currentIndex >= currentSongs.length)
		currentIndex = 0;

	$playlist.find('.item').removeClass('success');
	$playlist.find('.item[data-index=' + currentIndex + ']').addClass('success');

	$pause.addClass('playing');

	player.play(currentSongs[currentIndex]);
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
		var row = '<tr ondragenter="playlist.itemDragEnter(event)" class="item" data-index="' + i + '""><td>' + x.song + '</td><td>' + x.album + '</td><td>' + x.artist + '</td><td>' + util.secondsToTime(x.duration) + '</td></tr>';  

		$(row).data('item', x);

		$playlist.append(row);
	});
}

function itemDragEnter(e) {
	$("#playlist .item").removeClass("warning");
	
	$(e.srcElement).parent().addClass("warning");
	dropIndex = $(e.srcElement).parent().data('index');
}

module.exports = {
	addSongs: addSongs,
	play: play,
	prev: prev,
	next: next,
	playSongs: playSongs,
	itemDragEnter: itemDragEnter
}