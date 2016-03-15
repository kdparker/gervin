var Action = require("./baseAction.js"),
    inherits = require('util').inherits;

function PingPong(gervin) {
    Action.call(this, gervin);
}

inherits(PingPong, Action);

PingPong.prototype.name = "Ping Pong";

PingPong.prototype.help = "Pings your pongs";

PingPong.prototype.onMessageMatcher = function(gervin, msg) {
    return msg.content.match(/(\s|^)ping(\s|$)/i);
}

PingPong.prototype.onMessage = function(gervin, msg) {
    gervin.sendMessage(msg.channel, "pong");
}

module.exports = PingPong
