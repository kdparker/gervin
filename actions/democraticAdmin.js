var SlashAction = require("./SlashAction.js"),
    util = require("util"),
    inherits = require('util').inherits;

const voteTypes = ["vote-tts"];

function DemoAdmin(gervin, config) {
    SlashAction.call(this, gervin, config, true, "\\s+(start|yes|no)");
    this.votesActive = {};
    this.votesCast = {};
}

inherits(DemoAdmin, SlashAction)

DemoAdmin.prototype.name = "Democratic Admin";
DemoAdmin.prototype.commandId = "(" + voteTypes.join('|') + ")";


DemoAdmin.prototype.help = "Vote types are: " + voteTypes.join(", ") + "\n" +
    "Commands [optional]:\n" +
    "To start a vote - /VOTE\\_TYPE start\n" +
    "To get a vote count - /VOTE\\_TYPE count\n" +
    "To vote - /VOTE\\_TYPE (yes or no)";

DemoAdmin.prototype.onReady = function(gervin, msg) {
    var self = this;
    
    var servers = gervin.channels.filter(
        function(channel) {
            return channel.type === "text"
        }
    ).map(
        function(channel) {
            return channel.server;
        }
    );
    for (var i = 0; i < servers.length; i++) {
        var serverId = servers[i].id;
        if (self.votesActive[serverId])
            continue; // Possible to have duplicate server ids
        self.votesActive[serverId] = {};
        self.votesCast[serverId] = {};
        for (var j = 0; j < voteTypes.length; j++) {
            voteType = voteTypes[j];
            self.votesActive[serverId][voteType] = false;
            self.votesCast[serverId][voteType] = {};
        }
    }
}

DemoAdmin.prototype.updateTts = function(gervin, msg, ttsOn) {
    var self = this;
    const PERM = "sendTTSMessages";
    
    var roles = msg.channel.server.roles;
    for (var i = 0; i < roles.length; i++) {
        var role = roles[i];
        var shouldUpdate = false;
        var newPermissions = Object.keys(role.serialize()).filter(function (permission) {
            return role.hasPermission(permission)
        });
        if (!ttsOn && role.hasPermission(PERM)) {
            console.log("Turning off tts for " + role.name);
            newPermissions.splice(
                newPermissions.indexOf(PERM),
                1
            );
            shouldUpdate = true;
        } else if (ttsOn && !role.hasPermission(PERM)) {
            console.log("Turning on tts for " + role.name);
            newPermissions.push(PERM);
            shouldUpdate = true;
        }
        if (shouldUpdate)
            gervin.updateRole(
                role,
                {"permissions": newPermissions},
                function(err, newRole) {
                    if (err) { 
                        console.log(
                            "Error updating permissions for : " + newRole.name
                        )
                    }
                }
        );
    }
}

DemoAdmin.prototype.endVote = function(gervin, msg, voteType) {
    var self = this;

    
    var serverId = msg.channel.server.id;
   
    // Positive = YES, Negative = NO, 0 = TIE
    var result = self.votesCast[serverId][voteType].yes.length -
        self.votesCast[serverId][voteType].no.length

    if (voteType === "tts") {
        if (result > 0) {
            self.updateTts(gervin, msg, true);
            gervin.sendMessage(
                msg.channel,
                "The votes have been tallied! TTS should turn on very soon"
            );
        } else if (result < 0) {
            self.updateTts(gervin, msg, false);
            gervin.sendMessage(
                msg.channel,
                "The votes have been tallied! The robot voice should shut up very soon"
            );
        } else {
            gervin.sendMessage(
                msg.channel,
                "Vote was a tie, no change will occur"
            )
        }
    }
    self.votesActive[serverId][voteType] = false;
    self.voteCount(gervin, msg, voteType);
}

DemoAdmin.prototype.startVote = function(gervin, msg, voteType) {
    var self = this;

    var serverId = msg.channel.server.id;
    if (!(self.votesActive[serverId][voteType])) {
        self.votesActive[serverId][voteType] = true;
        self.votesCast[serverId][voteType].yes = [];
        self.votesCast[serverId][voteType].no = [];
        // Wait one minute and then run endVote
        setTimeout(function() {
            self.endVote(gervin, msg, voteType);
        }, self.timeToVote);
        if (voteType === "tts") {
            gervin.sendMessage(
                msg.channel,
                "Voting for tts has started! Vote yes to turn/keep tts on, Vote no to turn/keep it off!"
            );
        }
    } else {
        gervin.reply(
            msg, 
            "Voting for " + voteType + " is already active!"
        );
    }
}

DemoAdmin.prototype.voteCount = function(gervin, msg, voteType) {
    var self = this;
    
    var serverId = msg.channel.server.id;
    var active = self.votesActive[serverId][voteType];
    var votesCast = self.votesCast[serverId][voteType];

    if (Object.keys(votesCast).length) {
        var outputMessage = "Vote count for ";
        if (active) {
            outputMessage += "ongoing vote:\n";
        } else {
            outputMessage += "finished vote:\n";
        }

        outputMessage += "YES: " + votesCast.yes.length;
        outputMessage += "\nNO: " + votesCast.no.length;

        gervin.sendMessage(
            msg.channel,
            outputMessage
        );
    } else {
        gervin.sendMessage(
            msg.channel, 
            "No vote record found for " + voteType
        );
    }
}

DemoAdmin.prototype.vote = function(gervin, msg, voteType, vote) {
    var self = this;
    
    var opposite;
    if (vote === "yes") {
        opposite = "no";
    } else {
        opposite = "yes";
    }
    var serverId = msg.channel.server.id;
    var userId = msg.sender.id
    if (self.votesActive[serverId][voteType]) {
        if (self.votesCast[serverId][voteType][vote].indexOf(userId) === -1) {
            self.votesCast[serverId][voteType][vote].push(userId);
            console.log(msg.sender.username + " voted " + vote + " in " + voteType);
        }

        var oppIndex = self.votesCast[serverId][voteType][opposite].indexOf(userId);
        if (oppIndex > -1) {
            self.votesCast[serverId][voteType][opposite].splice(
                oppIndex,
                1
            );
        }
    }
}


DemoAdmin.prototype.onMessage = function(gervin, msg) {
    var self = this;
    
    console.log(self.arguments);
    var voteType = self.arguments[0];
    var voteAction = self.arguments[1];
    
    if (voteAction === "start") {
        self.startVote(gervin, msg, voteType);
    } else if (voteAction === "count") {
        self.voteCount(gervin, msg, voteType);
    } else if (voteAction === "yes" || voteAction === "no") {
        self.vote(gervin, msg, voteType, voteAction);
    } else {
        throw "Unrecognised vote action!"
    }
}

module.exports = DemoAdmin
