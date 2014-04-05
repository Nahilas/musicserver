jade = require("./../vendor/jaderuntime.js");function template(locals) {
var buf = [];
var jade_mixins = {};
var locals_ = (locals || {}),stream = locals_.stream,playing = locals_.playing,song = locals_.song,artist = locals_.artist,album = locals_.album,duration = locals_.duration;
buf.push("<tr" + (jade.attr("data-stream", stream, true, false)) + " class=\"item\"><td><span" + (jade.cls(['glyphicon','glyphicon-volume-up','playing',(!playing ? 'hide' : '')], [null,null,null,true])) + "></span><span>" + (jade.escape(null == (jade.interp = song) ? "" : jade.interp)) + "</span><br/><span style=\"color: #777\"><small>" + (jade.escape(null == (jade.interp = (artist + ', ' + album)) ? "" : jade.interp)) + "</small></span></td><td style=\"width: 70px\" class=\"text-center\">" + (jade.escape(null == (jade.interp = duration) ? "" : jade.interp)) + "</td></tr>");;return buf.join("");
}module.exports = template;