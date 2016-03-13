var Action = require("./base_action.js"),
    inherits = require('util').inherits;

function PingPong(gervin) {
    Action.call(this, gervin);
}

inherits(PingPong, Action);

PingPong.prototype.name = "Ping Pong";

PingPong.prototype.on_message_matcher = function(gervin, msg) {
    return msg.content.match(/^gervin\s+ping\s*$/i);
}

PingPong.prototype.on_message = function(gervin, msg) {
    gervin.sendMessage(msg.channel, "pong");
}

module.exports = PingPong
