/**
 * Created by Crumina on 09.11.2017.
 */

/*=========== GULP + Plugins init ==============*/

var gulp = require('gulp'),
	plumber = require('gulp-plumber'), // generates an error message
	prefixer = require('gulp-autoprefixer'), // automatically prefixes to css properties
	uglify = require('gulp-uglify-es').default, // for minimizing js-files
	cssmin = require('gulp-cssmin'), // for minimizing css-files
	svgmin = require('gulp-svgmin'), // for minimizing svg-files
	rename = require('gulp-rename'), // to rename files
	sass = require('gulp-sass'), // for compiling scss-files to css
	webserver = require('browser-sync'), // for online synchronization with the browser
	imagemin = require('gulp-imagemin'), // for minimizing images-files
	cache = require('gulp-cache'), // connecting the cache library
	concat = require('gulp-concat'),
	zip = require('gulp-zip'),
	webp = require('gulp-webp'), // for convert png in webp
	del = require('del'),
	replace = require('gulp-replace'),
	sourcemaps = require('gulp-sourcemaps'),
	babel = require('gulp-babel'),
	htmlhint = require("gulp-htmlhint"); // for HTML-validation


/*=========== Babel for svg-loader ==============*/

gulp.task('babel-js', function (cb) {
	gulp.src('./html/js/svg-loader.js')
		.pipe(babel({
			presets: ['@babel/env']
		}))
		.pipe(gulp.dest('./html/js/'));
	cb();
});


/*=========== ON-Line synchronization from browsers ==============*/

/* server settings */
var config = {
	server: {
		baseDir: 'html'
	},
	notify: false
};

// server start
gulp.task('webserver', function () {
	webserver(config);
});


/*=========== Compile SCSS ==============*/

gulp.task('sass', function (cb) {

	gulp.src('html/sass/*.scss')
		.pipe(sourcemaps.init())
		.pipe(plumber())
		.pipe(sass(
			{
				linefeed: "crlf"
			}
		))
		.pipe(prefixer())
		.pipe(gulp.dest('./html/css'))
		.pipe(rename({
			suffix: '.min'
		}))
		.pipe(cssmin())
		.pipe(sourcemaps.write('./maps'))
		.pipe(gulp.dest('./html/css'));

	gulp.src('html/Bootstrap/scss/*.scss')
		.pipe(plumber())
		.pipe(sass(
			{
				linefeed: "crlf"
			}
		))
		.pipe(cssmin())
		.pipe(sourcemaps.write('./maps'))
		.pipe(gulp.dest('./html/Bootstrap/dist/css'))
		.pipe(webserver.reload({stream: true}));
	cb();
});


/*=========== Watch ==============*/

gulp.task('watch', function () {
	gulp.watch('html/sass/**/*.scss', gulp.series('sass'));
	gulp.watch('html/Bootstrap/scss/*.scss', gulp.series('sass'));
});


/*=========== Convert PNG in WEBP ==============*/

gulp.task('convert-webp', function (cb) {
	gulp.src('html/img/**/*.png')
		.pipe(webp({quality: 80}))
		.pipe(gulp.dest('html/img'));
	gulp.src('html/img/**/*.jpg')
		.pipe(webp({quality: 80}))
		.pipe(gulp.dest('html/img'));
	gulp.src('html/screenshots/**/*.png')
		.pipe(webp({quality: 80}))
		.pipe(gulp.dest('html/screenshots'));
	gulp.src('html/screenshots/**/*.jpg')
		.pipe(webp({quality: 80}))
		.pipe(gulp.dest('html/screenshots'));
	cb();
});

/*============= Auto-deleting temporary files ==============*/

gulp.task('clean-webp', function (cb) {
	del(['html/img/**/*.webp']);
	cb();
});

/*=========== Minimization IMAGE ==============*/

gulp.task('images', function (cb) {
	gulp.src('html/img/*')
		.pipe(cache(imagemin({
			interlaced: true
		})))
		.pipe(gulp.dest('html/img'));

	gulp.src('html/screenshots/*')
		.pipe(cache(imagemin({
			interlaced: true
		})))
		.pipe(gulp.dest('html/screenshots'));

	cb();
});

gulp.task('compress', function (cb) {
	gulp.src('html/img/*')
		.pipe(imagemin())
		.pipe(gulp.dest('html/img'));

	gulp.src('html/screenshots/*')
		.pipe(imagemin())
		.pipe(gulp.dest('html/screenshots'));
	cb();
});


/*=========== Minimization SVG ==============*/

gulp.task('svg-min', function (cb) {
	gulp.src('html/svg-icons/*.svg')
		.pipe(svgmin({
			plugins: [{
				removeDoctype: true
			}, {
				removeComments: true
			}, {
				cleanupNumericValues: {
					floatPrecision: 2
				}
			}, {
				convertColors: {
					names2hex: true,
					rgb2hex: true
				}
			}]
		}))
		.pipe(gulp.dest('html/svg-icons'));

	cb();
});

/*============= HTML-validator ==============*/

gulp.task('html-valid', function (cb) {
	gulp.src("html/*.html")
		.pipe(htmlhint());
	cb();
});


/*============= Join tasks ==============*/

gulp.task('default', gulp.parallel('webserver', 'watch', 'sass'));

gulp.task('build', gulp.series('html-valid', 'sass', 'svg-min', 'convert-webp', 'images', 'compress'));


/*============= Tasks for TF ==============*/

gulp.task('inject-analytics', function (cb) {
	gulp.src('HTML-promo/*.html')
		.pipe(replace(/(\<head[^\>]*\>)/g, '$1\n<!-- Google Tag Manager -->\n' +
			'<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({\'gtm.start\':\n' +
			'new Date().getTime(),event:\'gtm.js\'});var f=d.getElementsByTagName(s)[0],\n' +
			'j=d.createElement(s),dl=l!=\'dataLayer\'?\'&l=\'+l:\'\';j.async=true;j.src=\n' +
			'\'https://www.googletagmanager.com/gtm.js?id=\'+i+dl;f.parentNode.insertBefore(j,f);\n' +
			'})(window,document,\'script\',\'dataLayer\',\'GTM-568DJSG\');</script>\n' +
			'<!-- End Google Tag Manager -->'))

		.pipe(replace(/(\<body[^\>]*\>)/g, '$1\n<!-- Google Tag Manager (noscript) -->\n<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-568DJSG" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>\n<!-- End Google Tag Manager (noscript) -->'))
		.pipe(gulp.dest('HTML-promo/'));

	cb();
});

gulp.task('copy-files', function (cb) {
	gulp.src('html/**/*')
		.pipe(gulp.dest('HTML-promo/'));

	gulp.src([
			'html/**',
			'extras/**',
			'licensing/**',
			'documentation/**',
			'gulpfile.js',
			'package.json'
		],
		{
			base: './'
		})
		.pipe(gulp.dest('HTML-tf/'));

	cb();
});

gulp.task('encrypt-project', function (cb) {
	gulp.src(['html/js/main.js', 'encrypt-project.js'])
		.pipe(concat('main.js'))
		.pipe(uglify())
		.pipe(gulp.dest('HTML-promo/js/'));

	cb();
});

gulp.task('copy-images', function (cb) {
	gulp.src('img-no-image/**/*')
		.pipe(gulp.dest('HTML-tf/html/img'));

	cb();
});

gulp.task('zip', function (cb) {
	gulp.src('HTML-tf/**')
		.pipe(zip('html-tf.zip'))
		.pipe(gulp.dest('./'));

	gulp.src('HTML-promo/**')
		.pipe(zip('html-promo.zip'))
		.pipe(gulp.dest('./'));
	cb();
});


gulp.task('copy-projects', gulp.series('copy-files'));

gulp.task('inject-analytics', gulp.series('inject-analytics'));

gulp.task('encryptor-zip', gulp.series('copy-images', 'encrypt-project', 'zip'));