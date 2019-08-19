'use strict';

const path = require('path');
const fs = require('fs');
const exec = require('child_process').exec;

const deployCli = function(args, options) {
    let params = '';
    let index = 0;

    for (const value in options) {
        if (options.hasOwnProperty(value)) {
            // Check if the option passed from user
            const key = options[value];
            if (key === true) {
                let argValue = args[index];
                if ("source" === value) {
                    argValue = processSource(argValue);
                }
                let param = `-${value}:${argValue}`;
                params += ` ${param}`;
                index++;
            }
        }
    }

    return runMSDeploy(params);
};

const deploy = function(options) {
    let params = '';
    let index = 0;

    for (const key in options) {
        if (options.hasOwnProperty(key)) {
            // Check if the option passed from user
            let argValue = options[key];
            if ("source" === key) {
                argValue = processSource(argValue);
            }
            let param = `-${key}:${argValue}`;
            params += ` ${param}`;
            index++;
        }
    }
    return runMSDeploy(params);
};

/**
 * Provide better source behaviour. Let MSDeploy work with relative content paths!
 */
function processSource(source) {
    if (typeof (source) === "undefined" || source.indexOf("contentPath=") !== 0) {
        return source;
    }
    let sourcePath = source.replace("contentPath=", "");
    if (path.isAbsolute(sourcePath)) {
        return source;
    }
    sourcePath = path.resolve(sourcePath);
    return `contentPath="${sourcePath}"`;
}

/*
 * Get MS deploy path
 * Solution from: 
 * https://github.com/mrjackdavis/grunt-msdeploy/blob/master/tasks/msdeploy.js
*/
function getExePath() {
    if (!process.env.ProgramFiles || !process.env["ProgramFiles(x86)"]) {
        throw new Error("This script is only available on Windows environment.");
    }

    const relativeMsDeployPath = "IIS/Microsoft Web Deploy V3/msdeploy.exe";
    const path64 = path.join(process.env.ProgramFiles, relativeMsDeployPath);
    const path32 = path.join(process.env["ProgramFiles(x86)"], relativeMsDeployPath);
    let msDeploy64Path, msDeploy32Path;

    if (path64 != null) {
        msDeploy64Path = path.resolve(path.join(process.env.ProgramFiles, relativeMsDeployPath));
        if (fs.existsSync(msDeploy64Path)) {
            return `"${msDeploy64Path}"`;
        }
    }

    if (path32 != null) {
        msDeploy32Path = path.resolve(path.join(process.env["ProgramFiles(x86)"], relativeMsDeployPath));
        if (fs.existsSync(msDeploy32Path)) {
            return `"${msDeploy32Path}"`;
        }
    }

    throw new Error(`MSDeploy doesn't seem to be installed. Could not find msdeploy in "${msDeploy64Path}" or "${msDeploy32Path}". You can install it from http://www.iis.net/downloads/microsoft/web-deploy`);
}

/*
 * Run MSdeploy with params
*/
function runMSDeploy(params) {
    return new Promise(((resolve, reject) => {
        params = params || '';
        const msDeployPath = `${getExePath()}`;
        exec(`${msDeployPath} ${params}`, (error, stdout, stderr) => {
            console.log('stdout:', stdout);
            console.log('stderr:', stderr);
            if (error) {
                console.error(`exec error: ${error}`);
                reject(error);
                throw new Error('msdeploy.exe error. Incorrect params.');
            } else {
                resolve();
            }
        });
    }))
}

module.exports.deployCli = deployCli;
module.exports.deploy = deploy;
