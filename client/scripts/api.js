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
		data: JSON.stringify({ path: path, expand: path.length > 0 }),
		processData: false,
		dataType: 'json'
	});
}

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

var listsongs = function(path)
{
	if(!path)
	{
		return;		
	}

	return $.ajax({
		method: 'POST',
		url: '/api/listsongs',
		cache: false,
		contentType: 'application/json',
		data: JSON.stringify({ path: path }),
		processData: false,
		dataType: 'json'
	});
}

var song = function(path)
{
	if(!path)
	{
		return;
	}

	return $.ajax({
		method: 'POST',
		url: '/api/song',
		cache: false,
		contentType: 'application/json',
		data: JSON.stringify({ path: path }),
		processData: false,
		dataType: 'json'
	});
}

module.exports = {
	list: list,
	listsongs: listsongs,
	song: song,
	db: db
};
