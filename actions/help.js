var SlashAction = require("./slashAction.js"),
    inherits = require('util').inherits;

function Help(gervin) {
    SlashAction.call(this, gervin);
}

inherits(Help, SlashAction);

Help.prototype.name = "Help";
Help.prototype.commandId = "help";

Help.prototype.help = "/help [filter]" +
    " gets help for all commands," + 
    " optionally adding filter to the command names";

Help.prototype.getHelp = function(action) {
    return "__**" + action.name + "**__\n" + action.help;
}

Help.prototype.sendHelp = function(gervin, msg, actions) {
    var self = this;
    output = "";
    if (!actions.length) {
        gervin.pmAndDelete(msg, "No help found for \"" + msg.cleanContent + "\"");
    } else {
        for (var i = 0; i < actions.length; i++) {
            action = actions[i];
            if (i > 0) 
                output += "\n\n"
            output += self.getHelp(action);
        }
        gervin.pmAndDelete(msg, output);
    }
}

Help.prototype.onMessage = function(gervin, msg) {
    var self = this;

    if (self.arguments.length) {
        rawProposedAction = self.arguments.join("").trim();
        proposedAction = new RegExp(rawProposedAction, 'i');
        filteredActions = gervin.actions.filter(function(action) {
            return action.name.match(proposedAction);
        });
        self.sendHelp(gervin, msg, filteredActions);
    } else {
        self.sendHelp(gervin, msg, gervin.actions);
    }
}

module.exports = Help
