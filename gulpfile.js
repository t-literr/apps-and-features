"use strict";

const gulp = require('gulp');
const gutil = require('gulp-util');
const jasmine = require('gulp-jasmine');
const reporters = require('jasmine-reporters');
const terminalReporter = require('jasmine-terminal-reporter');
const clean = require('gulp-clean');
const ngCompile = require('gulp-ngc');
const tslint = require('gulp-tslint');
const argv = require('yargs').argv;
const runSequence = require('run-sequence');
const watch = require('gulp-watch');
const batch = require('gulp-batch');
const plumber = require('gulp-plumber');
const inlineNg2Template = require('gulp-inline-ng2-template');
const childProcess = require('child_process');
const ts = require('gulp-typescript');
const sourcemaps = require('gulp-sourcemaps');
const manifestResource = require('@msft-sme/shell/dist/tools/gulp-manifest-resource');
const gulpResJson = require('@msft-sme/shell/dist/tools/gulp-resjson');
const gulpMergeJsonInFolders = require('@msft-sme/shell/dist/tools/gulp-merge-json-in-folders');
const psCim = require('@msft-sme/shell/dist/tools/gulp-ps-cim');
const psCode = require('@msft-sme/shell/dist/tools/gulp-ps-code');
const psModule = require('@msft-sme/shell/dist/tools/gulp-ps-module');
const psManifest = require('@msft-sme/shell/dist/tools/gulp-ps-manifest');

const args = {
    verbose: !!argv['verbose'],
    junit: !!argv['junit']
};

gulp.task('clean', () => {
    return gulp.src(['dist', 'src/generated', 'inlineSrc'], { read: false })
        .pipe(clean({ force: true }));
});

gulp.task('lint', () => {
    return gulp.src(['src/**/*.ts', '!src/generated/**/*.*'])
        .pipe(tslint())
        .pipe(tslint.report({
            "emitError": true,
            "reportLimit": 0,
            "summarizeFailureOutput": true
        }))
});

gulp.task('generate-resjson-json', () => {
    return gulp.src(['src/resources/strings/**/*.resjson'])
        .pipe(gulpResJson({ json: true }))
        .pipe(gulp.dest('src/assets/strings'));
});

gulp.task('generate-resjson-json-localized', () => {
    return gulp.src('loc/output/**/*.resjson')
        .pipe(gulpResJson({ json: true, localeOffset: 1 }))
        .pipe(gulp.dest('src/assets/strings'));
});

gulp.task('generate-resjson-interface', () => {
    return gulp.src('src/resources/strings/**/*.resjson')
        .pipe(gulpResJson({ typescript: 'interface' }))
        .pipe(gulp.dest('src/generated'));
});

gulp.task('merge-localized-json', () => {
    return gulp.src('./node_modules/@msft-sme/**/dist/assets/strings')
        .pipe(gulpMergeJsonInFolders({ src: './src/assets/strings' }))
        .pipe(gulp.dest('src/assets/strings'));
});

gulp.task('update-manifest-resource', () => {
    return gulp.src(['src/resources/strings/strings.resjson', 'loc/output/**/*.resjson'])
        .pipe(manifestResource({ resourceName: 'MsftSmeServiceViewer' }))
        .pipe(gulp.dest('.'));
});

gulp.task('generate-resjson', (cb) => {
    runSequence(['generate-resjson-json', 'generate-resjson-json-localized', 'generate-resjson-interface'], 'merge-localized-json', 'update-manifest-resource', cb);
});

// Configure PowerShell module information.
const powerShellModule = {
    name: 'Microsoft.SME.ServiceViewer',
    guid: 'efc37b2c-cc98-45c2-9b4f-497b9ad06e46',
    list: [
        'src',
        'node_modules/@msft-sme/shell/dist'
    ]
};

gulp.task('generate-powershell-cim', () => {
    return gulp.src('src/powershell-cim-config.json')
        .pipe(psCim())
        .pipe(gulp.dest('src/generated/scripts/'));
});

gulp.task('generate-powershell-code', () => {
    return gulp.src(['src/resources/scripts/**/*.ps1', 'src/generated/scripts/**/*.ps1'])
        .pipe(psCode({ powerShellModuleName: powerShellModule.name }))
        .pipe(gulp.dest('src/generated/'));
});

gulp.task('generate-powershell-module', () => {
    const powerShellModulePaths = [];
    powerShellModule.list.forEach(item => {
        powerShellModulePaths.push(item + '/resources/scripts/**/*.ps1');
        powerShellModulePaths.push(item + '/generated/scripts/**/*.ps1');
    });
    return gulp.src(powerShellModulePaths)
        .pipe(psModule(powerShellModule))
        .pipe(gulp.dest('dist/powershell-module/' + powerShellModule.name));
});

gulp.task('generate-powershell-manifest', () => {
    // required for manifest where add-connection script or dynamic tool script are used.
    return gulp.src(['src/resources/scripts/**/*.ps1'])
        .pipe(psManifest({ powerShellModuleName: powerShellModule.name }))
        .pipe(gulp.dest('.'));
});

gulp.task('generate-powershell', (cb) => {
    runSequence('generate-powershell-cim', 'generate-powershell-code', 'generate-powershell-module', 'generate-powershell-manifest', cb);
});

gulp.task('generate', (cb) => {
    runSequence(['generate-powershell', 'generate-resjson'], cb);
});

gulp.task('inline', function() {
    return gulp.src('./src/**/*.ts')
        .pipe(inlineNg2Template({ useRelativePaths: true }))
        .pipe(gulp.dest('inlineSrc'));
});

gulp.task('compile', () => {
    return ngCompile('./tsconfig-inline.json');
});

gulp.task('copy', () => {
    return gulp.src(['src/**/*.json', 'src/**/*.d.ts', 'src/**/*.ps1', 'src/assets/**/*.*'], { base: 'src' })
        .pipe(gulp.dest('dist'));
});

gulp.task('build', (cb) => {
    runSequence('clean', 'generate', 'lint', 'inline', ['compile', 'copy'], 'test', 'bundle', cb);
});

gulp.task('bundle', cb => {
    var args = process.argv.slice(3);
    args.splice(0, 0, 'build', '-progress=false', '--aot=true', '--extract-licenses=false');
    gutil.log(args.join(' '));
    var cmd = childProcess.spawn('ng.cmd', args);
    cmd.stdout.on('data', function (data) { gutil.log(data.toString()); });
    cmd.stderr.on('data', function (data) { gutil.log(data.toString()); });
    cmd.on('exit', function (code) { cb(); });
});

gulp.task('serve-ng', (cb) => {
    var args = process.argv.slice(3);
    args.splice(0, 0, 'serve', '-progress=false');
    gutil.log(args.join(' '));
    var cmd = childProcess.spawn('ng.cmd', args);
    cmd.stdout.on('data', function (data) { gutil.log(data.toString()); });
    cmd.stderr.on('data', function (data) { gutil.log(data.toString()); });
    cmd.on('exit', function (code) { cb(); });
});

gulp.task('serve', (cb) => {
    runSequence('generate', 'serve-ng', cb);
});

gulp.task('test', () => {
    let reporter = [];
    if (args.junit) {
        reporter.push(new reporters.JUnitXmlReporter({
            savePath: 'unitTests'
        }));
    } else {
        reporter.push(new terminalReporter({
            isVerbose: args.verbose,
            showColors: true,
            includeStackTrace: args.verbose
        }));
    }

    return gulp.src('dist/**/*.test.js')
        .pipe(jasmine({
            verbose: args.verbose,
            reporter: reporter,
            includeStackTrace: args.verbose,
            config: {
                helpers: ['dist/**/*.test.helper.js'],
                stopSpecOnExpectationFailure: true
            }
        }))
        .on('jasmineDone', (output) => {
            if (args.junit) {
                gutil.log(`Tests ${output ? gutil.colors.green('Passed') : gutil.colors.yellow('Failed')}.`);
                gutil.log(`Full results at ${process.cwd()}\\unittests\\junitresults.xml`);
            }
        });
});

const config = {
    e2e: {
        src: '/e2e',
        dest: '/dist/e2e',
        commonCodeFolder: '/node_modules/@msft-sme/shell/e2e',
        generatedStringsFolder: 'src/assets/strings',
        assetsFolder: '/dist/assets',
        jasmine: {
            src: 'dist/e2e/specs/*.js',
            options: {
                reporter: [ new reporters.JUnitXmlReporter( { savePath: __dirname + "/scenariotestresults", consolidateAll: true } )],
                timeout: 180000 // 3 minutes.
            }
        },
    }
};

gulp.task('e2e-clean', ['generate-resjson'], function () {
    return gulp.src([__dirname + config.e2e.assetsFolder,
    __dirname + config.e2e.dest,
    __dirname + config.e2e.commonCodeFolder + '/**/*.js',
    __dirname + config.e2e.commonCodeFolder + '/**/*.js.map',
    __dirname + config.e2e.commonCodeFolder + '/**/*.d.ts'], { read: false })
        .pipe(clean({ force: true }));
});

gulp.task('e2e-build-generated', ['e2e-clean'], function () {
        return gulp.src(config.e2e.generatedStringsFolder + '/*.*', { base: 'src' })
        .pipe(gulp.dest('dist'));
});

gulp.task('e2e-build-common', ['e2e-build-generated'], function () {
    var tsProject = ts.createProject(__dirname + config.e2e.commonCodeFolder + '/tsconfig.json');
    return gulp.src([__dirname + config.e2e.commonCodeFolder + '/**/*.ts', '!' + __dirname + config.e2e.commonCodeFolder + '/**/*.d.ts'])
        .pipe(sourcemaps.init())
        .pipe(tsProject())
        .pipe(sourcemaps.mapSources(function (sourcePath, file) {
            var newPathSegments = sourcePath.replace('../../', '').split('/');
            return newPathSegments[newPathSegments.length - 1];
        }))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(__dirname + config.e2e.commonCodeFolder));
});

gulp.task('e2e-build', ['e2e-build-common'], function () {
    var tsProject = ts.createProject(__dirname + config.e2e.src + '/tsconfig.json');
    return gulp.src([__dirname + config.e2e.src + '/**/*.ts', '!' + __dirname + config.e2e.src + '/**/*.d.ts'])
        .pipe(sourcemaps.init())
        .pipe(tsProject())
        .pipe(sourcemaps.mapSources(function (sourcePath, file) {
            var sourcePath = sourcePath.replace('../../', '');
            var folderDepth = sourcePath.split('/').length;
            var newPath = '';
            for (var i = 0; i < folderDepth; i++) {
                newPath += '../';
            }
            newPath += '..' + config.e2e.src + '/' + sourcePath;
            return newPath;
        }))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(__dirname + config.e2e.dest));
});

gulp.task('e2e-run', function () {
    return gulp.src(config.e2e.jasmine.src)
        .pipe(jasmine(config.e2e.jasmine.options))
        .on('jasmineDone', (output) => {
            if (args.junit) {
                gutil.log(`Tests ${output ? gutil.colors.green('Passed') : gutil.colors.yellow('Failed')}.`);
                gutil.log(`Full results at ${process.cwd()}\\unittests\\junitresults.xml`);
            }
        });
});

gulp.task('e2e', function (cb) {
    runSequence('e2e-build', 'e2e-run', cb);
});
