var gulp = require('gulp'),
    strip = require('gulp-strip-comments'),
    concat = require('gulp-concat'),
    plumber = require('gulp-plumber'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    minifyCSS = require('gulp-minify-css'),
    sass = require('gulp-sass');

var gulpPaths = {
    "bc": "./bower_components/",
    "js": "./src/js/",
    "sass": "./src/scss/",
    "dist": "./www/",
    "views": "./src/views/"
};

function app() {
    return gulp.src([
        gulpPaths.js + '**/*.js'
    ])
    .pipe(strip())
    .pipe(concat('index.js'))
    .pipe(gulp.dest(gulpPaths.dist + 'js'));
}

function vendor() {
    return gulp.src([
        // add bower components js here
        gulpPaths.bc + 'jquery/dist/jquery.min.js',
        gulpPaths.bc + 'popper.js/dist/umd/popper.min.js',
        // gulpPaths.bc + 'tether/dist/js/tether.js',
        gulpPaths.bc + 'moment/min/moment.min.js',
        gulpPaths.bc + 'bootstrap/dist/js/bootstrap.min.js',
        gulpPaths.bc + 'angular/angular.min.js',
        // gulpPaths.bc + 'angular-ui-router/release/angular-ui-router.min.js'
        gulpPaths.bc + 'angular-route/angular-route.min.js',
        gulpPaths.bc + 'ng-tags-input/ng-tags-input.min.js'
    ])
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest(gulpPaths.dist + 'js'));
}

function msass() {
    return gulp.src([
        gulpPaths.sass + 'main.scss'
    ])
    .pipe(sass().on('error', sass.logError))
    .pipe(plumber())
    .pipe(rename('index.css'))
    .pipe(gulp.dest(gulpPaths.dist+'css'));
}

function style() {
    return gulp.src([
        // Add css files from bower here
        // gulpPaths.bc + 'tether/dist/css/tether.min.css',
        gulpPaths.bc + 'bootstrap/dist/css/bootstrap.min.css',
        gulpPaths.bc + 'ng-tags-input/ng-tags-input.min.css',
        // gulpPaths.bc + 'components-font-awesome/css/font-awesome.min.css'
    ])
    .pipe(concat('vendor.css'))
    .pipe(gulp.dest(gulpPaths.dist+'css'))
}

function views() {
    return gulp.src([
        gulpPaths.views + '*.html'
    ])
    .pipe(strip())
    .pipe(gulp.dest(gulpPaths.dist+'views'));
}

function fontsCss() {
    return gulp.src([
        gulpPaths.bc + 'components-font-awesome/css/font-awesome.min.css'
    ])
    .pipe(gulp.dest(gulpPaths.dist+'css'));
}
function fonts() {
    return gulp.src([
        gulpPaths.bc + 'components-font-awesome/fonts/*'
    ])
    .pipe(gulp.dest(gulpPaths.dist+'fonts'));
}

gulp.task('app', app);
gulp.task('vendor', vendor);
gulp.task('sass', msass);
gulp.task('style', style);
gulp.task('views', views);
gulp.task('fonts', fonts);
gulp.task('fontsCss', fontsCss);

gulp.task('default', ['fonts', 'fontsCss', 'style', 'sass', 'views', 'vendor', 'app', 'watch']);

gulp.task('watch', function () {
    gulp.watch(gulpPaths.sass + '*.scss', ['sass']);
    gulp.watch(gulpPaths.js + '**/*.js', ['app']);
    gulp.watch(gulpPaths.views + '*.html', ['views']);
})