var util = require('./util.js');

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

	$jPlayer.jPlayer({ 
		supplied: 'mp3',
		timeupdate: onUpdate,
		ended: function() {
			playing = false;
			playlist.next();
		}
	});
});


function playItem(item) {
	currentItem = item;
	$jPlayer.jPlayer("setMedia", {
		mp3: item.stream
	});

	$song.html(item.song);
	$artist.html(item.artist);
	$album.html(item.album);

	 $jPlayer.jPlayer("play");
};



function onUpdate(e)
{
	var duration = e.jPlayer.status.duration === 0 ? currentItem.duration : e.jPlayer.status.duration;
	var current = e.jPlayer.status.currentTime;
	var percent = (current / duration) * 100;

	$progress.css("width", percent + "%");
	
	$position.html(util.secondsToTime(current));
	$duration.html(util.secondsToTime(duration));
}


module.exports = {
	play: playItem,
	pause: function() { $jPlayer.jPlayer("pause"); alert("pause"); },
	resume: function() { $jPlayer.jPlayer("play");  },
	isPlaying: function() { return playing; }
};