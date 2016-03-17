var Discord = require("discord.js"),
    sqlite3 = require('sqlite3').verbose();

var AuthDetails = require("./auth.json"),
    EnabledActions = require("./actions/enabledActions.json"),
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

function buildEnabledActions() {
    gervin.actions = [];
    console.log("Loading enabled actions... " + EnabledActions);
    for (var i = 0; i < EnabledActions.length; i++) {
        actionFileName = EnabledActions[i] + ".js";
        try {
            console.log("Loading " + actionFileName + "...");
            Action = require("./actions/" + actionFileName);
            newAction = new Action(gervin);
            gervin.actions.push(newAction);
            console.log("Loaded " + actionFileName);
        } catch (e) {
            console.log("ERROR: Failed loading " + actionFileName + ": ");
            console.log(e);
        }
    }
}

extendGervin();
buildEnabledActions();

gervin.on("ready", function () {
    console.log("Ready!");
});

gervin.on("disconnected", function () {
    console.log("Disconnected!");
    process.exit(1);
});

gervin.login(AuthDetails.email, AuthDetails.password);
