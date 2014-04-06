var moment = require('./vendor/moment.js');
var _ = require('./vendor/lodash.min.js');

function secondsToTime(sec)
{
	return moment().startOf('day').add('s', sec).format('mm:ss')
}

function sortNameIgnoreThe(item)
{
	item.items = _.sortBy(item.items, function(x) {
		var sortname = x.name;

		if(x.name.substring(0,4).toLowerCase() === 'the ')
			sortname = x.name.substring(4, x.name.length);

		return sortname;
	});

	return item;
}

module.exports = {
	secondsToTime: secondsToTime,
	sortNameIgnoreThe: sortNameIgnoreThe
};
