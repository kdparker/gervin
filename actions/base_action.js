function Action(gervin) {
    var self = this
    gervin.on("message", function(msg) {
        try {
            if (
                msg.sender.id != gervin.user.id &&
                self.on_message_matcher(gervin, msg)
            ) {
                console.log("Running action: " + self.name)
                self.on_message(gervin, msg);
            }
        } catch (e) {
            console.log("Error occured processing message action: " + self.name)
            console.log(e)
        }
    });

    if (self.on_ready) {
        gervin.on("ready", function() {
            try {
                self.on_ready(gervin);
            } catch(e) {
                console.log("Error occured processing ready action: " + self.name)
                console.log(e)
            }
        });
    }

    if (self.on_presence) {
        gervin.on("presence", function(old_user, new_user) {
            try {
                self.on_presence(gervin, old_user, new_user);
            } catch(e) {
                console.log("Error occured processing presence action: " + self.name)
                console.log(e)
            }
        });
    }
}

Action.prototype.name = "Unnamed Action";

Action.prototype.on_message_matcher = function(gervin, msg) {
    return false;
}

Action.prototype.on_message = function (gervin, msg) {
    throw "Undefined message behavior for " + this.name;
}
Action.prototype.on_ready = null;
Action.prototype.on_presence = null;
Action.prototype.help = "No help defined";

module.exports = Action
