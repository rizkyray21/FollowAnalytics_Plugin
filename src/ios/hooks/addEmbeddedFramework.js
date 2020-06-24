module.exports = function (ctx) {
    // Name of the .framework file to be embed
    var frameworkName = "FollowAnalytics.framework"

    var fs = require("fs");
    var path = require("path");
    var xcode = require("xcode");
    var deferral = require('q').defer();

    /**
     * Recursively search for file with the tiven filter starting on startPath
     */
    function searchRecursiveFromPath(startPath, filter, rec, multiple) {
        if (!fs.existsSync(startPath)) {
            console.log("no dir ", startPath);
            return;
        }

        var files = fs.readdirSync(startPath);
        var resultFiles = []
        for (var i = 0; i < files.length; i++) {
            var filename = path.join(startPath, files[i]);
            var stat = fs.lstatSync(filename);
            if (stat.isDirectory() && rec) {
                fromDir(filename, filter); //recurse
            }

            if (filename.indexOf(filter) >= 0) {
                if (multiple) {
                    resultFiles.push(filename);
                } else {
                    return filename;
                }
            }
        }
        if (multiple) {
            return resultFiles;
        }
    }

    /**
     * find a PBXFileReference on the provided project by its name
     */
    function findPbxFileReference(project, pbxFileName) {
        for (var uuid in project.hash.project.objects.PBXFileReference) {
            if (uuid.endsWith("_comment")) {
                continue;
            }
            var file = project.hash.project.objects.PBXFileReference[uuid];

            if (file.name !== undefined && file.name.indexOf(pbxFileName) != -1) {
                return file;
            }
        }
    }

    if (process.length >= 5 && process.argv[1].indexOf('cordova') == -1) {
        if (process.argv[4] != 'ios') {
            return; // plugin only meant to work for ios platform.
        }
    }

    var xcodeProjPath = searchRecursiveFromPath('platforms/ios', '.xcodeproj', false);
    var projectPath = xcodeProjPath + '/project.pbxproj';
    console.log("Found", projectPath);

    var proj = xcode.project(projectPath);
    proj.parseSync();



    var frameworkPbxFileRef = findPbxFileReference(proj, frameworkName);
    // Clean extra " on the start and end of the string
    var frameworkPbxFileRefPath = frameworkPbxFileRef.path;
    if (frameworkPbxFileRefPath.endsWith("\"")) {
        frameworkPbxFileRefPath = frameworkPbxFileRefPath.substring(0, frameworkPbxFileRefPath.length - 1);
    }
    if (frameworkPbxFileRefPath.startsWith("\"")) {
        frameworkPbxFileRefPath = frameworkPbxFileRefPath.substring(1, frameworkPbxFileRefPath.length);
    }

    // Add the build phase if it doesnt exist
    if (proj.pbxEmbedFrameworksBuildPhaseObj(proj.getFirstTarget().uuid) == undefined) {
        console.log("BuildPhase not found in XCode project. Adding PBXCopyFilesBuildPhase - Embed Frameworks");
        proj.addBuildPhase([], 'PBXCopyFilesBuildPhase', "Embed Frameworks", proj.getFirstTarget().uuid, 'frameworks');
    }

    // Remove framework
    var removedPbxFile = proj.removeFramework(frameworkPbxFileRefPath, {
        customFramework: true
    });
    // Add the framework but embed
    var addedPbxFile = proj.addFramework(frameworkPbxFileRefPath, {
        customFramework: true,
        embed: true,
        sign: true
    });


    fs.writeFile(proj.filepath, proj.writeSync(), 'utf8', function (err) {
        if (err) {
            deferral.reject(err);
            return;
        }
        console.log("Wrote xcodeproj");
        deferral.resolve();
    });

    return deferral.promise;
};
