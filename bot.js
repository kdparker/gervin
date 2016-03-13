var Discord = require("discord.js");

var MessageResponse = require("./message_response.js");

var AuthDetails = require("./auth.json");

var gervin = new Discord.Client();

gervin.on("ready", function () {
    console.log("Ready!");
});

gervin.on("disconnected", function () {
    console.log("Disconnected!");
    process.exit(1);
});

gervin.on("message", function (msg) {
    MessageResponse(gervin, msg);
});

gervin.login(AuthDetails.email, AuthDetails.password);
