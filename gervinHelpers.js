module.exports.pm = function (msg, content) {
    var self = this;
    self.sendMessage(msg.sender, content)
        .catch(function(err) {
            self.reply(
                msg,
                "Private Message failed to send! " +
                "Please try again after initiating a PMChannel with me"
            )
        }); 
};
    
module.exports.replyAndDelete = function(msg, content) {
    var self = this;
    self.reply(msg, content);
    self.deleteMessage(msg);
};

module.exports.pmAndDelete = function(msg, content) {
    var self = this;
    self.pm(msg, content);
    self.deleteMessage(msg);
};

module.exports.getTestFieldChannel = function () {
    var self = this;
    for (var i = 0; i < self.channels.length; i++) {
        var channel = self.channels[i];
        if (channel.server.name === "Gervin Testfield" && channel.type == "text") 
            return channel
    }
}

module.exports.getAllGeneralTextChannels = function (whitelistedServers) {
    var self = this;
    whitelistedServers = whitelistedServers || [];
    var whitelistedServerRegex = /.*/i;
    if (whitelistedServers) {
        whitelistedServerRegex = new RegExp(
            "(" + whitelistedServers.join('|') + ")", 
            'i'
        );
    }
    return self.channels.filter(function(channel) {
        return (
            !channel.isPrivate && 
            channel.type == "text" && 
            channel.name.match(/general/i) &&
            channel.server.name.match(whitelistedServerRegex)
        )
    });
}
