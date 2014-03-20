var util = require('./util.js'),
	audioplayer = require('./audioplayer.js'),
	playlist = require('./playlist.js'),
	library = require('./library.js'),
	$progress, 
	$duration, 
	$position, 
	$song, 
	$artist, 
	$album, 
	$pause, 
	$next, 
	$prev,
	$cover;

$(function() {
	$progress = $("#progress .indicator");
	$duration = $("#duration");
	$position = $("#position");
	$song = $("#song");
	$artist = $("#artist");
	$album = $("#album");
	$pause = $("#pause");
	$next = $("#next");
	$prev = $("#prev");
	$cover = $("#cover");

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
	$cover.attr('src', library.getCover(item.artist, item.album, 'large'));

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