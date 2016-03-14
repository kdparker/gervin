var Action = require("./base_action.js"),
    util = require("util"),
    inherits = require('util').inherits;

const MATCH_REGEX = /^\s*(gervin\s+)?vote\s+(tts)\s+(start|count|yes|no)/i;
const TIME_TO_VOTE = 30000

function DemoAdmin(gervin) {
    Action.call(this, gervin);
    this.votes_active = {};
    this.votes_cast = {};
}

inherits(DemoAdmin, Action)

DemoAdmin.prototype.name = "Democratic Admin";

DemoAdmin.prototype.on_message_matcher = function(gervin, msg) {
    return (msg.content.match(MATCH_REGEX) && (!msg.channel.isPrivate));
}

DemoAdmin.prototype.on_ready = function(gervin, msg) {
    var self = this;
    var vote_types = ["tts"];
    
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
        var server_id = servers[i].id;
        if (self.votes_active[server_id])
            continue; // Possible to have duplicate server ids
        self.votes_active[server_id] = {};
        self.votes_cast[server_id] = {};
        for (var j = 0; j < vote_types.length; j++) {
            vote_type = vote_types[j];
            self.votes_active[server_id][vote_type] = false;
            self.votes_cast[server_id][vote_type] = {};
        }
    }
}

DemoAdmin.prototype.update_tts = function(gervin, msg, tts_on) {
    var self = this;
    const PERM = "sendTTSMessages";
    
    var roles = msg.channel.server.roles;
    for (var i = 0; i < roles.length; i++) {
        var role = roles[i];
        var should_update = false;
        var new_permissions = Object.keys(role.serialize()).filter(function (permission) {
            return role.hasPermission(permission)
        });
        if (!tts_on && role.hasPermission(PERM)) {
            console.log("Turning off tts for " + role.name);
            new_permissions.splice(
                new_permissions.indexOf(PERM),
                1
            );
            should_update = true;
        } else if (tts_on && !role.hasPermission(PERM)) {
            console.log("Turning on tts for " + role.name);
            new_permissions.push(PERM);
            should_update = true;
        }
        if (should_update)
            gervin.updateRole(
                role,
                {"permissions": new_permissions},
                function(err, new_role) {
                    if (err) { 
                        console.log(
                            "Error updating permissions for : " + new_role.name
                        )
                    }
                }
        );
    }
}

DemoAdmin.prototype.end_vote = function(gervin, msg, vote_type) {
    var self = this;

    
    var server_id = msg.channel.server.id;
   
    // Positive = YES, Negative = NO, 0 = TIE
    var result = self.votes_cast[server_id][vote_type].yes -
        self.votes_cast[server_id][vote_type].no

    if (vote_type === "tts") {
        if (result > 0) {
            self.update_tts(gervin, msg, true);
            gervin.sendMessage(
                msg.channel,
                "The votes have been tallied! TTS should turn on very soon"
            );
        } else if (result < 0) {
            self.update_tts(gervin, msg, false);
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
    self.votes_active[server_id][vote_type] = false;
    self.vote_count(gervin, msg, vote_type);
}

DemoAdmin.prototype.start_vote = function(gervin, msg, vote_type) {
    var self = this;

    var server_id = msg.channel.server.id;
    if (!(self.votes_active[server_id][vote_type])) {
        self.votes_active[server_id][vote_type] = true;
        self.votes_cast[server_id][vote_type].yes = [];
        self.votes_cast[server_id][vote_type].no = [];
        // Wait one minute and then run end_vote
        setTimeout(function() {
            self.end_vote(gervin, msg, vote_type);
        }, TIME_TO_VOTE);
        if (vote_type === "tts") {
            gervin.sendMessage(
                msg.channel,
                "Voting for tts has started! Vote yes to turn/keep tts on, Vote no to turn/keep it off!"
            );
        }
    } else {
        gervin.sendMessage(
            msg.channel, 
            "Voting for " + vote_type + " is already active!"
        );
    }
}

DemoAdmin.prototype.vote_count = function(gervin, msg, vote_type) {
    var self = this;
    
    var server_id = msg.channel.server.id;
    var active = self.votes_active[server_id][vote_type];
    var votes_cast = self.votes_cast[server_id][vote_type];

    if (Object.keys(votes_cast).length) {
        var output_message = "Vote count for ";
        if (active) {
            output_message += "ongoing vote:\n";
        } else {
            output_message += "finished vote:\n";
        }

        output_message += "YES: " + votes_cast.yes.length;
        output_message += "\nNO: " + votes_cast.no.length;

        gervin.sendMessage(
            msg.channel,
            output_message
        );
    } else {
        gervin.sendMessage(
            msg.channel, 
            "No vote record found for " + vote_type
        );
    }
}

DemoAdmin.prototype.vote = function(gervin, msg, vote_type, vote) {
    var self = this;
    
    var opposite;
    if (vote === "yes") {
        opposite = "no";
    } else {
        opposite = "yes";
    }
    var server_id = msg.channel.server.id;
    var user_id = msg.sender.id
    if (self.votes_active[server_id][vote_type]) {
        self.votes_cast[server_id][vote_type][vote].push(user_id);
        var opp_index = self.votes_cast[server_id][vote_type][opposite].indexOf(user_id);
        if (opp_index > -1) {
            self.votes_cast[server_id][vote_type][opposite].splice(
                opp_index,
                1
            );
        }
    }
}


DemoAdmin.prototype.on_message = function(gervin, msg) {
    var self = this;
    var split_sections = msg.content.match(MATCH_REGEX);

    var vote_type = split_sections[2];
    var vote_action = split_sections[3];
    
    if (vote_action === "start") {
        self.start_vote(gervin, msg, vote_type);
    } else if (vote_action === "count") {
        self.vote_count(gervin, msg, vote_type);
    } else if (vote_action === "yes" || vote_action === "no") {
        self.vote(gervin, msg, vote_type, vote_action);
    } else {
        throw "Unrecognised vote action!"
    }
}

module.exports = DemoAdmin
