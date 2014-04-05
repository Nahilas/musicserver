var dialog = require('./dialog.js'),
	loginDialog,
	template = require('./../templates/dialog-login.js'),
	deferred,
	$form,
	$logo,
	$title,
	api = require('./../api.js');


function show() {
	deferred = $.Deferred();
	loginDialog = dialog(template({
		username: $.cookie('username'),
		password: $.cookie('password')
	}));

	loginDialog.show()
	initialize();
	
	return deferred.promise();
}


function submit() {
	var username = $(this).find('input[name="username"]').val();
	var password = $(this).find('input[name="password"]').val();

	if(username.length === 0 || password.length === 0) {
		wrongCredentials();
		return;
	}

	api.authenticate(username, password)
		.done(loggedIn)
		.fail(wrongCredentials);
}

function wrongCredentials() {
	loginDialog.shake();
}

function loggedIn()
{
	saveCredentials();
	loginDialog.hide().then(deferred.resolve);
}

function animateLogo() {
	TweenLite.to($logo, 1.5, {opacity: 1});
	TweenLite.from($logo, 1.5, {rotationY: '90deg'});

	TweenLite.from($title, 1.5, {rotationY: '90deg'});
	TweenLite.to($title, 1.5, {opacity: 1});
}

function saveCredentials()
{
	var rememberMe = $form.find('input[name="rememberMe"]').is(':checked');

	if(rememberMe)
	{
		$.cookie('username', $form.find('input[name="username"]').val(), { expires: 9999 });
		$.cookie('password', $form.find('input[name="password"]').val(), { expires: 9999 });	
	}
	else 
	{
		$.removeCookie('username');
		$.removeCookie('password');
	}
}

function initialize() {
	$form = loginDialog.element().find('form');
	$logo = loginDialog.element().find('img');
	$title = loginDialog.element().find('h2');

	if($.cookie('username'))
		$form.find('input[name="rememberMe"]').prop('checked', true);

	$form.submit(function(e) {
		e.preventDefault();

		submit.call(this);

		return false;
	});

	animateLogo();
}

module.exports = {
	show: show
};