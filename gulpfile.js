// -----------------------------------------------------------
const gulp = require('gulp');
const jshint = require('gulp-jshint');
const pug = require('gulp-pug');
const css = require('gulp-clean-css');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const streamqueue  = require('streamqueue');
// -----------------------------------------------------------
// minify css
gulp.task('css', function() {
  return gulp.src('stylesheets/*.css')
    .pipe(concat('app.min.css'))
    .pipe(css({compatibility: 'ie8'}))
    .pipe(gulp.dest('public/stylesheets'));
});
// -----------------------------------------------------------
// Concatenate & Minify JS
gulp.task('js', function() {
  return streamqueue({ objectMode: true },
    gulp.src('javascripts/angular/angular_1.5.8.min.js'),
    gulp.src('javascripts/angular/angular-ui-router.min.js'),
    gulp.src('javascripts/angular/dirPagination.js'),
    gulp.src('javascripts/angular/main.js'),
    gulp.src('javascripts/angular/controllers.js'),
    gulp.src('javascripts/angular/routes.js'),
    gulp.src('javascripts/flatpickr/flatpickr.js'),
    gulp.src('javascripts/flatpickr/cs.js'),
    gulp.src('javascripts/jquery/jquery.min.js'),
    gulp.src('javascripts/d3/d3.v4.min.js'),
    gulp.src('javascripts/d3/d3-tip.js'),
    gulp.src('javascripts/d3/d3-scale-chromatic.v1.min.js'),
    gulp.src('javascripts/*.js')
  )
    .pipe(concat('app.js'))
    .pipe(uglify())
    .pipe(gulp.dest('public/javascripts'));
});
// -----------------------------------------------------------
gulp.task('views', function buildHTML() {
  return gulp.src('views/templates/*.pug')
    .pipe(pug({}))
    .pipe(gulp.dest('public/partials'))
});
// -----------------------------------------------------------
// Default Task
gulp.task('default', ['views', 'js', 'css']);
// -----------------------------------------------------------
