var _ = require('./vendor/lodash.min.js'),

	templates = {
		letter: require('./templates/library-navigation-letter.js'),
		buttons: require('./templates/library-navigation-buttons.js')
	},

	elementLetters = [],
	$element,
	$navigation;



function deselectLetter(letter) 
{
	letter.removeClass('active');
	new TweenLite.to(letter, 0.2, { color: '#666', backgroundColor: '#ddd', ease: Power2.easeInOut });
}

function selectLetter(letter)
{
	letter.addClass('active');
	new TweenLite.to(letter, 0.2, { color: '#fff', backgroundColor: '#663366', ease: Power2.easeInOut });
}

function updateLetters() {

	var currScroll = $element.scrollTop() - 70;

	for(var i = 0, l = letters.length; i < l; i++) {
		if(letters[i].top > currScroll)
		{
			var index = i - 1;

			if(index < 0)
				index = 0;

			var alphabetLetter = $navigation.find('.letter[data-id="' + letters[index].id + '"]');
			var current = $navigation.find('.letter.active');

			if(current.data('id') !== alphabetLetter.data('id')) {
				deselectLetter(current);
				selectLetter(alphabetLetter);
			}
			break;
		}
	}
};

function findElementLetters() 
{
	letters = [];

	$element.find('.alphabet-letter').each(function(i,x) 
	{
		letters.push({
			id: $(x).attr('id'),
			top: $(x).position().top - $(x).height() - 30,
			positionY: $(x).position().top + 15
		});
	});

	return letters;
}

function renderLetters()
{
	$navigation.html('');

	var letterPercent = 100 / letters.length;
	_.each(letters, function(x) { 
		var l = templates.letter({ id: x.id, widthPercent: letterPercent + '%' });

		$navigation.append(l);
	});

}

function hookupLetterEvents() {
	$navigation.find('.letter').click(function() {
		var id = $(this).data('id');
		var l = _.find(letters, function(x) { return x.id === id; });

		if(l)
			$element.scrollTop(l.positionY);
	});
}

function showButtons(showBio, playAll)
{
	$navigation.html(templates.buttons());

	$navigation.find('.artist-bio').click(function(e) {
		e.preventDefault();
		
		showBio();

		return false;
	});

	$navigation.find('.artist-play-all').click(function(e) {
		e.preventDefault();
		
		playAll();

		return false;
	});
}

function initialize($list) {
	$element = $list; 

	$element.scroll(_.throttle(updateLetters, 100));
}

function showLetters()
{
	$navigation = $('#library-navigation');

	elementLetters = findElementLetters();
	renderLetters();

	hookupLetterEvents();

	updateLetters();
}

module.exports = {
	showButtons: showButtons,
	showLetters: showLetters,
	initialize: initialize
}