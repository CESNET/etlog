// Include gulp
const gulp = require('gulp');
// -----------------------------------------------------------
// Include Our Plugins
//const jshint = require('gulp-jshint');
//const sass = require('gulp-sass');
//const concat = require('gulp-concat');
//const uglify = require('gulp-uglify');
//const rename = require('gulp-rename');
const pug = require('gulp-pug');
//// -----------------------------------------------------------
//// Lint Task
//gulp.task('lint', function() {
//    return gulp.src('js/*.js')
//        .pipe(jshint())
//        .pipe(jshint.reporter('default'));
//});
//// -----------------------------------------------------------
//// Compile Our Sass
//gulp.task('sass', function() {
//    return gulp.src('scss/*.scss')
//        .pipe(sass())
//        .pipe(gulp.dest('dist/css'));
//});
//// -----------------------------------------------------------
//// Concatenate & Minify JS
//gulp.task('scripts', function() {
//    return gulp.src('js/*.js')
//        .pipe(concat('all.js'))
//        .pipe(gulp.dest('dist'))
//        .pipe(rename('all.min.js'))
//        .pipe(uglify())
//        .pipe(gulp.dest('dist/js'));
//});
//// -----------------------------------------------------------
//// Watch Files For Changes
//gulp.task('watch', function() {
//    gulp.watch('js/*.js', ['lint', 'scripts']);
//    gulp.watch('scss/*.scss', ['sass']);
//});
// -----------------------------------------------------------
gulp.task('views', function buildHTML() {
  return gulp.src('views/templates/*.pug')
  .pipe(pug({}))
  .pipe(gulp.dest('public/partials'))
});
// -----------------------------------------------------------
// Default Task
gulp.task('default', ['views']);
