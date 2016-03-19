var Discord = require("discord.js"),
    sqlite3 = require('sqlite3').verbose();

var AuthDetails = require("./auth.json"),
    ActionConfig = require("./actions/config.json"),
    GervinHelpers = require("./gervinHelpers.js");

var gervin = new Discord.Client();

function extendGervin() {
    var keys = Object.keys(GervinHelpers);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        gervin[key] = GervinHelpers[key];
    }
    gervin.db = new sqlite3.Database(AuthDetails.dbName);
}

function buildActions() {
    gervin.actions = [];
    var actionNames = Object.keys(ActionConfig);
    for (var i = 0; i < actionNames.length; i++) {
        var actionName = actionNames[i];
        var actionConfig = ActionConfig[actionName];
        var actionFileName = actionName + ".js";
        if (actionConfig.enabled) {
            try {
                console.log("Loading " + actionFileName + "...");
                Action = require("./actions/" + actionFileName);
                newAction = new Action(gervin, actionConfig);
                gervin.actions.push(newAction);
                console.log("Loaded " + actionFileName);
            } catch (e) {
                console.log("ERROR: Failed loading " + actionFileName + ": ");
                console.log(e);
            }
        } else {
            console.log(actionName + " is not enabled, not loading");
        }
    }
}

extendGervin();
buildActions();

gervin.on("ready", function () {
    console.log("Ready!");
    gervin.joinServersGeneralVoiceChannel(AuthDetails.enabledVoiceChannel);
});

gervin.on("disconnected", function () {
    console.log("Disconnected!");
    process.exit(1);
});

gervin.login(AuthDetails.email, AuthDetails.password);
