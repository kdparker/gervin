function Action(gervin, config) {
    var self = this;
    var configNames = Object.keys(config);
    for (var i = 0; i < configNames.length; i++) {
        var configName = configNames[i];
        self[configName] = config[configName];
    }
    gervin.on("message", function(msg) {
        try {
            if (
                msg.sender.id != gervin.user.id &&
                self.onMessageMatcher(gervin, msg)
            ) {
                console.log(
                    "Running action: " + self.name + 
                    " from message: " + msg.cleanContent
                )
                self.onMessage(gervin, msg);
            }
        } catch (e) {
            console.log("Error occured processing message action: " + self.name)
            console.log(e)
        }
    });

    if (self.onReady) {
        gervin.on("ready", function() {
            try {
                self.onReady(gervin);
            } catch(e) {
                console.log("Error occured processing ready action: " + self.name)
                console.log(e)
            }
        });
    }

    if (self.onPresence) {
        gervin.on("presence", function(oldUser, newUser) {
            try {
                self.onPresence(gervin, oldUser, newUser);
            } catch(e) {
                console.log("Error occured processing presence action: " + self.name)
                console.log(e)
            }
        });
    }
}

Action.prototype.name = "Unnamed Action";

Action.prototype.onMessageMatcher = function(gervin, msg) {
    return false;
}

Action.prototype.onMessage = function (gervin, msg) {
    throw "Undefined message behavior for " + this.name;
}

Action.prototype.onReady = null;
Action.prototype.onPresence = null;
Action.prototype.help = "No help defined";

module.exports = Action
