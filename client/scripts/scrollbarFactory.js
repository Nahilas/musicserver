_ = require('./vendor/lodash.min.js'),

module.exports = function($element, $scrollbar)
{
	var scrollbarTimeoutTime = 500, 
	scrollbarTimeout;

	$element.scroll(function() {
		updateScrollbar();
	});

	var updateScrollbar = _.throttle(function() {
		var listHeight = parseFloat($element.height());
		var listScroll = parseFloat($element.scrollTop());
		var listContentHeight = parseFloat($element.get(0).scrollHeight);
		
		var height = (listHeight / listContentHeight) * listHeight;
		var top = (listScroll / listContentHeight) * listHeight;

		$scrollbar.css('height', height + 'px');
		$scrollbar.css('top', top + 'px');
		$scrollbar.removeClass('animated-hide');
		hideScrollbar();

	}, 10);

	var hideScrollbar = function() {
		clearTimeout(scrollbarTimeout);
		scrollbarTimeout = setTimeout(function() { $scrollbar.addClass('animated-hide'); }, scrollbarTimeoutTime);
	};

	return  {
		update: updateScrollbar
	};
};