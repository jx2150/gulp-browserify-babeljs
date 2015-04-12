var gulp = require("gulp");
var babel = require("gulp-babel");
var babelify = require('babelify');
var browserify = require('browserify');
var source = require('vinyl-source-stream');

gulp.task("default", function () {
	// browserify({ debug: true })
	// .transform(babelify)
	// .require("./app.js", { entry: true })
	// .bundle()
	// .on("error", function (err) { console.log("Error: " + err.message); })
	// .pipe(gulp.dest("output.js"));
	browserify({
	    entries: './app.js',
	    debug: true
	})
	.transform(babelify)
	.bundle()
	.pipe(source('main.js'))
	.pipe(gulp.dest('./dist'));
});

gulp.task("watch", function(){
    gulp.watch(['app.js', './imports/*.js'], ['default']);
});