var Action = require("./base_action.js"),
    googleimages = require("google-images"),
    AuthDetails = require("../auth.json"),
    inherits = require('util').inherits;

function ImageMe() {
    Action.call(this);
    this.name = "ImageMe";
    this.client = googleimages(AuthDetails.cse_id, AuthDetails.cse_api_key);
}

inherits(ImageMe, Action)

ImageMe.prototype.does_match = function(gervin, msg) {
    return msg.content.match(/image\s+me\s+[^\s]/i);
}

ImageMe.prototype.run = function(gervin, msg) {
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

module.exports = new ImageMe()
