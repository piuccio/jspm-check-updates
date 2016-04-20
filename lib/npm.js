var NPM = require('npm');

var loaded = new Promise(function (resolve, reject) {
	try {
		NPM.load({
			silent: true
		}, function (err, npm) {
			if (err) {
				reject(err);
			} else {
				resolve(npm);
			}
		});
	} catch (ex) {
		reject(ex);
	}
});

module.exports = function (name, pack, type) {
	return loaded.then(function (npm) {
		return new Promise(function (resolve, reject) {
			try {
				npm.commands.view([pack.name, 'versions', 'dist-tags.latest'], true, function (err, data) {
					if (err || !data) {
						reject(err);
					} else {
						var info = data[Object.keys(data)[0]];
						if (info) {
							resolve({
								name: name,
								module: pack.name,
								type: type,
								semver: pack.version,
								registry: pack.registry,
								versions: info.versions,
								latest: info['dist-tags.latest']
							});
						} else {
							reject(new Error('Invalid response from npm'));
						}
					}
				});
			} catch (ex) {
				reject(ex);
			}
		});
	});
};
