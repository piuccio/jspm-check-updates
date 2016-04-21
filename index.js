var path = require('path');
var fs = require('fs');
var mapLimit = require('async/mapLimit');
var fetchVersionFromNpm = require('./lib/npm');
var fetchVersionFromGithub = require('./lib/github');
var semver = require('semver');
var Table = require('cli-table');

Promise.resolve({})
.then(findPackageJson)
.then(extractDependencies)
.then(fetchUpdates)
.then(filterUpdates)
.then(formatOutput)
.then(log)
.catch(error);

function log (message) {
	console.log(message);
}
function info (message) {
	console.log(message);
}
function error (message) {
	console.error(message);
}

function findPackageJson (model) {
	info('Reading package json');
	var packFile = path.relative(process.cwd(), 'package.json');
	try {
		var content = fs.readFileSync(packFile);
		var json = JSON.parse(content.toString());
		model.packJson = json;
	} catch (ex) {
		return Promise.reject(new Error('Cannot find package.json at path \'' + packFile + '\' '));
	}
	return model;
}

function extractDependencies (model) {
	if (model.packJson.jspm) {
		model.toFetch = {};
		['dependencies', 'devDependencies', 'peerDependencies'].forEach(function (type) {
			var deps = model.packJson.jspm[type];
			iterate(deps, function (name, version) {
				if (!model.toFetch[name]) {
					model.toFetch[name] = createFetchAction(name, version, type);
				}
			});
		});
	} else {
		return Promise.reject(new Error('package.json does not scope jspm dependencies, bailing out'));
	}
	return model;
}

function fetchUpdates (model) {
	info('Fetching update info for ' + Object.keys(model.toFetch).length + ' packages');
	return new Promise(function (resolve, reject) {
		mapLimit(model.toFetch, 6, fetchVersionInfo, function (err, results) {
			if (err) {
				reject(err);
			} else {
				model.modules = results;
				resolve(model);
			}
		});
	});
}

function filterUpdates (model) {
	var updates = [];
	iterate(model.modules, function (name, module) {
		var maxSatisfy = semver.maxSatisfying(module.versions, module.semver);
		var max = semver.gt(module.latest, maxSatisfy) ? module.latest : maxSatisfy;

		if (module.semver.indexOf(max) === -1) {
			updates.push(Object.assign({
				maxSafe: maxSatisfy,
				max: max
			}, module));
		}
	});
	model.updates = updates;
	return model;
}

function formatOutput (model) {
	if (model.updates.length === 0) {
		return 'Everything is up to date.';
	} else {
		var table = new Table({
			head: ['Module', 'Installed', 'Inside range', 'Outside range']
		});
		model.updates.forEach(function (module) {
			table.push([
				module.name, 
				module.semver, 
				module.maxSafe !== module.semver ? module.maxSafe : '', 
				module.max !== module.maxSafe ? module.max : ''
			]);
		});
		return table.toString();
	}
}

function iterate (object, action) {
	if (object) {
		Object.keys(object).forEach(function (key) {
			if (object[key]) {
				action(key, object[key]);
			}
		});
	}
}

var fetchActions = {
	npm: fetchVersionFromNpm,
	github: fetchVersionFromGithub
};

function createFetchAction (name, version, type) {
	var pack = getPackage(version);
	return (fetchActions[pack.registry] || function () {
		error('Unknown registry \'' + pack.registry + '\', skipping \'' + name + '\' : \'' + version + '\'');
	}).bind(null, name, pack, type);
}

function getPackage (string) {
	var registry = string.indexOf(':') !== -1 ? string.split(':')[0] : '';
	var pkg = registry ? string.substring(registry.length + 1) : string;
	var versionIndex = pkg.lastIndexOf('@');
	var version = versionIndex !== -1 ? pkg.substring(versionIndex + 1) : '';
	var name = versionIndex !== -1 ? pkg.substring(0, versionIndex) : pkg;

	return {
		name: name,
		version: version,
		registry: registry
	};
}

function fetchVersionInfo (fn, callback) {
	Promise.resolve()
	.then(function () {
		return fn();
	})
	.then(function (result) {
		callback(null, result);
	})
	.catch(function (ex) {
		error(ex);
		callback(null);
	});
}
