﻿var fs = require('fs');

var find_tests = function (testFileList, discoverResultFile, projectFolder) {
    var Mocha = detectMocha(projectFolder);
    if (!Mocha) {
        return;
    }

    function getTestList(suite, testFile) {
        if (suite) {
            if (suite.tests && suite.tests.length !== 0) {
                suite.tests.forEach(function (t, i, testArray) {
                    testList.push({
                        test: t.fullTitle(),
                        suite: suite.fullTitle(),
                        file: testFile,
                        line: 0,
                        column: 0
                    });
                });
            }

            if (suite.suites) {
                suite.suites.forEach(function (s, i, suiteArray) {
                    getTestList(s, testFile);
                });
            }
        }
    }
    var testList = [];
    testFileList.split(';').forEach(function (testFile) {
        var mocha = new Mocha();
        try {
            mocha.ui('tdd');
            mocha.addFile(testFile);
            mocha.loadFiles();
            getTestList(mocha.suite, testFile);
        } catch (e) {
            //we would like continue discover other files, so swallow, log and continue;
            console.error('catch discover error:' + e);
        }
    });

    var fd = fs.openSync(discoverResultFile, 'w');
    fs.writeSync(fd, JSON.stringify(testList));
    fs.closeSync(fd);
};
module.exports.find_tests = find_tests;

var run_tests = function (testName, testFile, workingFolder, projectFolder) {
    var Mocha = detectMocha(projectFolder);
    if (!Mocha) {
        return;
    }

    var mocha = new Mocha();
    mocha.ui('tdd');
    //set timeout to 10 minutes, becasue the default of 2 sec might be too short (TODO: make it configuable)
    mocha.suite.timeout(600000);
    if (testName) {
        mocha.grep(testName);
    }
    mocha.addFile(testFile);
    //Choose 'xunit' rather 'min'. The reason is when under piped/redirect,
    //mocha produces undisplayable text to stdout and stderr. Using xunit works fine 
    mocha.reporter('xunit');
    mocha.run(function (code) {
        process.exit(code);
    });
};

function detectMocha(projectFolder) {
    try {
        var Mocha = new require(projectFolder + '\\node_modules\\mocha');
        return Mocha;
    } catch (ex) {
        console.log("NTVS_ERROR:Failed to find Mocha package.  Mocha must be installed in the project locally.  Mocha can be installed locally with the npm manager via solution explorer or with \".npm install mocha\" via the Node.js interactive window.");
        return null;
    }
}

module.exports.run_tests = run_tests;