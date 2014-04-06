jade = require("./../vendor/jaderuntime.js");function template(locals) {
var buf = [];
var jade_mixins = {};
var locals_ = (locals || {}),name = locals_.name;
buf.push("<li" + (jade.attr("data-name", name, true, false)) + " class=\"artist\"><span>" + (jade.escape(null == (jade.interp = name) ? "" : jade.interp)) + "</span><div class=\"btn-group pull-right\"><button class=\"btn btn-default play\"><span class=\"glyphicon glyphicon-play\"></span></button><button class=\"btn btn-default add\"><span class=\"glyphicon glyphicon-log-in\"></span></button></div></li>");;return buf.join("");
}module.exports = template;