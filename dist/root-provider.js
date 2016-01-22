var minimatch = require('minimatch');
var _ = require('lodash');
var tokenizer_1 = require('./tokenizer');
var structure_provider_1 = require('./structure-provider');
var RootProvider = (function () {
    function RootProvider(providers) {
        if (providers === void 0) { providers = []; }
        this.providers = providers;
        this.selector = '.source.json';
        this.inclusionPriority = 1;
    }
    RootProvider.prototype.getSuggestions = function (_a) {
        var _this = this;
        var editor = _a.editor, bufferPosition = _a.bufferPosition, activatedManually = _a.activatedManually, prefix = _a.prefix;
        if (editor.lineTextForBufferRow(bufferPosition.row).charAt(bufferPosition.column - 1) === ',' && !activatedManually) {
            return Promise.resolve([]);
        }
        var providers = this.getMatchingProviders(editor.buffer.file.getBaseName());
        if (providers.length === 0) {
            return Promise.resolve([]);
        }
        return tokenizer_1.tokenize(editor.getText())
            .then(function (tokens) { return structure_provider_1.provideStructure(tokens, bufferPosition); })
            .then(function (structure) {
            var request = _this.buildRequest(structure, prefix);
            return Promise.all(providers.map(function (provider) { return provider.getProposals(request); }))
                .then(function (proposals) { return Array.prototype.concat.apply([], proposals); });
        });
    };
    RootProvider.prototype.buildRequest = function (structure, prefix) {
        var contents = structure.contents, positionInfo = structure.positionInfo, tokens = structure.tokens;
        var shouldAddComma = function (info) {
            if (!info || !info.nextToken || !tokens || tokens.length === 0) {
                return false;
            }
            if (info.nextToken && _.includes([tokenizer_1.TokenType.END_ARRAY, tokenizer_1.TokenType.END_OBJECT], info.nextToken.type)) {
                return false;
            }
            return !(info.nextToken && _.includes([tokenizer_1.TokenType.END_ARRAY, tokenizer_1.TokenType.END_OBJECT], info.nextToken.type)) && info.nextToken.type !== tokenizer_1.TokenType.COMMA;
        };
        return {
            contents: contents,
            prefix: prefix,
            segments: positionInfo ? positionInfo.segments : null,
            token: positionInfo ? (positionInfo.editedToken) ? positionInfo.editedToken.src : null : null,
            isKeyPosition: !!(positionInfo && positionInfo.keyPosition),
            isValuePosition: !!(positionInfo && positionInfo.valuePosition),
            isBetweenQuotes: !!(positionInfo && positionInfo.editedToken && positionInfo.editedToken.type === tokenizer_1.TokenType.STRING),
            shouldAddComma: !!shouldAddComma(positionInfo),
            isFileEmpty: tokens.length === 0
        };
    };
    RootProvider.prototype.getMatchingProviders = function (file) {
        return this.providers.filter(function (p) { return minimatch(file, p.getFilePattern()); });
    };
    RootProvider.prototype.onDidInsertSuggestion = function (request) {
    };
    RootProvider.prototype.dispose = function () {
    };
    return RootProvider;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RootProvider;