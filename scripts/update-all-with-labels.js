var label = require("../lib/label");
var github = require("../lib/github");
var funk = require("../lib/funk");
var q = require("q");

exports.setLabelsOnIssues = setLabelsOnIssues;
function setLabelsOnIssues(state) {
    if (state != "closed") state = "open";
    return github.get("/repos/:owner/:repo/pulls?state=:state", { state: state }).then(function(pull_requests) {
		var output = [];
		var deferred = q.defer();
		function run(pull_requests) {
			var current = pull_requests.shift();
			if (current) {
				label.setLabelsOnIssue(current.number).then(function(data) {
					console.log("#" + current.number, data)
					output.push(data);
					return run(pull_requests);
				}, function(err) {
					return deferred.reject(err);
				});
			} else {
				return deferred.resolve(output);
			}
		}
		return run(pull_requests);
    });
}

if (!process.env.GITHUB_TOKEN) throw new Error("Missing GITHUB_TOKEN ENV var.")

setLabelsOnIssues("open")
	.then(funk.curry(setLabelsOnIssues, "closed"))
	.fail(function(err) { throw err });