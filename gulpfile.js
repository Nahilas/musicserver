var gulp = require("gulp");
var plugins = require("gulp-load-plugins")();
var path = require('path');
var es = require('event-stream');
var through = require('through2');
var lr = require('tiny-lr');
var config = require('./config');

lrserver = lr();

var server = require('./server.js');

function wrapTemplates()
{
	function wrapTemplate(file, enc, cb){
		if(file.isStream()){
			this.emit('error', new PluginError('wrap-template', 'Streaming not supported'));
			return cb();
		}

		if(file.isBuffer()){

			var content = String(file.contents);
			content = 'jade = require("./../vendor/jaderuntime.js");' + content + 'module.exports = template;';

			file.contents = new Buffer(content);
		}

		this.push(file);
		cb();
	}

	return through.obj(wrapTemplate);
}


gulp.task('styles', function() {
	gulp.src('client/styles/main.less')
	.pipe(plugins.less({
		paths: [ path.join(__dirname, 'less', 'includes') ]
	}))
	.pipe(gulp.dest('dist/styles'))
	.pipe(plugins.livereload(lrserver));
});


gulp.task('scripts', ['templates'], function() {
	gulp.src('client/scripts/app.js')
		.pipe(plugins.browserify({ debug: true }))
		.pipe(gulp.dest('dist/scripts'))
		.pipe(plugins.livereload(lrserver));
});

gulp.task('templates', function() 
{
	gulp.src('client/templates/*.jade')
		.pipe(plugins.jade({ client: true }))
		.pipe(wrapTemplates())
		.pipe(gulp.dest('client/scripts/templates'))
		.pipe(plugins.livereload(lrserver));
});

gulp.task('clean', function() {
	es.concat(gulp.src('dist/**/**', {read: false})
		.pipe(plugins.clean({force: true})),
	gulp.src('client/scripts/templates', { read: false })
		.pipe(plugins.clean({force: true})));
});

gulp.task('copy', function() {
	es.concat(gulp.src('client/views/*.jade')
		.pipe(gulp.dest('dist/views')), 
		gulp.src('client/fonts/*.*')
		.pipe(gulp.dest('dist/fonts'))),
		gulp.src('client/scripts/vendor/*.js')
		.pipe(gulp.dest('dist/scripts/vendor'))
		.pipe(plugins.livereload(lrserver));
});

gulp.task('watch', function() {
	lrserver.listen(35729, function(err) {
		if(err) return console.log(err);

		gulp.watch('client/styles/*.less', ['styles']);
		gulp.watch('client/scripts/*.js', ['scripts']);
		gulp.watch('client/templates/*.jade', ['templates']);
		gulp.watch('client/views/*.jade', ['copy']);
	});
});

gulp.task('open', function() {
	gulp.src('./server.js') //dummy for gulp to run open
	.pipe(plugins.open("", {
		url: 'http://localhost:' + config.port
	}));
});


gulp.task('build', ['clean'], function() {
	gulp.start('copy', 'templates', 'styles', 'scripts', 'watch', 'open');
});

gulp.task('server', ['build'], function() {
	server.start();
})

gulp.task('default', function() {
	gulp.start('server');
});