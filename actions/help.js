var Action = require("./base_action.js"),
    inherits = require('util').inherits;

function Help(gervin) {
    Action.call(this, gervin);
}

inherits(Help, Action);

Help.prototype.name = "Help";

Help.prototype.help = "gervin help [filter] gets help for all commands," + 
    " optionally adding filter to the command names";

Help.prototype.on_message_matcher = function(gervin, msg) {
    return msg.content.match(/^\s*gervin\s+help/i);
}

Help.prototype.get_help = function(action) {
    return action.name + "\n" + action.help;
}

Help.prototype.send_help = function(gervin, msg, actions) {
    var self = this;
    output = "";
    for (var i = 0; i < actions.length; i++) {
        action = actions[i];
        if (i > 0) 
            output += "\n\n"
        output += self.get_help(action);
    }
    gervin.sendMessage(msg.author, output).catch(function(err) {
        output += "\n\nPlease open a PM channel with me so that I can PM you next time you need help";
        gervin.sendMessage(msg.channel, output);
    });
    gervin.deleteMessage(msg);
}

Help.prototype.on_message = function(gervin, msg) {
    var self = this;

    match = msg.content.match(/^\s*gervin\s+help\s+([^\s].*)/i);
    if (match) {
        raw_proposed_action = match[1].trim();
        proposed_action = new RegExp(raw_proposed_action, 'i');
        filtered_actions = gervin.actions.filter(function(action) {
            return action.name.match(proposed_action);
        });
        if (filtered_actions.length) {
            self.send_help(gervin, msg, filtered_actions);
        } else {
            gervin.sendMessage(msg.channel, "No help found for " + raw_proposed_action);
        }
    } else {
        self.send_help(gervin, msg, gervin.actions);
    }
}

module.exports = Help
