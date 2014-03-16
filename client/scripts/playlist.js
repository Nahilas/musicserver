var audioplayer = require('./audioplayer.js'),
	api = require('./api.js'),
	util = require('./util.js'),
	currentSongs = [],
	currentIndex = null,
	dropIndex = null,
	$playlist, 
	currentDrag;

$(function() {
	$playlist = $("#playlist table tbody");

	$playlist.on('dblclick', '.item', function(e) {
		currentIndex = $(this).data('index');
		play();
	});

	audioplayer.played.add(onPlayed);
});

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

function onPlayed(item)
{
	/*var $items = $playlist.find('.item');
	$items.removeClass('success');
	
	$items.each(function(i, x) {
		console.log($(x).data('item'));
		if($(x).parents('tr').data('item') == item)
		{
			$(x).addClass('success');
		}
	});*/
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

	audioplayer.play(currentSongs[currentIndex]);
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

/*function itemDragEnter(e) {
	$("#playlist .item").removeClass("warning");
	
	$(e.srcElement).parent().addClass("warning");
	dropIndex = $(e.srcElement).parent().data('index');
}*/

module.exports = {
	addSongs: addSongs,
	prev: prev,
	next: next,
	playSongs: playSongs
	//itemDragEnter: itemDragEnter
}