var SlashAction = require("./slashAction.js"),
    async = require('async'),
    inherits = require('util').inherits;
  
function Setter(gervin, config) {
    SlashAction.call(this, gervin, config, true);

    var db = gervin.db;
    console.log("Waiting for db initialization for Setter..."); 
    db.serialize(function () {
        db.run(
            "CREATE TABLE IF NOT EXISTS glink_responses (" + 
                "id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, " + 
                "label TEXT NOT NULL, " +
                "response TEXT NOT NULL" +
            ")"
        );
    });
}
  
inherits(Setter, SlashAction);
  
Setter.prototype.name = "g/ Setter";
Setter.prototype.commandId = "set";
 
Setter.prototype.help = "/set QUERY1 QUERY2\n" +
    "Assigns QUERY1 to QUERY2 (i.e. if g/QUERY1 is said in any message gervin will" +
    " reply with QUERY2 (case-insensitive).\n" +
    "Note: QUERY2 may contain spaces, but QUERY1 cannot";

Setter.prototype.onMessage = function(gervin, msg) {
    var self = this;
    if (self.arguments.length < 2) {
        gervin.replyAndDelete(
            msg,
            "please include two queries to set a label"
        );
        return;
    }
    var label = self.arguments[0].toLowerCase();
    var response = self.arguments.slice(1).join(" ");
    gervin.db.serialize(function() {
        gervin.db.run(
            "INSERT OR REPLACE INTO glink_responses (id, label, response) VALUES (" +
            "(SELECT id FROM glink_responses WHERE label = ?), " + 
            "?, " +
            "?)",
            label, label, 
            response, 
            function(err) {
                if (err) 
                    console.log(err);
                return err;
            }
        );  
        gervin.replyAndDelete(
            msg,
            "g/" + label + " is now set to " + response
        );
    });
};

module.exports = Setter
