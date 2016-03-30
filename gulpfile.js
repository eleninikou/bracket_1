var gulp            = require("gulp"),
    sass            = require("gulp-sass"),
    concat          = require("gulp-concat"),
    watch           = require("gulp-watch"),
    plumber         = require("gulp-plumber"),
    minify_css      = require("gulp-minify-css"),
    uglify          = require("gulp-uglify"),
    prefix          = require("gulp-autoprefixer"),
    sourcemaps      = require("gulp-sourcemaps"),
    through         = require("gulp-through"),
    notify          = require("gulp-notify"),
    browserSync     = require("browser-sync"),
    source          = require('vinyl-source-stream'),
    streamify       = require('gulp-streamify'),
    browserify      = require("browserify"),
    rename          = require('gulp-rename'),
    debowerify      =require('debowerify');

// -----------------------------------------------------------------------------

var dest_js   = "dist/js";
var dest_css  = "dist/css";
var dest_html  = "dist/**/*.html";

var src_sass  = "src/sass/**/*.scss";
var src_js    = "src/js/**/*.js";
var src_img   = "src/img/*"

// -----------------------------------------------------------------------------
// SASS TO CSS
// -----------------------------------------------------------------------------
gulp.task("sass", function(){
  return gulp.src(src_sass)
              .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
              .pipe(sass())
              .pipe(prefix('last 3 versions'))
              .pipe(concat('main.min.css'))
              .pipe(gulp.dest(dest_css))
              .pipe(minify_css())
              .pipe(sourcemaps.init())
              .pipe(sourcemaps.write())
              .pipe(gulp.dest(dest_css))
              .pipe(browserSync.reload({stream:true}));
});

// -----------------------------------------------------------------------------
// Browserify
// -----------------------------------------------------------------------------
gulp.task('browserify', function() {
  var bundleStream = browserify('src/js/main.js').bundle()

  bundleStream
    .pipe(source('index.js'))
    .pipe(streamify(uglify()))
    .pipe(rename('bundle.js'))
    .pipe(gulp.dest(dest_js))
});

// -----------------------------------------------------------------------------
// Watch
// -----------------------------------------------------------------------------
gulp.task('watch', function(){
  browserSync.init({
    server: './dist'
  });
  gulp.watch(src_js, ['browserify']);
  gulp.watch(src_sass, ['sass']);
  gulp.watch(dest_html).on('change',browserSync.reload);
});

// -----------------------------------------------------------------------------
//Default
// -----------------------------------------------------------------------------
gulp.task('default',['watch','sass','browserify'])
