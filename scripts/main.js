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

	var $jPlayer;
	$(function() {
		$jPlayer = $("#player .jplayer");

		$jPlayer.jPlayer({ supplied: 'mp3' });
	});

	function play(path) {
		$jPlayer.jPlayer("setMedia", {
			mp3: 'api/stream?path=' + path
		});

		$jPlayer.jPlayer("play");
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
			if($(this).is('.folder')) {
				navigate($(this).text());
			}
			else
			{
				var str = '';

				$.each(currentPath, function(i,x) {
					str += x + '/'
				});
				str += $(this).text();
				

				player.play(str);
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
			var str = '';

			$.each(items, function(i,x) {
				str += '<li class=' + (x.isFile ? 'file' : 'folder') + '>' + x.name + '</li>';
			});

			$list.html(str);
		});
	}


})();


