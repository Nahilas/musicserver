jade = require("./../vendor/jaderuntime.js");function template(locals) {
var buf = [];
var jade_mixins = {};

buf.push("<div class=\"artist-buttons\"><a href=\"#\" class=\"artist-button artist-bio\"><span class=\"glyphicon glyphicon-user\"></span><span> Biography</span></a><a href=\"#\" class=\"artist-button artist-play-all\"><span class=\"glyphicon glyphicon-play\"></span><span> Play all</span></a></div>");;return buf.join("");
}module.exports = template;