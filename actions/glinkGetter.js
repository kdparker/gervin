var Action = require("./baseAction.js"),
    async = require('async'),
    inherits = require('util').inherits;
  
function Getter(gervin, config) {
    // We rely on setter to create the database we use
    Action.call(this, gervin, config);
}
  
inherits(Getter, Action);
  
Getter.prototype.name = "g/ Getter";
 
Getter.prototype.help = "... g/Query ... \n" +
    "Checks to see if there's a g link for Query, and if there is, will add a message with the response";

Getter.prototype.onMessageMatcher = function(gervin, msg) {
    return msg.content.match(/(\s|^)g\/[^\s]/i);
}

Getter.prototype.getOutputForLabel = function(gervin, label, callback) {
    gervin.db.all("SELECT response FROM glink_responses WHERE label = ?", label, function(err, rows) {
        if (err)
            return callback(err)
        if (!rows.length) 
            return callback(null, "")
        return callback(null, "g/" + label + ": " + rows[0].response);
    });
}

Getter.prototype.onMessage = function(gervin, msg) {
    var self = this;

    var labels = msg.content.match(/(\s|^)g\/[^\s]+/ig).map(function(link) {
        return link.match(/(\s|^)g\/([^\s]+)/i)[2];
    });

    output = "";
    async.eachSeries(labels, function(label, callback) {
        self.getOutputForLabel(gervin, label, function(err, outputForLabel) {
            if (err)
                callback(err);
            if (output.length)
                output += "\n";
            output += outputForLabel;
            callback(err);
        });
    }, function(err) {
        if (err) {
            console.log(err);
        }
        if (output.length) {
            gervin.sendMessage(msg.channel, output);
        }
    });
};

module.exports = Getter
