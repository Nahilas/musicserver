var api = (function() {
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
			data: JSON.stringify({ path: path }),
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

	return {
		list: list,
		listsongs: listsongs
	};
})();

var util = (function() {

	function secondsToTime(sec)
	{
		return moment().startOf('day').add('s', sec).format('mm:ss')
	}

	return {
		secondsToTime: secondsToTime
	};

})();

var player = (function() {

	var $jPlayer, $progress, $duration, $position, $song, $artist, $album, $pause, $next, $prev;
	var playing = false, currentItem = null;
	$(function() {
		$jPlayer = $("#player .jplayer");
		$progress = $(".progress-bar");
		$duration = $("#duration");
		$position = $("#position");
		$song = $("#song");
		$artist = $("#artist");
		$album = $("#album");
		$pause = $("#pause");
		$next = $("#next");
		$prev = $("#prev");
 
		$jPlayer.jPlayer({ 
			supplied: 'mp3',
			timeupdate: onUpdate,
			ended: function() {
				playing = false;
				playlist.next();
			}
		});

		hookupEvents();
	});

	function hookupEvents() {
		$pause.click(function() {
			if(!playing)
			{
				playlist.play();
				return;
			}
			
			if($(this).is('.playing'))
				pause();
			else
				play();
		});

		$next.click(playlist.next);
		$prev.click(playlist.prev);
	}

	function onUpdate(e)
	{
		var duration = e.jPlayer.status.duration === 0 ? currentItem.duration : e.jPlayer.status.duration;
		var current = e.jPlayer.status.currentTime;
		var percent = (current / duration) * 100;

		$progress.css("width", percent + "%");
		
		$position.html(util.secondsToTime(current));
		$duration.html(util.secondsToTime(duration));
	}

	function playItem(item) {
		currentItem = item;
		$jPlayer.jPlayer("setMedia", {
			mp3: item.stream
		});

		play();

		$song.html(item.song);
		$artist.html(item.artist);
		$album.html(item.album);
	};

	function play() {
		playing = true;
		$jPlayer.jPlayer("play");
		$pause.addClass('playing');
	}

	function pause() {
		$jPlayer.jPlayer("pause");
		$pause.removeClass('playing');
	}

	return {
		play: playItem
	};
})();

var playlist = (function() {

	var currentSongs = [];
	var currentIndex = null;
	var dropIndex = null;
	var $playlist, currentDrag;

	$(function() {
		$playlist = $("#playlist table tbody");

		$playlist.on('dblclick', '.item', function() {
			currentIndex = $(this).data('index');
			play();
		});

		hookupDragDrop();
	});

	function hookupDragDrop() {
		document.getElementById("playlist").ondrop = function(e) {
			e.preventDefault();
			list.add(JSON.parse(e.dataTransfer.getData("item")), dropIndex);
			dropIndex = null;
		}

		document.getElementById("playlist").ondragover = function(e) {
			e.preventDefault();
		}
	}

	function addSongs(path, before)
	{
		api.listsongs(path).done(function(songs) {
			if(!before)
				currentSongs = currentSongs.concat(songs);
			else {

				var after = currentSongs.splice(before, currentSongs.length);
				currentSongs = currentSongs.concat(songs, after);
			}

			render();
		});
	}

	function play() {
		if(currentSongs.length === 0)
			return;

		if(!currentIndex || currentIndex >= currentSongs.length)
			currentIndex = 0;

		$playlist.find('.item').removeClass('success');
		$playlist.find('.item[data-index=' + currentIndex + ']').addClass('success');

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

	return {
		addSongs: addSongs,
		play: play,
		prev: prev,
		next: next,
		itemDragEnter: itemDragEnter
	}
})();

var list = (function() {
	var $list, currentPath = [];
	$(function() {
		$list = $("#list");

		$list.on('click', 'li', function() {
			var item = $(this).data('item');

			if($(this).is('.folder')) {
				navigate(item.name);
			}
			else
			{
				player.play(item);
			}
		});

		$list.on('click', '.add', function(e) {
			e.stopPropagation();
			add($(this).parent().data('item'));			
		});

		$("#home").click(function() {
			currentPath = [];
			populateList();
		});

		$("#up").click(up);

		populateList();
	});

	function add(item, before)
	{
		var path = currentPath.slice(0);
		path.push(item.name)
			
		playlist.addSongs(path, before);
	}

	function itemDragStart(e)
	{
		e.dataTransfer.setData("item", JSON.stringify($(e.srcElement).data('item')));		
	}


	function up() {
		if(currentPath.length === 0)
			return;

		currentPath.pop();
		populateList(currentPath);
	}

	function navigate(name)
	{
		currentPath.push(name);
		populateList(currentPath);
	}

	function populateList(path)
	{
		api.list(path).done(function(items) {
			$list.html('');
			$.each(items, function(i,x) {
				
				var li = $('<li ondragstart="list.itemDragStart(event)" draggable="true" class=' + (x.isFile ? 'file' : 'folder') + '>' + (x.isFile ? x.song : x.name) + '<button type="button" class="btn btn-link add">+</button></li>');
				li.data('item', x);
				$list.append(li);

			});
		});
	}

	return {
		itemDragStart: itemDragStart,
		add: add
	}
})();


