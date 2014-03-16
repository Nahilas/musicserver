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