var gulp = require("gulp"),
  sass = require("gulp-sass"),
  concat = require("gulp-concat"),
  watch = require("gulp-watch"),
  plumber = require("gulp-plumber"),
  minify_css = require("gulp-minify-css"),
  uglify = require("gulp-uglify"),
  prefix = require("gulp-autoprefixer"),
  sourcemaps = require("gulp-sourcemaps"),
  through = require("gulp-through"),
  imagemin = require('gulp-imagemin'),
  notify = require("gulp-notify"),
  browserSync = require("browser-sync"),
  lineec = require('gulp-line-ending-corrector'),
  source = require('vinyl-source-stream'),
  streamify = require('gulp-streamify'),
  browserify = require("browserify"),
  rename = require('gulp-rename'),
  debowerify = require('debowerify'),
  cssImport = require('gulp-cssimport'),
  fileinclude = require('gulp-file-include'),
  gutil = require('gulp-util'),
  ftp = require('vinyl-ftp'),
  ngrok = require('ngrok'),
  fs = require('fs');
require('dotenv').config()

// -----------------------------------------------------------------------------
var config = {
  bowerDir: './bower_components',
  dest: 'dist',
  dest_js: 'dist/assets/js',
  dest_css: 'dist/assets/css',
  dest_html: 'dist/*.html',
  dest_assets: 'dist/assets',
  src: 'src',
  src_html: 'src/*.html',
  src_partials: 'src/**/*.html',
  src_sass: 'src/sass/**/*.scss',
  src_js: 'src/js/*.js',
  src_img: 'src/images/*'
}

const AUTOPREFIXER_BROWSERS = [
  'last 2 version',
  '> 1%',
  'ie >= 9',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4',
  'bb >= 10'
];


gulp.task('create_env', function (cb) {
  fs.writeFile('.env', 'FTP_HOST=\nFTP_PASSWORD=\nFTP_USER=\nFTP_LOCATION=', cb);
});

// -----------------------------------------------------------------------------
// SASS TO CSS
// -----------------------------------------------------------------------------
gulp.task("sass", function () {
  return gulp.src(config.src_sass)
    .pipe(plumber({
      errorHandler: notify.onError("Error: <%= error.message %>")
    }))
    .pipe(sass())
    .pipe(cssImport())
    .pipe( sourcemaps.write( { includeContent: false } ) )
    .pipe( sourcemaps.init( { loadMaps: true } ) )
    .pipe(prefix(AUTOPREFIXER_BROWSERS))
    .pipe(concat('main.min.css'))
    .pipe(gulp.dest(config.dest_css))
    .pipe(minify_css( {maxLineLen: 10} ))
    .pipe( lineec() )
    .pipe(gulp.dest(config.dest_css))
    .pipe(browserSync.reload({
      stream: true
    }))
    .pipe( notify( { message: 'TASK: "styles" Completed! 💯', onLast: true } ) );
});
// -----------------------------------------------------------------------------
// Font Awesome
// -----------------------------------------------------------------------------
gulp.task('icons', function () {
  return gulp.src(config.bowerDir + '/font-awesome/fonts/**.*')
    .pipe(gulp.dest(config.dest_assets + '/fonts'))
    .pipe( notify( { message: 'TASK: "icons" Completed! 💯', onLast: true } ) );
});

// -----------------------------------------------------------------------------
// Fonts
// -----------------------------------------------------------------------------
gulp.task('fonts', function () {
  return gulp.src(config.src + '/fonts/**.*')
    .pipe(gulp.dest(config.dest_assets + '/fonts'))
    .pipe( notify( { message: 'TASK: "fonts" Completed! 💯', onLast: true } ) );
});

// -----------------------------------------------------------------------------
// Browserify
// -----------------------------------------------------------------------------
gulp.task('browserify', function () {
  var bundleStream = browserify('src/js/main.js').bundle()

  bundleStream
    .pipe(source('index.js'))
    .pipe(streamify(uglify()))
    .pipe(rename('bundle.js'))
    .pipe(gulp.dest(config.dest_js))
    .pipe(browserSync.reload({
      stream: true
    }))
    .pipe( notify( { message: 'TASK: "js" Completed! 💯', onLast: true } ) );
});

// -----------------------------------------------------------------------------
// Images
// -----------------------------------------------------------------------------
gulp.task('images', function () {
  return gulp.src(config.src + '/images/**.*')
    .pipe( imagemin( {
      progressive: true,
      optimizationLevel: 5, // 0-7 low-high
      interlaced: true,
      svgoPlugins: [{removeViewBox: false}]
    } ) )
    .pipe(gulp.dest(config.dest_assets + '/images'))
    .pipe( notify( { message: 'TASK: "images" Completed! 💯', onLast: true } ) );
});

// -----------------------------------------------------------------------------
// Fileinclude
// -----------------------------------------------------------------------------
gulp.task('fileinclude', function () {
  gulp.src(config.src_html)
    .pipe(fileinclude({
      prefix: '@@',
      basepath: config.src + '/partials/'
    }))
    .pipe(gulp.dest(config.dest));
});


// -----------------------------------------------------------------------------
// Watch
// -----------------------------------------------------------------------------
gulp.task('watch', function () {
  browserSync.init({
    server: './dist'
  });
  gulp.watch(config.src_html, ['fileinclude']);
  gulp.watch(config.src_partials, ['fileinclude']);
  gulp.watch(config.src_js, ['browserify']);
  gulp.watch(config.src_sass, ['sass']);
  gulp.watch(config.src_img, ['images']);
  gulp.watch(config.dest_html).on('change', browserSync.reload);
});

// -----------------------------------------------------------------------------
// FTP Deploy
// -----------------------------------------------------------------------------
gulp.task('deploy', function () {

  var conn = ftp.create({
    host: process.env.FTP_HOST,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    parallel: 10,
    log: gutil.log
  });

  var globs = [
    config.dest + '/**',
  ];

  // using base = '.' will transfer everything to /public_html correctly
  // turn off buffering in gulp.src for best performance

  return gulp.src(globs, {
      base: 'dist/',
      buffer: false
    })
    .pipe(conn.newer(process.env.FTP_LOCATION)) // only upload newer files
    .pipe(conn.dest(process.env.FTP_LOCATION))
    .pipe( notify( { message: 'TASK: "deploy" Completed! 💯', onLast: true } ) );

});


// -----------------------------------------------------------------------------
// Ngrok
// -----------------------------------------------------------------------------
gulp.task('live', function () {
  browserSync.init({
    server: './dist'
  }, function (err, bs) {
    ngrok.connect(bs.options.get('port'), function (err, url) {
      // https://757c1652.ngrok.com -> 127.0.0.1:8080  
      console.log(url);
    });
  });
  gulp.watch(config.src_html, ['fileinclude']);
  gulp.watch(config.src_partials, ['fileinclude']);
  gulp.watch(config.src + '/images/**.*', ['images']);
  gulp.watch(config.src_js, ['browserify']);
  gulp.watch(config.src_sass, ['sass']);
  gulp.watch(config.dest_html).on('change', browserSync.reload);
});


// -----------------------------------------------------------------------------
//Default
// -----------------------------------------------------------------------------
gulp.task('init', ['watch', 'sass', 'fonts', 'fileinclude', 'browserify', 'icons', 'create_env']);
gulp.task('default', ['watch']);
gulp.task('ngrok', ['live']);