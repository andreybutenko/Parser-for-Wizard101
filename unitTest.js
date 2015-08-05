var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app = express();

// import custom app modules
var interpreter = require('./interpreter.js');
var templates = require('./templates.js');


var cards = [];
var cardQueue = [];
var startingQueueLength = 0;

var currentCardId = 0;
if(cards.length != 0) {
    currentCardId = cards.length - 1;
}


// and... begin!
cardQueue = [
    'http://wizard101.wikia.com/wiki/Fire_Elf'
];
processQueue();


// begin recursive process of going through card scrape queue
function processQueue() {
    startingQueueLength = cardQueue.length;
    recursiveProcess();
}

function recursiveProcess() {
    console.log('Processed ' + (startingQueueLength - cardQueue.length) + ' of ' + startingQueueLength + ' in queue.');

    if(cardQueue[0] != null) {
        var url = cardQueue.pop();
        getCardData(url);
        setTimeout(recursiveProcess, 1000); // delay so we don't waste website resources
    }
    else {
        console.log('Done processing!');
        setTimeout(saveDb, 1000); // give asynchronous functions time to finish
    }
}

// scrape card page
function getCardData(url) {
    request(url, function(error, response, html) {
        if(!error) {
            var $ = cheerio.load(html);

            var cardStats = templates.card();
            cardStats.id = currentCardId;

            cardStats.name = $('.header-title h1').first().text().replace('(Spell)', '').trim();

            console.log('Processing ' + cardStats.name);

            cardStats.externalImageUrl = $('.mw-content-text .floatright img').first().attr('src');

            cardStats.school = $('p b:contains("School")').first()
                                .parent().find('a img').first()
                                .attr('alt').toLowerCase();

            cardStats.pips = $('p b:contains("Pip Cost")').first()
                                .parent().clone().children().remove()
                                .end().text().substr(2).replace(/(\r\n|\n|\r)/gm,"");

            cardStats.accuracy = $('p b:contains("Accuracy")').first()
                                .parent().clone().children().remove()
                                .end().text().replace(/\D/g,'');

            cardStats.type = $('p b:contains("Type")').first()
                                .parent().find('a img').first()
                                .attr('alt').toLowerCase();

            cardStats.description = $('p b:contains("Description")').first()
                                .parent().clone().children('b').remove()
                                .end().find('a noscript').remove()
                                .end().find('a img').replaceWith(function() { return $(this).attr('alt'); })
                                .end().text().substr(2).replace(/(\r\n|\n|\r)/gm,"").toLowerCase()
                                .trim().replace(/[ ]{2,}/, ' ').replace('.', '').replace('deals', 'deal')
                                .replace('all enemies', 'all_enemies').replace('power pip', 'power_pip');

            var parseDescription = cardStats.description.split(' ');

            if(cardStats.type == 'damage') {
                interpreter.damage(parseDescription, cardStats);
            }

            if(cardStats.type == 'global') {
                interpreter.global(parseDescription, cardStats);
            }

            if(cardStats.type == 'charm') {
//                interpreter.charm(parseDescription, cardStats);
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
    fs.writeFile('cardsDb.json', JSON.stringify(cards), function(error) {
        if(!error) {
            console.log('Saved all data!');
        }
        else {
            console.log('Error saving data.');
            console.log(error);
        }
    });
}

var server = app.listen(8080, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Listening at http://%s:%s', host, port);
});

exports = module.exports = app;
