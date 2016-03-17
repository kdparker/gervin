var Action = require("./baseAction.js"),
    cheerio = require("cheerio"),
    request = require("request"),
    async = require('async'),
    inherits = require('util').inherits;

const POLL_TIMEOUT = 120000;
  
function SpoilerSpoiler(gervin) {
    Action.call(this, gervin);

    var db = gervin.db;
    console.log("Waiting for db initialization for SpoilerSpoiler..."); 
    db.serialize(function () {
        db.run(
            "CREATE TABLE IF NOT EXISTS seen_spoiler (" + 
                "id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, " + 
                "spoiler_link TEXT NOT NULL, " +
                "time_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL" +
            ")"
        );
    });
}
  
inherits(SpoilerSpoiler, Action);
  
SpoilerSpoiler.prototype.name = "Spoiler Spoiler";
 
SpoilerSpoiler.prototype.help = "Automatically gets new spoilers for MTG!";

SpoilerSpoiler.prototype.filterByMoreRecent = function(cardLinks, lastSeen) {
    output = []
    for (var i=0; i < cardLinks.length; i++) {
        var cardLink = cardLinks[i];
        if (cardLink === lastSeen || i >= 5)
            break;
        output.push(cardLink);
    }
    return output;
};


SpoilerSpoiler.prototype.formatCardOutput = function($, cardLink) {
    const NAME = 0;
    const COST = 1;
    const TYPE = 2;
    const TEXT = 3;
    const PT = -1;
    var imageLink = 'http://mythicspoiler.com/' + cardLink.replace(/html/, 'jpg');
    contentRow = $("table").eq(5).find("tr").eq(0);
    // Check if double faced
    if (contentRow.find("td").length < 6) {
        return imageLink + "\n" +
                imageLink.replace(/[^\/]*$/, '') + contentRow.find("td img").attr('src');
    }
    var textFields = $("font").filter(function () {
        return $(this).attr('size') == "4";
    }).closest('table').find('tr');
    var cardName = textFields.eq(NAME).text().trim();
    var cardCost = textFields.eq(COST).text().trim();
    var cardType = textFields.eq(TYPE).text().trim();
    var cardText = textFields.eq(TEXT).find('td');
    cardText.html(cardText.html().replace(/<br>\s*<br>/g, "\n"));
    cardText = cardText.text().trim();
    var cardPT   = textFields.eq(PT).text().match(
        /((\d+|\*)\/(\d+|\*))/
    )
    if (cardPT) {
        cardPT = cardPT[1];
    } else {
        cardPT = "";
    }
    output = cardName + "    " + cardCost + "\n" +
            cardType + "\n" +
            cardText + "\n" +
            cardPT + "\n" +
            imageLink;
    return output.replace(/\n\n/g, "\n");
}

SpoilerSpoiler.prototype.sendAllNewCards = function (gervin, newLinks) {
    var self = this;
    var channels = gervin.getAllGeneralTextChannels();
    gervin.db.run("INSERT INTO seen_spoiler (spoiler_link) VALUES (?)", newLinks[0]);
    for (var i = 0; i < channels.length; i++) {
        gervin.sendMessage(channels[i],
            "NEW SPOILERS ALERT!!!!",
            {"tts": true}
        )
    }
    async.eachSeries(newLinks, function(cardLink, callback) {
        request('http://mythicspoiler.com/' + cardLink, function(err, response, body) {
            if (err) 
                callback(err);
            var $ = cheerio.load(body);
            output = self.formatCardOutput($, cardLink);
            for (var i = 0; i < channels.length; i++) {
                gervin.sendMessage(channels[i], output);
            }
            callback(null);
        });
    }, function(err) {
        if (err) 
            console.log(err);
    })
}

SpoilerSpoiler.prototype.onReady = function(gervin) {
    var self = this;
    console.log("Checking for new spoilers...");
    try {
        self.getAllCardLinks(function(cardLinks) {
            gervin.db.serialize(function() {
                gervin.db.each(
                    "SELECT spoiler_link FROM seen_spoiler ORDER BY time_added DESC LIMIT 1", 
                    function(err, row) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        var lastSeen = row.spoiler_link;
                        var newLinks = self.filterByMoreRecent(cardLinks, lastSeen);
                        if (newLinks.length) {
                            console.log("New spoilers found: " + newLinks);
                            self.sendAllNewCards(gervin, newLinks);
                        } else {
                            console.log("No new spoilers found");
                        }
                        setTimeout(function() {
                            self.onReady(gervin);
                        }, POLL_TIMEOUT);
                    }
                );
            });
        });
    } catch (e) {
        console.log(e)
    }
}

SpoilerSpoiler.prototype.getAllCardLinks = function (callback) {
    request('http://mythicspoiler.com/newspoilers.html', function(err, response, body) {
        if (err)
            throw "Error getting mythic spoiler page";
        $ = cheerio.load(body);

        card_links = $('a').filter(function(i, el) {
            return $(this).attr('href').match(/\/cards\//i)
        }).map(function(i, el) {
            return $(this).attr('href')
        }).toArray();

        callback(card_links);
    });
}

module.exports = SpoilerSpoiler
