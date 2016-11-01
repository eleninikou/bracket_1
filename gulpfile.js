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
    debowerify      = require('debowerify'),
    cssImport       = require('gulp-cssimport'),
    fileinclude     = require('gulp-file-include'),
    gutil           = require( 'gulp-util' ),
    ftp             = require( 'vinyl-ftp' );

// -----------------------------------------------------------------------------
var config = {
     bowerDir    : './bower_components',
    dest        : 'dist',
    dest_js     : 'dist/assets/js',
    dest_css    : 'dist/assets/css',
    dest_html   : 'dist/*.html',
    dest_assets : 'dist/assets',
    src         : 'src',
    src_html    : 'src/*.html',
    src_partials: 'src/**/*.html',
    src_sass    : 'src/sass/**/*.scss',
    src_js      : 'src/js/*.js',
    src_img     : 'src/img/*'
}


// -----------------------------------------------------------------------------
// SASS TO CSS
// -----------------------------------------------------------------------------
gulp.task("sass", function(){
  return gulp.src(config.src_sass)
              .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
              .pipe(sass())
              .pipe(cssImport())
              .pipe(prefix('last 3 versions'))
              .pipe(concat('main.min.css'))
              .pipe(gulp.dest(config.dest_css))
              .pipe(minify_css())
              // .pipe(sourcemaps.init())
              // .pipe(sourcemaps.write())
              .pipe(gulp.dest(config.dest_css))
              .pipe(browserSync.reload({stream:true}));
});
// -----------------------------------------------------------------------------
// Font Awesome
// -----------------------------------------------------------------------------
gulp.task('icons', function() { 
    return gulp.src(config.bowerDir + '/font-awesome/fonts/**.*') 
        .pipe(gulp.dest(config.dest_assets+'/fonts')); 
});

// -----------------------------------------------------------------------------
// Fonts
// -----------------------------------------------------------------------------
gulp.task('fonts', function() { 
    return gulp.src(config.src + '/fonts/**.*') 
        .pipe(gulp.dest(config.dest_assets+'/fonts')); 
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
    .pipe(gulp.dest(config.dest_js))
    .pipe(browserSync.reload({stream:true}));
});

// -----------------------------------------------------------------------------
// Images
// -----------------------------------------------------------------------------
gulp.task('images', function() { 
    return gulp.src(config.src + '/images/**.*') 
        .pipe(gulp.dest(config.dest_assets+'/images')); 
});

// -----------------------------------------------------------------------------
// Fileinclude
// -----------------------------------------------------------------------------
gulp.task('fileinclude', function() {
  gulp.src(config.src_html)
    .pipe(fileinclude({
      prefix: '@@',
      basepath: config.src+'/partials/'
    }))
    .pipe(gulp.dest(config.dest));
});


// -----------------------------------------------------------------------------
// Watch
// -----------------------------------------------------------------------------
gulp.task('watch', function(){
  browserSync.init({
    server: './dist'
  });
  gulp.watch(config.src_html, ['fileinclude']);
  gulp.watch(config.src_partials, ['fileinclude']);
  gulp.watch(config.src_js, ['browserify']);
  gulp.watch(config.src_sass, ['sass']);
  gulp.watch(config.dest_html).on('change',browserSync.reload);
});

// -----------------------------------------------------------------------------
// FTP Deploy
// -----------------------------------------------------------------------------
gulp.task( 'deploy', function () {

  var conn = ftp.create( {
    host:     '',
    user:     '',
    password: '',
    parallel: 10,
    log:      gutil.log
  } );

  var globs = [
    config.dest+'/**',
  ];

  // using base = '.' will transfer everything to /public_html correctly
  // turn off buffering in gulp.src for best performance

  return gulp.src( globs, { base: 'dist/', buffer: false } )
    .pipe( conn.newer( '/public_html/dev/' ) ) // only upload newer files
    .pipe( conn.dest( '/public_html/dev' ) );

} );
// -----------------------------------------------------------------------------
//Default
// -----------------------------------------------------------------------------
gulp.task('init',['watch','sass','fonts','fileinclude','browserify','icons']);
gulp.task('default',['watch']);
