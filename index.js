var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app = express();

// import custom app modules
var interpreter = require('./interpreter.js');
var templates = require('./templates.js');

var port = 8080;


var cards = [];
var cardQueue = [];
var startingQueueLength = 0;

var directoryUrls = [
    'http://wizard101.wikia.com/wiki/Category:Damage',
    'http://wizard101.wikia.com/wiki/Category:Healing',
    'http://wizard101.wikia.com/wiki/Category:Global',
    'http://wizard101.wikia.com/wiki/Category:Charm',
    'http://wizard101.wikia.com/wiki/Category:Ward',
    'http://wizard101.wikia.com/wiki/Category:Manipulation',
    'http://wizard101.wikia.com/wiki/Category:Steal'
];

var blacklistUrls = [
    'http://wizard101.wikia.com/wiki/Stormspear',
    'http://wizard101.wikia.com/wiki/Mighty_Judgement',
    'http://wizard101.wikia.com/wiki/Dr._Von%27s_Monster',
    'http://wizard101.wikia.com/wiki/Insane_Bolt',
    'http://wizard101.wikia.com/wiki/Gnomes!',
    'http://wizard101.wikia.com/wiki/Reshuffle',
    'http://wizard101.wikia.com/wiki/Earthquake_(Spell)', // TODO
    'http://wizard101.wikia.com/wiki/Leviathan_(Spell)'
];

var currentCardId = 0;
if(cards.length != 0) {
    currentCardId = cards.length - 1;
}

var unitTest = null; // for example: http://wizard101.wikia.com/wiki/Fire_Elf

// and... begin!
if(unitTest == null) {
    getCardUrls();
}
else {
    cardQueue[0] = unitTest;
    processQueue();
}


// begin recursive process of going through card scrape queue
function processQueue() {
    startingQueueLength = cardQueue.length;
    recursiveProcess();
}

function recursiveProcess() {
    console.log('Processed ' + (startingQueueLength - cardQueue.length) + ' of ' + startingQueueLength + ' in queue.');

    if(cardQueue[0] != null) {
        var url = cardQueue.pop();

        // check blacklist
        if(blacklistUrls.indexOf(url) == -1) {
            getCardData(url);
        }

        setTimeout(recursiveProcess, 2500); // delay so we don't waste website resources
    }
    else {
        console.log('Done processing!');
        setTimeout(saveDb, 3000); // give asynchronous functions time to finish
    }
}



var directoryTotal = directoryUrls.length;

// scrape directory page
function getCardUrls() {

    var url = directoryUrls.pop();

    if(typeof url !== 'undefined') {
        request(url, function(error, response, html) {
            if(!error) {
                var $ = cheerio.load(html);

                $('.mw-content-ltr table').find('a')
                    .not(':contains("Treasure Card")').not(':contains("Item Card")')
                    .each(function() {
                        cardQueue.push('http://wizard101.wikia.com' + $(this).attr('href'));
                    });

                console.log('Done getting directory ' + (7 - directoryUrls.length) + '/' + (directoryTotal + 1));
                setTimeout(getCardUrls, 2500); // delay so we don't waste website resources
            }
            else {
                console.log('Error connecting to ' + url + ':');
                console.log(error);
            }
        });
    }
    else {
        processQueue();
    }
}

// scrape card page
function getCardData(url) {
    request(url, function(error, response, html) {
        if(!error) {
            var $ = cheerio.load(html);

            // we're not interested in these
            if(
                ($('.categories :contains("Item Cards")').length > 0) ||
                ($('.categories :contains("Treasure Cards")').length > 0)
            ) {
                return;
            }

            var cardStats = templates.card();
            cardStats.id = currentCardId;

            cardStats.name = $('.header-title h1').first().text().replace('(Spell)', '').trim();

            console.log('Processing ' + cardStats.name);

            cardStats.externalImageUrl = $('.mw-content-text .floatright img').first().attr('src');

            cardStats.school = $('p b:contains("School")').first()
                                .parent().find('a img').first()
                                .attr('alt').toLowerCase();

            // these are not up-to-date on the wiki
            if((cardStats.school == 'star') || (cardStats.school == 'moon') || (cardStats.school == 'sun')) {
                return;
            }

            cardStats.pips = $('p b:contains("Pip Cost")').first()
                                .parent().clone().children().remove()
                                .end().text().substr(2).replace(/(\r\n|\n|\r)/gm,"");

            if(!isNaN(cardStats.pips)) {
                cardStats.pips = parseInt(cardStats.pips);
            }

            cardStats.accuracy = $('p b:contains("Accuracy")').first()
                                .parent().clone().children().remove()
                                .end().text().replace(/\D/g,'');

            cardStats.accuracy = parseInt(cardStats.accuracy);

            cardStats.type = $('p b:contains("Type")').first()
                                .parent().find('a img').first()
                                .attr('alt').toLowerCase();

            cardStats.description = $('p b:contains("Description")').first()
                                .parent().clone().children('b').remove()
                                .end().find('a noscript').remove()
                                .end().find('a img').replaceWith(function() { return $(this).attr('alt'); })
                                .end().text().substr(2).replace(/(\r\n|\n|\r)/gm,"").toLowerCase()
                                .trim().replace('  ', ' ').replace('.', '').replace('\'', '')
                                .replace(/(\d),(\d)/g, '$1$2') // remove commas in middle of numbers
                                .replace('deals', 'deal').replace('dispell', 'dispel')
                                .replace('all enemies', 'all_enemies').replace('all friends', 'all_friends')
                                .replace('power pip', 'power_pip').replace('all allies', 'all_allies');

            cardStats.rawDescription = $('p b:contains("Description")').first()
                                .parent().clone().children('b').remove()
                                .end().find('a noscript').remove()
                                .end().find('a img').replaceWith(function() { return $(this).attr('alt'); })
                                .end().text().substr(2).replace(/(\r\n|\n|\r)/gm,"").toLowerCase()
                                .trim().replace('  ', ' ');

            var parseDescription = cardStats.description.split(' ');

            if((cardStats.type == 'damage') || (cardStats.type == 'healing')) {
                interpreter.damage(parseDescription, cardStats);
            }

            if(cardStats.type == 'global') {
                interpreter.global(parseDescription, cardStats);
            }

            if(cardStats.type == 'charm') {
                interpreter.charm(parseDescription, cardStats);
            }

            if(cardStats.type == 'ward') {
                interpreter.ward(parseDescription, cardStats);
            }

            if(cardStats.type == 'manipulation') {
                interpreter.manipulation(parseDescription, cardStats, $);
            }

            if(cardStats.type == 'steal') {
                interpreter.steal(parseDescription, cardStats);
            }

            cards[currentCardId] = cardStats;
            currentCardId++;
        }
        else {
            console.log('Error connecting to ' + url + ':');
            console.log(error);
        }
    });
}




// save collected data to file
function saveDb() {
    fs.writeFile('data/cardsDb.json', JSON.stringify(cards), function(error) {
        if(!error) {
            console.log('Saved all data!');
        }
        else {
            console.log('Error saving data.');
            console.log(error);
        }
    });
}



app.get('/scrapeInfo', function(req, res) {
    res.send(cards);
    console.log(cards);
});

var server = app.listen(port, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Listening at http://%s:%s', host, port);
});

exports = module.exports = app;
