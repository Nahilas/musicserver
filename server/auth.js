var config = require('./../config.js'),
	uuid = require('node-uuid'),
	_ = require('lodash'),
	sessions = {},
	users = config.users,
	sessionTimeout = 20 * 60 * 1000; //Millisecs


function authenticateUser(username, password)
{
	var foundUser = null;
	_.each(users, function(x) {
		if(x.username === username && x.password === password)
		{
			foundUser = x;
			return;
		}
	});

	if(!foundUser)
		return null;

	return createSession(foundUser);
}

function createSession(user) {
	var sessionId = uuid.v1();

	sessions[sessionId] = { refreshed: new Date(), user: user };
	return sessionId;
}

function checkSession(sessionId)
{
	if(!sessions[sessionId])
		return false;

	var diff = (new Date() - sessions[sessionId].refreshed);

	if(diff > sessionTimeout)
	{
		delete sessions[sessionId];
		return false;
	}

	sessions[sessionId].refreshed = new Date();
	return true;
}

module.exports = {
	authenticateUser: authenticateUser,
	checkSession: checkSession
}