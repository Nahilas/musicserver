jade = require("./../vendor/jaderuntime.js");function template(locals) {
var buf = [];
var jade_mixins = {};
var locals_ = (locals || {}),stream = locals_.stream,song = locals_.song,album = locals_.album,artist = locals_.artist,duration = locals_.duration;
buf.push("<tr" + (jade.attr("id", stream, true, false)) + " class=\"item\"><td>" + (jade.escape(null == (jade.interp = song) ? "" : jade.interp)) + "</td><td>" + (jade.escape(null == (jade.interp = album) ? "" : jade.interp)) + "</td><td>" + (jade.escape(null == (jade.interp = artist) ? "" : jade.interp)) + "</td><td>" + (jade.escape(null == (jade.interp = duration) ? "" : jade.interp)) + "</td></tr>");;return buf.join("");
}module.exports = template;