jade = require("./../vendor/jaderuntime.js");function template(locals) {
var buf = [];
var jade_mixins = {};
var locals_ = (locals || {}),image = locals_.image,name = locals_.name,items = locals_.items,summary = locals_.summary,similar = locals_.similar;
buf.push("<div class=\"dialog-artist\">");
if ( image)
{
buf.push("<img" + (jade.attr("src", image, true, false)) + " class=\"pull-left\"/>");
}
buf.push("<div class=\"pull-left\"><h3>" + (jade.escape(null == (jade.interp = name) ? "" : jade.interp)) + "</h3><div class=\"albums\">");
// iterate items
;(function(){
  var $$obj = items;
  if ('number' == typeof $$obj.length) {

    for (var i = 0, $$l = $$obj.length; i < $$l; i++) {
      var x = $$obj[i];

buf.push("<span class=\"album-item\">" + (jade.escape(null == (jade.interp = (x.name + ' (' + x.year + ')' + (i !== items.length - 1 ? ', ' : ''))) ? "" : jade.interp)) + "</span>");
    }

  } else {
    var $$l = 0;
    for (var i in $$obj) {
      $$l++;      var x = $$obj[i];

buf.push("<span class=\"album-item\">" + (jade.escape(null == (jade.interp = (x.name + ' (' + x.year + ')' + (i !== items.length - 1 ? ', ' : ''))) ? "" : jade.interp)) + "</span>");
    }

  }
}).call(this);

buf.push("</div></div><div class=\"spacer\"></div><p class=\"summary\">" + (null == (jade.interp = summary) ? "" : jade.interp) + "</p><p>&nbsp;</p>");
if ( similar.length > 0)
{
buf.push("<div class=\"similar\"><h4>Similar artists</h4>");
// iterate similar
;(function(){
  var $$obj = similar;
  if ('number' == typeof $$obj.length) {

    for (var i = 0, $$l = $$obj.length; i < $$l; i++) {
      var artist = $$obj[i];

buf.push("<span>");
if ( artist.isLastFM)
{
buf.push("<img src=\"/images/lastfm-icon.png\" class=\"destination-icon\"/><a" + (jade.attr("href", artist.url, true, false)) + ">" + (jade.escape(null == (jade.interp = artist.name) ? "" : jade.interp)) + "</a>");
}
else
{
buf.push("<img src=\"/images/ikon-512.png\" class=\"destination-icon\"/><a href=\"#\" class=\"navigate-to-artist\">" + (jade.escape(null == (jade.interp = artist.name						) ? "" : jade.interp)) + "</a>");
}
buf.push("<span>" + (jade.escape(null == (jade.interp = (i !=similar.length - 1 ? ',' : '')) ? "" : jade.interp)) + "</span><span>&nbsp; </span></span>");
    }

  } else {
    var $$l = 0;
    for (var i in $$obj) {
      $$l++;      var artist = $$obj[i];

buf.push("<span>");
if ( artist.isLastFM)
{
buf.push("<img src=\"/images/lastfm-icon.png\" class=\"destination-icon\"/><a" + (jade.attr("href", artist.url, true, false)) + ">" + (jade.escape(null == (jade.interp = artist.name) ? "" : jade.interp)) + "</a>");
}
else
{
buf.push("<img src=\"/images/ikon-512.png\" class=\"destination-icon\"/><a href=\"#\" class=\"navigate-to-artist\">" + (jade.escape(null == (jade.interp = artist.name						) ? "" : jade.interp)) + "</a>");
}
buf.push("<span>" + (jade.escape(null == (jade.interp = (i !=similar.length - 1 ? ',' : '')) ? "" : jade.interp)) + "</span><span>&nbsp; </span></span>");
    }

  }
}).call(this);

buf.push("</div>");
}
buf.push("<p>&nbsp;</p><button type=\"button\" class=\"btn btn-default pull-right\">Close</button><p>&nbsp;</p></div>");;return buf.join("");
}module.exports = template;