var SlashAction = require("./slashAction.js"),
    googleimages = require("google-images"),
    AuthDetails = require("../auth.json"),
    inherits = require('util').inherits;

function ImageMe(gervin) {
    this.client = googleimages(AuthDetails.cseId, AuthDetails.cseApiKey);
    SlashAction.call(this, gervin, true);
}

inherits(ImageMe, SlashAction)

ImageMe.prototype.name = "Image Me";
ImageMe.prototype.commandId = "image";

ImageMe.prototype.help = "/image XYZ\n" +
    "Searches Google image search for XYZ and grabs a random image url" +
    "from the first page of that search.";

ImageMe.prototype.onMessage = function(gervin, msg) {
    var term = this.arguments.join(" ");
    this.client.search(term)
        .then(function(images) {
            try {
                index = Math.floor(Math.random() * images.length);
                url = images[index].url;
                outputMessage = " you asked to image " + term + ": " + url;
                gervin.replyAndDelete(msg, outputMessage);
            } catch (e) {
                console.log("Error in result parsing: " + e);
            }
        });
}

module.exports = ImageMe
