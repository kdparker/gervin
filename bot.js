var Discord = require("discord.js");

var AuthDetails = require("./auth.json"),
    EnabledActions = require("./actions/enabled_actions.json");

var gervin = new Discord.Client();

function build_enabled_actions() {
    console.log("Loading enabled actions... " + EnabledActions);
    for (var i = 0; i < EnabledActions.length; i++) {
        action_file_name = EnabledActions[i] + ".js";
        try {
            console.log("Loading " + action_file_name + "...");
            Action = require("./actions/" + action_file_name);
            new_action = new Action(gervin);
            console.log("Loaded " + action_file_name);
        } catch (e) {
            console.log("ERROR: Failed loading " + action_file_name + ": ");
            console.log(e);
        }
    }
}

build_enabled_actions();

gervin.on("ready", function () {
    console.log("Ready!");
});

gervin.on("disconnected", function () {
    console.log("Disconnected!");
    process.exit(1);
});

gervin.login(AuthDetails.email, AuthDetails.password);
