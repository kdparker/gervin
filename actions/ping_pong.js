var Action = require("./base_action.js"),
    inherits = require('util').inherits;

function PingPong(gervin) {
    Action.call(this, gervin);
}

inherits(PingPong, Action);

PingPong.prototype.name = "Ping Pong";

PingPong.prototype.help = "Pings your pongs";

PingPong.prototype.on_message_matcher = function(gervin, msg) {
    return msg.content.match(/ping/i);
}

PingPong.prototype.on_message = function(gervin, msg) {
    gervin.sendMessage(msg.channel, "pong");
}

module.exports = PingPong
