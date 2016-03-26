var Action = require("./baseAction.js"),
    cheerio = require("cheerio"),
    request = require("request"),
    async = require('async'),
    inherits = require('util').inherits;

function SpoilerSpoiler(gervin, config) {
    Action.call(this, gervin, config);

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
    // Make 'em unique (Double faced have two links to the same page)
    var linksSeen = {};
    var uniqueCardLinks = [];
    for (var j = 0; j < cardLinks.length; j++) {
        if (linksSeen.hasOwnProperty(cardLinks[j])) {
            continue;
        }
        uniqueCardLinks.push(cardLinks[j]);
        linksSeen[cardLinks[j]] = 1;
   }
    for (var i=0; i < uniqueCardLinks.length; i++) {
        var cardLink = uniqueCardLinks[i];
        if (cardLink === lastSeen)
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
        secondLink = contentRow.find("td img").attr('src');
        if (!secondLink)
            throw {reason: "Need to wait for mythic spoilers to load second image"}
        secondLink = imageLink.replace(/[^\/]*$/, '') + secondLink;
        return imageLink + "\n" +
            secondLink;
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
    if (!cardText && !cardPT) 
        throw {
            reason: "Information not ready for " + cardLink,
            checkForFinishedSpoilers: true
        }
    output = cardName + "    " + cardCost + "\n" +
            cardType + "\n" +
            cardText + "\n" +
            cardPT + "\n" +
            imageLink;
    return output.replace(/\n\n/g, "\n");
}

SpoilerSpoiler.prototype.checkForFinishedSpoilers = function(gervin, mostRecentNewLink) {
    var self = this;
    console.log("Checking for finished spoilers")
    request('http://mythicspoiler.com/newspoilers.html', function(err, response, body) {
        if (err) {
            console.log(err);
            return;
        }
        try {
            var $ = cheerio.load(body);
            var spoilerCountText = ""; 
            var menuItems = $("#menuwrapper li");
            var isFinishedSpoilersMatch;
            for (var i = 0; i < menuItems.length; i++) {
                spoilerCountText = menuItems.eq(i).text();
                isFinishedSpoilersMatch = spoilerCountText.match(/(\d+)\/(\d+)/);
                if (isFinishedSpoilersMatch)
                    break;
            }
            if (!isFinishedSpoilersMatch)
                throw "Something went wrong! Could not find any spoiler count text match";
            var isFinishedSpoilers = false;
            if (isFinishedSpoilersMatch) {
                console.log("Found isFinishedSpoilers match, " + isFinishedSpoilersMatch[0])
                isFinishedSpoilers = (isFinishedSpoilersMatch[1] === isFinishedSpoilersMatch[2])
            }
            if (isFinishedSpoilers) {
                console.log("We are done this spoiler season!")
                gervin.db.run("INSERT INTO seen_spoiler (spoiler_link) VALUES (?)", mostRecentNewLink);
                var channels = gervin.getAllGeneralTextChannels(
                    self.whitelistedServers
                )
                for (var i = 0; i < channels.length; i++) {
                    gervin.sendMessage(
                        channels[i],
                        "Full spoilers are out! Check 'em out at: " +
                        "http://mythicspoiler.com/newspoilers.html",
                        {tts:true}
                    );
                }
            }
        } catch (e) {
            console.log(e)
        }
    })
}

SpoilerSpoiler.prototype.sendAllNewCards = function (gervin, newLinks) {
    var self = this;
    var channels = gervin.getAllGeneralTextChannels(
        self.whitelistedServers
    );
    fullOutput = [];
    async.eachSeries(newLinks, function(cardLink, callback) {
        request('http://mythicspoiler.com/' + cardLink, function(err, response, body) {
            if (err) 
                callback(err);
            try {
                var $ = cheerio.load(body);
                output = self.formatCardOutput($, cardLink);
                fullOutput.push(output);
                callback(null);
            } catch (e) {
                callback(e);
            }
        })
    }, function(err) {
        if (err) {
            console.log(err);
            if (err.checkForFinishedSpoilers) {
                return self.checkForFinishedSpoilers(gervin, newLinks[0])
            } else 
                return
        }
        gervin.db.run("INSERT INTO seen_spoiler (spoiler_link) VALUES (?)", newLinks[0]);
        for (var i = 0; i < channels.length; i++) {
            gervin.sendMessage(channels[i],
                "NEW SPOILERS ALERT!!!!",
                {"tts": true}
            )
            for (var j = 0; j < fullOutput.length; j++) {
                var output = fullOutput[j];
                gervin.sendMessage(channels[i], output);
            }
        }
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
                        }, self.pollInterval);
                    }
                );
            });
        });
    } catch (e) {
        console.log(e)
    }
}

SpoilerSpoiler.prototype.c

SpoilerSpoiler.prototype.getAllCardLinks = function (callback) {
    request('http://mythicspoiler.com/newspoilers.html', function(err, response, body) {
        if (err) {
            console.log("Error getting mythic spoiler page " + err);
            return []
        }
        $ = cheerio.load(body);

        card_links = $('a').filter(function(i, el) {
            return ($(this).attr('href') && $(this).attr('href').match(/\/cards\//i))
        }).map(function(i, el) {
            return $(this).attr('href')
        }).toArray();

        callback(card_links);
    });
}

module.exports = SpoilerSpoiler
