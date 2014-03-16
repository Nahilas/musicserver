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
		currentIndex = $(this).data('index');
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
});

function deleteSelected() 
{
	for(var i = 0; i < currentSongs.length; i++)
	{
		if(_.find(selectedRows, function(x) { return currentSongs[i].stream === $(x).attr('id'); })) {
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

	audioplayer.play(currentSongs[currentIndex]);
	
	/*var $items = $playlist.find('.item');

	$items.removeClass('success');
	$playlist.find('.item[data-index="' + currentIndex + '"]').addClass('success');*/
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