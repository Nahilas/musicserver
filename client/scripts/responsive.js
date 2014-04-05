var $libraryButton, $library, $playlist, $icon, $backButton;

function initialize() {
	var deferred = $.Deferred();

	$(function() {

		$libraryButton = $('#status .responsive-library-button');
		$library = $("#list-container");
		$playlist = $("#playlist-container");
		$icon = $("#status img");

		hookupEvents();

		deferred.resolve();
	});

	return deferred.promise();
}

function hookupEvents() {
	$libraryButton.click(function() {

		if($(this).is('.active'))
			hideLibrary();
		else
			showLibrary();
	});
}


function hideLibrary() {
	$libraryButton.removeClass('active');

	$library.removeClass('visible');
	$playlist.removeClass('hide');
}

function showLibrary() {
	$libraryButton.addClass('active');

	$library.addClass('visible');
	$playlist.addClass('hide');
}

module.exports = {
	initialize: initialize
}