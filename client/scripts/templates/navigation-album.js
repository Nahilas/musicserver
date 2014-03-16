jade = require("./../vendor/jaderuntime.js");function template(locals) {
var buf = [];
var jade_mixins = {};
var locals_ = (locals || {}),cover = locals_.cover,name = locals_.name,items = locals_.items;
buf.push("<li class=\"album\"><div class=\"row\"><div class=\"col-xs-4 cover\"><img" + (jade.attr("src", (cover || '/images/no-cover.png'), true, false)) + "/></div><div class=\"col-xs-8 info\"><h3>" + (jade.escape(null == (jade.interp = name) ? "" : jade.interp)) + "</h3><h5>2007</h5><h5>" + (jade.escape(null == (jade.interp = (items.length + " songs")) ? "" : jade.interp)) + "</h5><div class=\"btn-group\"><button class=\"btn btn-default play\"><span class=\"glyphicon glyphicon-play\"></span></button><button class=\"btn btn-default add\"><span class=\"glyphicon glyphicon-log-in\"></span></button></div></div></div></li>");;return buf.join("");
}module.exports = template;