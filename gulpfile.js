var gulp            = require("gulp"),
    sass            = require("gulp-sass"),
    concat          = require("gulp-concat"),
    watch           = require("gulp-watch"),
    plumber         = require("gulp-plumber"),
    minify_css      = require("gulp-minify-css"),
    autoprefixer    = require('gulp-autoprefixer'),
    uglify          = require("gulp-uglify"),
    sourcemaps      = require("gulp-sourcemaps"),
    cleanCSS        = require('gulp-clean-css'),
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
    ftp             = require( 'vinyl-ftp' ),
    gulpif          = require('gulp-if'),
    argv            = require('yargs').argv;

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
    src_img     : 'src/images/*'
}

// gulp build --production
var production = !!argv.production;

// -----------------------------------------------------------------------------
// SASS TO CSS
// -----------------------------------------------------------------------------
gulp.task("sass", function(){
  return gulp.src(config.src_sass)
              .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
              .pipe(gulpif(!production, sourcemaps.init()))
              .pipe(sass({
                sourceComments: !production,
                outputStyle: production ? 'compressed' : 'nested'
              }))
              .pipe(cssImport())
              .pipe(gulpif(!production, sourcemaps.write({
                'includeContent': false,
                'sourceRoot': '.'
              })))
              .pipe(gulpif(!production, sourcemaps.init({
                  'loadMaps': true
              })))
              .pipe(sourcemaps.write({
                'includeContent': true
              }))
              .pipe(autoprefixer({
                  browsers: ['last 2 versions'],
                  cascade: false
              }))
              .pipe(concat('main.min.css'))
              .pipe(gulpif(production, cleanCSS()))
              .pipe(gulp.dest(config.dest_css))
              .pipe(browserSync.reload({stream:true}));
});
// -----------------------------------------------------------------------------
// Font Awesome
// -----------------------------------------------------------------------------
gulp.task('icons', function() { 
    return gulp.src(config.bowerDir + '/components-font-awesome/fonts/**.*') 
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
  var bundleStream = browserify('src/js/main.js',
    {
      debug: !production,
      cache: {}
    }).bundle()

  bundleStream
    .pipe(source('index.js'))
    .pipe(gulpif(production, streamify(uglify())))
    .pipe(rename('bundle.js'))
    .pipe(gulp.dest(config.dest_js))
    .pipe(browserSync.reload({stream:true}));
});

// -----------------------------------------------------------------------------
// Images
// -----------------------------------------------------------------------------
gulp.task('images', function() { 
    return gulp.src(config.src_img) 
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
		.pipe( conn.newer( '/public_html/' ) ) // only upload newer files
		.pipe( conn.dest( '/public_html/' ) );

} );
// -----------------------------------------------------------------------------
//Default
// -----------------------------------------------------------------------------
gulp.task('init',['watch','sass','fonts','fileinclude','browserify','icons']);
gulp.task('default',['watch']);
