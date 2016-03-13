var Action = require("./base_action.js"),
    inherits = require('util').inherits;

function PingPong() {
    Action.call(this);
    this.name = "PingPong"
}

inherits(PingPong, Action)

PingPong.prototype.does_match = function(gervin, msg) {
    return msg.content.match(/^gervin\s+ping\s*$/i);
}

PingPong.prototype.run = function(gervin, msg) {
    gervin.sendMessage(msg.channel, "pong");
}

module.exports = new PingPong()
