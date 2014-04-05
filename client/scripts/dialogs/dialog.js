module.exports = function(content) {
	var $main, 
		$dialog,
		$element;

	function initialize() 
	{
		$main = $('#main');
	}

	function show() 
	{
		initialize();

		$dialog = $('<div class="dialog"><div class="content"></div></div>');
		$dialog.insertAfter($main);

		$element = $dialog.find(".content");
		$element.html(content);

		return animateShow();
	}

	function animateShow() {
		var deferred = $.Deferred();
		
		var anim = TweenLite.fromTo($element, 
			0.5, 
			{ scaleX: 0, scaleY: 0 }, 
			{ scaleX: 1, scaleY: 1, ease: Power2.easeInOut, onComplete: function() { deferred.resolve(); } });

		return deferred.promise();
	}

	function animateHide() {
		var deferred = $.Deferred();
		
		TweenLite.fromTo($element, 
			0.3, 
			{ scaleX: 1, scaleY: 1 }, 
			{ scaleX: 0, scaleY: 0, ease: Power2.easeInOut, onComplete: function() { deferred.resolve(); } });

		TweenLite.to($dialog, 0.3, { opacity: 0 });

		return deferred.promise();
	}

	function hide()
	{
		var deferred = $.Deferred();

		animateHide().then(function() {
			$dialog.remove();	
			deferred.resolve();
		});
		
		return deferred.promise();
	}

	function shake() {
		var tl = new TimelineLite();

		tl.to($element, 0.05, {left: "-=25"});
		tl.to($element, 0.05, {left: "+=50"});
		tl.to($element, 0.05, {left: "-=50"});
		tl.to($element, 0.05, {left: "+=50"});
		tl.to($element, 0.05, {left: "-=50"});
		tl.to($element, 0.05, {left: "+=25"});

		tl.resume();
	}

	return {
		show: show,
		hide: hide,
		shake: shake,
		element: function() { return $element; }
	}
};


