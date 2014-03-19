var $jPlayer, 
	isPlaying = false, 
	currentItem = null,
	signals = require('./vendor/signals.min.js'),
	audioplayer = {
		played: new signals.Signal(),
		paused: new signals.Signal(),
		resumed: new signals.Signal(),
		updated: new signals.Signal(),
		ended: new signals.Signal(),
		play: play,
		pause: pause,
		isPlaying: function() { return isPlaying; }
	};

$(function() {
	$jPlayer = $("#jPlayer");
	
	$jPlayer.jPlayer({ 
		supplied: 'mp3',
		timeupdate: updated,
		ended: function() {
			playing = false;
			audioplayer.ended.dispatch();
		}
	});
});

function updated(e) {
	var duration = e.jPlayer.status.duration === 0 ? currentItem.duration : e.jPlayer.status.duration;
	var current = e.jPlayer.status.currentTime;
	var percent = (current / duration) * 100;

	audioplayer.updated.dispatch(duration, current, percent);
}

function play(item)
{
	if(item) {
		isPlaying = true;
		currentItem = item;
		$jPlayer.jPlayer("setMedia", {
			mp3: item.stream
		});

		$jPlayer.jPlayer("play");
		audioplayer.played.dispatch(item);
	}
	else if(currentItem)
	{
		isPlaying = true;
		audioplayer.resumed.dispatch(item);
		$jPlayer.jPlayer("play");
	}
}

function pause()
{
	isPlaying = false;
	$jPlayer.jPlayer("pause");
	audioplayer.paused.dispatch();
}


module.exports = audioplayer;