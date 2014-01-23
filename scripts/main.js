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

	return {
		list: list
	};
})();

var player = (function() {

	var $jPlayer, $progress, $duration, $position, $song, $artist, $album;
	$(function() {
		$jPlayer = $("#player .jplayer");
		$progress = $(".progress-bar");
		$duration = $("#duration");
		$position = $("#position");
		$song = $("#song");
		$artist = $("#artist");
		$album = $("#album");


		$jPlayer.jPlayer({ 
			supplied: 'mp3',
			timeupdate: onUpdate
		});
	});

	function secondsToTime(sec)
	{
		return moment().startOf('day').add('s', sec).format('mm:ss')
	}

	function onUpdate(e)
	{
		$progress.css("width", e.jPlayer.status.currentPercentAbsolute + "%");
		
		$position.html(secondsToTime(e.jPlayer.status.currentTime));
		$duration.html(secondsToTime(e.jPlayer.status.duration));
	}

	function play(path, item) {
		$jPlayer.jPlayer("setMedia", {
			mp3: 'api/stream?path=' + encodeURIComponent(path)
		});

		$jPlayer.jPlayer("play");

		$song.html(item.song);
		$artist.html(item.artist);
		$album.html(item.album);
	};

	return {
		play: play
	};
})();

var list = (function() {
	var $list, currentPath = [];
	$(function() {
		$list = $("#list");

		$list.on('click', 'li', function() {
			var item = $(this).data('item');
			console.log(item);


			if($(this).is('.folder')) {
				navigate(item.name);
			}
			else
			{
				var str = '';

				$.each(currentPath, function(i,x) {
					str += x + '/'
				});
				str += item.name;
				
				player.play(str, item);
			}
		});

		$("#home").click(function() {
			currentPath = [];
			populateList();
		});

		$("#up").click(up);

		populateList();
	});

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
				
				var li = $('<li class=' + (x.isFile ? 'file' : 'folder') + '>' + x.name + '</li>');
				li.data('item', x);
				$list.append(li);

			});
		});
	}


})();


