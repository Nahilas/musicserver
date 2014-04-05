var db = function()
{
	return $.ajax({
		method: 'POST',
		url: '/api/db',
		cache: false,
		contentType: 'application/json',
		processData: false,
		dataType: 'json'
	});
}

var authenticate = function(username, password)
{
	return $.ajax({
		method: 'POST',
		url: '/api/authenticate',
		cache: false,
		contentType: 'application/json',
		data: JSON.stringify({ username: username, password: password }),
		processData: false,
		dataType: 'json'
	});
}


module.exports = {
	db: db,
	authenticate: authenticate
};
