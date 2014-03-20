jade = require("./../vendor/jaderuntime.js");function template(locals) {
var buf = [];
var jade_mixins = {};
var locals_ = (locals || {}),title = locals_.title;
buf.push("<li data-action=\"navigate\" class=\"generic\"><span>" + (jade.escape(null == (jade.interp = title) ? "" : jade.interp)) + "</span><div class=\"btn-group pull-right\"><button type=\"button\" class=\"btn btn-default play\"><span class=\"glyphicon glyphicon-play\"></span></button><button type=\"buton\" class=\"btn btn-default add\"><span class=\"glyphicon glyphicon-log-in\"></span></button></div></li>");;return buf.join("");
}module.exports = template;