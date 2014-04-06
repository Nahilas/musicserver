jade = require("./../vendor/jaderuntime.js");function template(locals) {
var buf = [];
var jade_mixins = {};
var locals_ = (locals || {}),artist = locals_.artist,name = locals_.name,cover = locals_.cover,year = locals_.year,items = locals_.items;
buf.push("<li" + (jade.attr("data-artist", artist, true, false)) + (jade.attr("data-name", name, true, false)) + " class=\"album\"><img" + (jade.attr("src", (cover || '/images/no-cover.png'), true, false)) + "/><h3><span>" + (jade.escape(null == (jade.interp = name) ? "" : jade.interp)) + "</span><span>&nbsp;</span><small>" + (jade.escape(null == (jade.interp = year) ? "" : jade.interp)) + "</small></h3><div class=\"controls\"><a href=\"#\" class=\"play\"><span class=\"glyphicon glyphicon-play\"></span><span> Play</span></a><a href=\"#\" class=\"add\"><span class=\"glyphicon glyphicon-plus\"></span><span> Add</span></a></div><ul class=\"songs\">");
// iterate items
;(function(){
  var $$obj = items;
  if ('number' == typeof $$obj.length) {

    for (var i = 0, $$l = $$obj.length; i < $$l; i++) {
      var song = $$obj[i];

buf.push("<li><span>" + (jade.escape(null == (jade.interp = ((i + 1) + '. ')) ? "" : jade.interp)) + "</span><span>" + (jade.escape(null == (jade.interp = (song.song || song.name)) ? "" : jade.interp)) + "</span></li>");
    }

  } else {
    var $$l = 0;
    for (var i in $$obj) {
      $$l++;      var song = $$obj[i];

buf.push("<li><span>" + (jade.escape(null == (jade.interp = ((i + 1) + '. ')) ? "" : jade.interp)) + "</span><span>" + (jade.escape(null == (jade.interp = (song.song || song.name)) ? "" : jade.interp)) + "</span></li>");
    }

  }
}).call(this);

buf.push("</ul></li>");;return buf.join("");
}module.exports = template;