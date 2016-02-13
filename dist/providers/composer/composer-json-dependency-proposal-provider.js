var matchers_1 = require('../../matchers');
var lodash_1 = require('lodash');
var _a = require('packagist-package-lookup'), searchByName = _a.searchByName, versions = _a.versions;
var DEPENDENCY_PROPERTIES = ['require', 'require-dev'];
var STABLE_VERSION_REGEX = /^(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)$/;
var KEY_MATCHER = matchers_1.request().key().path(matchers_1.path().key(DEPENDENCY_PROPERTIES));
var VALUE_MATCHER = matchers_1.request().value().path(matchers_1.path().key(DEPENDENCY_PROPERTIES).key());
function createPackageNameProposal(p, request) {
    var isBetweenQuotes = request.isBetweenQuotes, shouldAddComma = request.shouldAddComma;
    var proposal = {};
    proposal.displayText = p.name;
    proposal.description = p.description;
    proposal.rightLabel = 'dependency';
    proposal.type = 'property';
    if (isBetweenQuotes) {
        proposal.text = p.name;
    }
    else {
        proposal.snippet = '"' + p.name + '": "$1"' + (shouldAddComma ? ',' : '');
    }
    return proposal;
}
function getUsedKeys(request) {
    var contents = request.contents;
    var safeContents = contents || {};
    return lodash_1.flatten(DEPENDENCY_PROPERTIES
        .map(function (property) { return safeContents[property] || {}; })
        .map(function (object) { return Object.keys(object); }));
}
function createVersionProposal(version, request) {
    var isBetweenQuotes = request.isBetweenQuotes, shouldAddComma = request.shouldAddComma, token = request.token;
    var proposal = {};
    proposal.displayText = version;
    proposal.rightLabel = 'version';
    proposal.type = 'value';
    proposal.replacementPrefix = lodash_1.trim(token, '"');
    if (isBetweenQuotes) {
        proposal.text = version;
    }
    else {
        proposal.snippet = '"' + version + '"' + (shouldAddComma ? ',' : '');
    }
    return proposal;
}
function isStableVersion(version) {
    return STABLE_VERSION_REGEX.test(version);
}
var PackageJsonDependencyProposalProvider = (function () {
    function PackageJsonDependencyProposalProvider() {
    }
    PackageJsonDependencyProposalProvider.prototype.getProposals = function (request) {
        var segments = request.segments, isKeyPosition = request.isKeyPosition, isValuePosition = request.isValuePosition;
        if (KEY_MATCHER.matches(request)) {
            return this.getDependencyKeysProposals(request);
        }
        if (VALUE_MATCHER.matches(request)) {
            return this.getDependencyVersionsProposals(request);
        }
        return Promise.resolve([]);
    };
    PackageJsonDependencyProposalProvider.prototype.transformPackages = function (packages, request) {
        var usedKeys = getUsedKeys(request);
        return packages
            .filter(function (p) { return !lodash_1.includes(usedKeys, p.name); })
            .map(function (p) { return createPackageNameProposal(p, request); });
    };
    PackageJsonDependencyProposalProvider.prototype.getDependencyKeysProposals = function (request) {
        var _this = this;
        var prefix = request.prefix;
        return searchByName(prefix).then(function (packageNames) { return _this.transformPackages(packageNames, request); });
    };
    PackageJsonDependencyProposalProvider.prototype.transformPackageVersions = function (packageVersions, request) {
        var token = request.token;
        var trimmedToken = lodash_1.trim(token, '"');
        return packageVersions
            .filter(function (version) { return isStableVersion(version); })
            .filter(function (version) { return lodash_1.startsWith(version, trimmedToken); })
            .map(function (version) { return createVersionProposal(version, request); });
    };
    PackageJsonDependencyProposalProvider.prototype.getDependencyVersionsProposals = function (request) {
        var _this = this;
        var segments = request.segments, token = request.token;
        var packageName = segments[1], rest = segments.slice(2);
        return versions(packageName.toString())
            .then(function (packageVersions) { return _this.transformPackageVersions(packageVersions, request); });
    };
    PackageJsonDependencyProposalProvider.prototype.getFilePattern = function () {
        return 'composer.json';
    };
    return PackageJsonDependencyProposalProvider;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PackageJsonDependencyProposalProvider;
