var SlashAction = require("./slashAction.js"),
    inherits = require('util').inherits;

function Stop(gervin, config) {
    SlashAction.call(this, gervin, config);
}

inherits(Stop, SlashAction);

Stop.prototype.name = "Stop";
Stop.prototype.commandId = "stop";

Stop.prototype.help = "/stop";

Stop.prototype.onMessage = function(gervin, msg) {
    var self = this;
    if (gervin.voiceConnection && gervin.voiceConnection.playing) {
        gervin.voiceConnection.stopPlaying();
        gervin.replyAndDelete(
            msg,
            "Sound stopped playing"
        )
    }
}

module.exports = Stop
