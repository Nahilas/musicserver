var moment = require('./vendor/moment.js');

function secondsToTime(sec)
{
	return moment().startOf('day').add('s', sec).format('mm:ss')
}

module.exports = {
	secondsToTime: secondsToTime
};
