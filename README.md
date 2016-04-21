Check if your JSPM dependencies are outdated.

### Install

```
npm install -g jspm-check-updates
```

### Usage

```
cd /your-project
jspm-check-updates
```

The output looks like this

![Console output](/screenshots/output.png)

* `Inside range` is the highest available version that matches the range in your package.json
* `Outside range` is the latest version for that package.

This tool ignores all GitHub tags that are not [semver](http://semver.org/).

### GitHub API rate limits

GitHub is very strict about rate limits, something like 60 requests an hour. If you get rate limited you can set `GITHUB_TOKEN` or `JSPM_GITHUB_AUTH_TOKEN` with a [GitHub personal access token](https://github.com/settings/tokens).

### Warning

There are several great modules to check your npm dependencies, but none of them supports JSPM.
I could have a made a PR to any of those projects but I'm lazy and I don't want to understand someone else code.

This is the quickest and dirtiest tool that does the job. It works on my machine for the projects I care about. If you have any issue or want some new cool feature, submit a PR, I probably won't spend much time on this.

### License

MIT
