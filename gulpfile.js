var gulp = require("gulp");
var babel = require("gulp-babel");
var babelify = require('babelify');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
// var mocha = require('gulp-mocha');
 
// gulp.task('test', function () {
//     return gulp.src('test.js', {read: false})
//         .pipe(mocha({
//         	reporter: 'nyan',
//         	compilers: 'babel/register'
//         }));
// });

gulp.task("default", function () {
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