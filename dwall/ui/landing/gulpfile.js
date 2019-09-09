'use strict';

var gulp = require('gulp');
var watch = require('gulp-watch');
var sourcemaps = require('gulp-sourcemaps');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var rename = require("gulp-rename");
var uglify = require('gulp-uglify');
var gulp_image = require('gulp-image');
var newer = require('gulp-newer');
var browserSync = require('browser-sync');
var gulpif = require('gulp-if');
var notify = require('gulp-notify');
var plumber = require('gulp-plumber');
var eslint = require('gulp-eslint');
var argv = require('yargs').argv;
var gulpsync = require('gulp-sync')(gulp);
var babel = require('gulp-babel');
var clean = require('gulp-clean');

var is_prod = false;

if (argv.production || argv.prod) {
  is_prod = true;
}

const path = {
	build: {
		css: 'dist/css/',
		js: 'dist/js/',
		img: 'dist/images/',
		img_clean: 'dist/images/**/*'
	},
	src: {
		scss: 'src/scss/**/main.scss',
    js: 'src/js/*.js',
    img:'src/images/**/*',
    img_svg: 'src/images/**/*.svg'
	},
  watch: {
    htmlTemplates: 'landing.html',
    scss: 'src/scss/**/*.scss',
    js: 'src/js/**/*.js',
    img: 'src/images/**/*'
  }
};

gulp.task('server', function () {
  browserSync({
    server: {
      basedir: './'
    },
    port: 3000
  });
});

gulp.task('build:scss', function () {
    return gulp.src(path.src.scss)
        .pipe(gulpif(!is_prod, sourcemaps.init()))
        .pipe(sass({
          outputStyle: 'nested',
          precision: 10,
          onError: function (err) {
            notify().write(err);
          }
        }).on('error', sass.logError))
        .pipe(autoprefixer({
          browsers: ['last 15 versions', '> 1%'],
          cascade: false
        }))
        .pipe(gulpif(!is_prod,
            sourcemaps.write())
        )
        .pipe(rename({
          suffix: '.min'
        }))
        .pipe(gulp.dest(path.build.css))
        .pipe(gulpif(!is_prod, browserSync.reload({stream: true})))
        .pipe(gulpif(!is_prod, notify({
          title: "SASS Compiled",
          message: "All SASS files have been recompiled to CSS.",
          onLast: true
        })));
});

gulp.task('build:js', function () {
    return gulp.src(path.src.js)
        .pipe(plumber())
        // .pipe(eslint())
        // .pipe(eslint.format())
        // .pipe(babel({
        //   presets: ['env']
        // }))
        .pipe(uglify())
        .pipe(rename({
          suffix: '.min'
        }))
        .pipe(gulp.dest(path.build.js))
        .pipe(gulpif(!is_prod, browserSync.reload({stream: true})));

});

gulp.task('build:images:clean', function () {
        gulp.src(path.build.img_clean)
            .pipe(clean());
});

gulp.task('build:images', function () {
        gulp.src(path.src.img)
            .pipe(newer(path.build.img))
            .pipe(gulp_image({
              pngquant: true,
              optipng: false,
              zopflipng: true,
              jpegRecompress: false,
              jpegoptim: true,
              mozjpeg: true,
              gifsicle: true,
              svgo: true,
              concurrent: 10
            }))
            .pipe(gulp.dest(path.build.img))
            .pipe(browserSync.reload({stream: true})),

        gulp.src(path.src.img_svg)
            .pipe(gulp.dest(path.build.img));
});

// gulp.task('build:images:all', gulpsync.sync(['build:images:clean', ['build:images']]));

gulp.task('build', function () {
  gulp.start('build:scss');
  gulp.start('build:js');
  gulp.start('build:images');
});

gulp.task('browserSync:reload', function () {
  console.log('Browser reloading.');
  browserSync.reload();
});


gulp.task('watch', function () {

  gulp.watch([path.watch.scss], function () {
    gulp.start('build:scss')
  });

  gulp.watch([path.watch.js], function () {
    gulp.start('build:js');
  });

  gulp.watch([path.watch.htmlTemplates], function() {
    gulp.start('browserSync:reload');
  });

  gulp.watch([path.watch.img], function () {
    gulp.start('build:images');
  });
});

gulp.task('default', ['build', 'server', 'watch']);

