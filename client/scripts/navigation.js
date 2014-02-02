var api = require('./api.js');
var playlist = require('./playlist.js');
var _ = require('./vendor/lodash.min.js');

var $list, $up, currentPath = [];
$(function() {
	$list = $("#list");
	$up = $("#up");
	$breadcrumb = $(".breadcrumb-folder");

	$list.on('click', 'li', function() {
		var item = $(this).data('item');

		if($(this).data('action') === 'navigate')
			navigate(item.name);
	});

	$list.on('click', '.add', function(e) {
		e.stopPropagation();
		add($(this).parents('li').data('item'));			
	});

	$list.on('click', '.play', function(e) {
		e.stopPropagation();
		play($(this).parents('li').data('item'));
	});

	$("#home").click(function() {
		currentPath = [];
		populateList();
	});

	$up.click(up);
});

function add(item, before)
{
	var path = currentPath.slice(0);
	path.push(item.name)
		
	playlist.addSongs(path, before);
}

function play(item)
{
	var path = currentPath.slice(0);
	path.push(item.name)
		
	playlist.playSongs(path);
}

function itemDragStart(e)
{
	e.dataTransfer.setData("item", JSON.stringify($(e.srcElement).data('item')));		
}


function up() {
	if(currentPath.length === 0)
		return;

	currentPath.pop();

	if(currentPath.length === 0)
		$up.addClass('hide');

	populateList(currentPath);
}

function navigate(name)
{
	$up.removeClass('hide');
	currentPath.push(name);

	populateList(currentPath);
}

function setBreadcrumb() {
	var str = "";
	$.each(currentPath, function(i,x) { str += x + "/"; });
	$breadcrumb.html(str.substring(0, str.length - 1));
}


function renderDefault(item)
{
	$.each(item.items, function(i,x) {
		var li = $('<li data-action="navigate" ondragstart="list.itemDragStart(event)" draggable="true" class="generic">' + (x.isFile ? x.song : x.name) + '<div class="btn-group pull-right"><button type="button" class="btn btn-default play"><span class="glyphicon glyphicon-play"></span></button><button type="button" class="btn btn-default add"><span class="glyphicon glyphicon-log-in"></span></button></li></div>');
		li.data('item', x);
		$list.append(li);
	});
}

function renderArtist(item)
{
	var albumTemplate = _.template('<li class="album"><div class="row">' +
	'<div class="col-xs-4 cover"><img src="<%=cover%>" /></div>' +
	'<div class="col-xs-8 info"><h3><%=name%></h3><h5>2007</h5><h5><%=items.length%> songs</h5></div>' +
	'</div></li>');

	_.each(item.items, function(x) 
	{
		x.cover = _.find(x.images, function(y) { return y.size === 'large'; })['#text'];
		$list.append(albumTemplate(x))

		$.each(x.items, function(i,x) {
			var li = $('<li data-action="navigate" ondragstart="list.itemDragStart(event)" draggable="true" class="generic">' + (x.isFile ? x.song : x.name) + '<div class="btn-group pull-right"><button type="button" class="btn btn-default play"><span class="glyphicon glyphicon-play"></span></button><button type="button" class="btn btn-default add"><span class="glyphicon glyphicon-log-in"></span></button></li></div>');
			li.data('item', x);
			$list.append(li);
		});
	});
}


function populateList(path)
{
	api.list(path).done(function(item) {
		setBreadcrumb();
		$list.html('');

		if(item.parent && item.parent.summary)
		{
			renderArtist(item);
		}
		else
		{
			renderDefault(item);
		}
	});
}

function initialize() {
	populateList();
}

module.exports = {
	itemDragStart: itemDragStart,
	add: add,
	populate: populateList,
	initialize: initialize
}