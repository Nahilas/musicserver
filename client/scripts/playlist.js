var audioplayer = require('./audioplayer.js'),
	api = require('./api.js'),
	util = require('./util.js'),
	mousetrap = require('./vendor/mousetrap.min.js'),
	moment = require('./vendor/moment.js'),
	currentSongs = [],
	currentSong = null,
	currentIndex = null,
	dropIndex = null,
	$playlist, 
	$status,
	currentDrag,
	selectedRows = [],
	_ = require('./vendor/lodash.min.js'),
	templates = {
		item: require('./templates/playlist-item.js')
	};

$(function() {

	$playlist = $("#playlist table tbody");
	$status = $("#playlist-status span.status");

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

	$("#playlist-status a").click(function(e) {
		e.preventDefault();

		currentSongs = [];
		currentIndex = 0;
		currentSong = null;

		render();
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
	mousetrap.bind('ctrl+a', selectAll);

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

function selectAll(e) {
	e.preventDefault();

	select($playlist.find('.item'));
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

function animate() {
	var tl = new TimelineLite();

	tl.staggerTo($playlist.find('.item'), 0.1, { opacity: 1 }, 0.01);

	tl.resume();
}

function render() {
	$playlist.html('');
	var totalDuration = 0;

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
			totalDuration += x.duration;

			$playlist.append(row);
			row.data('item', x);
		});
	}
	else {
		$playlist.html('<td class="empty">Playlist is empty! Add items to start playing music.</td>');
	}

	$status.html(currentSongs.length + ' songs, ' + parseInt(totalDuration / 60, 10) + ' minutes');	

	animate();
}

module.exports = {
	addSongs: addSongs,
	prev: prev,
	next: next,
	playSongs: playSongs
}