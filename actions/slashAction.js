var Action = require("./baseAction.js"),
    inherits = require('util').inherits;

function SlashAction(gervin, require_args, arg_regex_string) {
    require_args = require_args || false;
    arg_regex_string = arg_regex_string || "(\\s+[^\\s].*)";
    Action.call(this, gervin);
    var self = this;
    var commandRegexString = "^/" + 
        self.commandId + 
        arg_regex_string;
    if (!require_args)
        commandRegexString += "?";
    self.commandRegex = new RegExp(
        commandRegexString,
        'i'
    );
}

inherits(SlashAction, Action)

SlashAction.prototype.onMessageMatcher = function(gervin, msg) {
    var self = this;
    var match = msg.content.match(self.commandRegex);
    if (!match)
        return false;
    self.arguments = [];
    for (var i = 1; i < match.length; i++) {
        if (match[i]) {
            var newArguments = match[1].trim().split(/\s+/)
                .map(function(arg) {
                    return arg.trim()
                });
            self.arguments = self.arguments.concat(newArguments);
        }
    }
    return true;
}

module.exports = SlashAction
