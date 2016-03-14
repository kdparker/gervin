var Action = require("./base_action.js"),
    googleimages = require("google-images"),
    AuthDetails = require("../auth.json"),
    inherits = require('util').inherits;

function ImageMe(gervin) {
    this.client = googleimages(AuthDetails.cse_id, AuthDetails.cse_api_key);
    Action.call(this, gervin);
}

inherits(ImageMe, Action)

ImageMe.prototype.name = "Image Me";

ImageMe.prototype.help = "gervin image me XYZ\n" +
    "Searches Google image search for XYZ and grabs a random image url" +
    "from the first page of that search.";

ImageMe.prototype.on_message_matcher = function(gervin, msg) {
    return msg.content.match(/image\s+me\s+[^\s]/i);
}

ImageMe.prototype.on_message = function(gervin, msg) {
    term = msg.content.match(/image\s+me\s+([^\s].*)/i)[1];
    this.client.search(term)
        .then(function(images) {
            try {
                index = Math.floor(Math.random() * images.length);
                url = images[index].url;
                output_message = msg.sender + 
                    " you asked to image " + term + ": " + url;
                gervin.sendMessage(msg.channel, output_message);
            } catch (e) {
                console.log("Error in result parsing: " + e);
            }
        });
}

module.exports = ImageMe
