var SlashAction = require("./slashAction.js"),
    inherits = require('util').inherits;

function Soundboard(gervin, config) { 
    SlashAction.call(this, gervin, config, true);
    this.soundNameRegex = new RegExp(
        "(" + Object.keys(this.enabledSounds).join("|") + ")",
        'i'
    );
}

inherits(Soundboard, SlashAction);

Soundboard.prototype.name = "Soundboard";
Soundboard.prototype.commandId = "play"

Soundboard.prototype.help = "/play name\n" +
    "Plays the soundfile named name if possible.\n" +
    "If you want a file thats not here, give the Keegan the mp3";

Soundboard.prototype.onMessage = function(gervin, msg) {
    var self = this; 
    var query = self.arguments.join(" ");

    if (
        query.match(self.soundNameRegex) &&
        gervin.voiceConnection &&
        msg.channel.server.name === gervin.voiceConnection.server.name       
    ) {
        console.log("Playing actions/soundboard/" + self.enabledSounds[query]); 
        gervin.voiceConnection.playFile(
            "actions/soundboard/" + self.enabledSounds[query],
            {"volume": self.volume}
        );
        gervin.replyAndDelete(
            msg,
            "playing " + query
        );
    } else {
        gervin.replyAndDelete(
            msg,
            "sound for: " + query + " could not be played"
        );
    }
}

Soundboard.prototype.onReady = function(gervin) {
    this.help += "\n\nEnabled Sounds:\n" + 
        Object.keys(this.enabledSounds).join(", ");
}

module.exports = Soundboard
