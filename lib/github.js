var got = require('got');
var semverSort = require('semver-sort');
var semver = require('semver');

module.exports = function (name, pack, type) {
	var token = process.env.GITHUB_TOKEN || process.env.JSPM_GITHUB_AUTH_TOKEN;
	var url = 'https://api.github.com/repos/' + pack.name + '/tags' + (token ?
		'?access_token=' + token :
		''
	);
	return got(url, {json: true})
	.then(function (data) {
		var info = parseResponse(data.body);
		return {
			name: name,
			module: pack.name,
			type: type,
			semver: pack.version,
			registry: pack.registry,
			versions: info.versions,
			latest: info.latest
		};
	});
};

function parseResponse (json) {
	var tagList = [];
	json.forEach(function (tag) {
		if (semver.valid(tag.name)) {
			tagList.push(tag.name);
		}
	});
	var sorted = semverSort.desc(tagList);
	return {
		versions: tagList,
		latest: sorted[0]
	};
}
