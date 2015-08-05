exports.damage = function (parseDescription, cardStats) {
    var phrases = []; // to be able to work with multi-instruction cards

    var currentPhrase = -1; // to keep track of what phrase to work with
    phrases[-1] = {};

    for(var i = 0; i < parseDescription.length; i++) {
        var word = parseDescription[i]; // current word
        var prevWord = parseDescription[i - 1]; // previous word
        var prePrevWord = parseDescription[i - 2]; // word before last
        var number = parseInt(word); // same value; just a number if possible
        var phrase = phrases[currentPhrase];

        if(word == '') { continue; }

        // switch between phrases
        if((word == 'and') || (word == '+') || (word == 'deal') || (word == 'take') || (word == 'followed') || (word == 'plus') || (word == 'give') || (word == ',') || (currentPhrase == -1)) {
            // changes to current phrase must be made before moving onto the next one
            if((Object.keys(phrase).length !== 0) || (currentPhrase == -1)) {
                currentPhrase++;
                phrases[currentPhrase] = {};
                phrase = phrases[currentPhrase];
            }
        }

        // detect numbers ending ranges
        if((!isNaN(word)) && (((prevWord == '-') || (prevWord == 'to')))) {
            phrase.impactMin = phrase.impactFlat;
            phrase.impactFlat = null;
            phrase.impactMax = number;

            continue;
        }

        // detect numbers confirming impact over time
        if((word == '3') && ((prevWord == 'over') || (prevWord == 'for'))) {
            phrase.impactOverTimeAmount = phrase.impactFlat;
            phrase.impactOverTimePerRound = (prevWord == 'for');
            phrase.impactOverTimeDistributed = (prevWord == 'over');
            phrase.impactOverTimeDuration = 3;

            phrase.impactFlat = null;
            continue;
        }

        // detect numbers by themselves
        if(!isNaN(word)) {
            phrase.impactFlat = number;
        }

        // detect schools of damage
        if(isSchool(word)) {
            phrase.damageSchool = word;

            if(currentPhrase > 0) {
                if(phrases[0].damageSchool == null) {
                    phrases[0].damageSchool = word;
                }
            }
        }

        // detect target
        if(isTarget(word)) {
            phrase.target = word;

            // to accomodate descriptions like
            // 'deal X fire damage and Y damage over 3 rounds to all_enemies'
            // where second phrase defines target for both

            if(currentPhrase > 0) {
                if(phrases[0].target == null) {
                    phrases[0].target = word;
                }
            }
        }

        // detect 'to self or group member' in Sacrifice
        if((word == 'member') && (prevWord == 'group')) {
            phrase.target = 'target';
        }

        // detect 'take'
        if(word == 'take') {
            phrase.target = 'self';
        }

        // detect attacks
        if(word == 'damage') {
            phrase.attack = true;
            phrase.heal = false;

            if(currentPhrase > 0) {
                if(phrases[0].attack == null) {
                    phrases[0].attack = true;
                    phrases[0].heal = false;
                }
            }
        }

        //detect heals
        if(word == 'healing') {
            phrase.attack = false;
            phrase.heal = true;

            if(currentPhrase > 0) {
                if(phrases[0].attack == null) {
                    phrases[0].attack = false;
                    phrases[0].heal = true;
                }
            }
        }

        // detect 'per pip'
        if((prevWord == 'per') && (word == 'pip')) {
            phrase.impactPerPip = true;
        }

        // detect 'remove charms and wards from all enemies' in a super-lax way
        if((prevWord == 'remove') && (word == 'charms')) {
            phrase.removeCharmsAndWards = true;
        }

        // detect sacrificing minion
        if((prevWord == 'sacrifice') && (word == 'minion')) {
            phrase.destroysMinion = true;

            currentPhrase++;
            phrases[currentPhrase] = {};
        }

        //detect 'for X pips'
        if((prePrevWord == 'for') && (!isNaN(prevWord)) && (word == 'pips')) {
            phrase.impactFlat = null;
            phrase.pipGain = parseInt(prevWord);
        }
    }

    // verify that the target is always set
    for(var i = 0; i <= currentPhrase; i++) {
        if(phrases[i].target == null) {
            phrases[i].target = 'target';
        }
    }

    // lazy fix :( TODO
    if(cardStats.name == "Hydra") {
        for(var i = 0; i <= currentPhrase; i++) {
            if(phrases[i].attack == null) {
                phrases[i].attack = true;
                phrases[i].attack = false;
            }

            if(phrases[i].impactFlat == null) {
                phrases[i].impactFlat = phrases[0].impactFlat;
            }
        }
    }

    // merge changes
    // TODO: automate this
    var modifiedAttributes = [ // array of possibly modified attributes
        'target',
        'attack',
        'heal',
        'impactFlat',
        'impactMin',
        'impactMax',
        'impactOverTimeAmount',
        'impactOverTimeDuration',
        'impactOverTimePerRound',
        'impactOverTimeDistributed',
        'impactPerPip',
        'damageSchool',
        'removeCharmsAndWards',
        'destroysMinion',
        'pipGain'
    ];

    var finalizedChanges = {}; // the changes to be saved
    if(currentPhrase > 0) {
        //if there are multiple phrases, merge their attributes into arrays
        mergePhrases(phrases, currentPhrase, modifiedAttributes, finalizedChanges);
    }
    else {
        finalizedChanges = phrases[0];
    }

    //merge finalizedChanges into cardStats
    mergeChanges(finalizedChanges, cardStats, modifiedAttributes);
}

exports.global = function (parseDescription, cardStats) {
    var phrases = []; // to be able to work with multi-instruction cards
    var currentPhrase = -1; // to keep track of what phrase to work with
    phrases[-1] = {};

    for(var i = 0; i < parseDescription.length; i++) {
        var word = parseDescription[i]; // current word
        var prevWord = parseDescription[i - 1]; // previous word
        var number = parseInt(word); // same value; just a number if possible
        var phrase = phrases[currentPhrase];

        if(word == '') { break; }

        // switch between phrases
        if((currentPhrase == -1)) {
            // changes to current phrase must be made before moving onto the next one
            if((Object.keys(phrase).length !== 0) || (currentPhrase == -1)) {
                currentPhrase++;
                phrases[currentPhrase] = {};
                phrase = phrases[currentPhrase];
            }
        }

        // check for percentages in format '+X%' and '-X%'
        if(isPercentage(word)) {
            phrase.globalEffectPercentage = getPercentage(word);
        }

        // check for effect school
        if(isSchool(word)) {
            phrase.globalEffectSchool = word;
        }

        // check for effect type
        if((word == 'healing') || (word == 'damage') || (word == 'power_pip')) {
            phrase.globalEffectType = word;
        }
    }

    // merge changes
    var modifiedAttributes = [ // array of possibly modified attributes
        'globalEffectPercentage',
        'globalEffectSchool',
        'globalEffectType'
    ];

    var finalizedChanges = {}; // the changes to be saved
    if(currentPhrase > 0) {
        //if there are multiple phrases, merge their attributes into arrays
        mergePhrases(phrases, currentPhrase, modifiedAttributes, finalizedChanges);
    }
    else {
        finalizedChanges = phrases[0];
    }

    //merge finalizedChanges into cardStats
    mergeChanges(finalizedChanges, cardStats, modifiedAttributes);
}

exports.charm = function (parseDescription, cardStats) {
    var phrases = []; // to be able to work with multi-instruction cards
    var currentPhrase = -1; // to keep track of what phrase to work with
    phrases[-1] = {};

    for(var i = 0; i < parseDescription.length; i++) {
        var word = parseDescription[i]; // current word
        var prevWord = parseDescription[i - 1]; // previous word
        var number = parseInt(word); // same value; just a number if possible
        var phrase = phrases[currentPhrase];

        if(word == '') { break; }

        // switch between phrases
        if((word == 'and') || (word == ',') || (word == 'for') || (currentPhrase == -1)) {
            // changes to current phrase must be made before moving onto the next one
            if((Object.keys(phrase).length !== 0) || (currentPhrase == -1)) {
                currentPhrase++;
                phrases[currentPhrase] = {};
                phrase = phrases[currentPhrase];
            }

            // lazy fix :(
            if((cardStats.name == 'Buff Minion') || (cardStats.name == 'Bladestorm')) {
                currentPhrase = 0;
                phrase = phrases[currentPhrase];
            }
        }

        // detect numbers by themselves
        if(!isNaN(word)) {
            phrase.impactFlat = number;
        }

        // get percentages
        if(isPercentage(word)) {
            phrase.charmEffectPercentage = getPercentage(word);
        }

        // get target
        if(isTarget(word)) {
            phrase.target = word;
        }

        // get effect
        if((word == 'damage') || (word == 'dispel') || (word == 'accuracy') || (word == 'healing')) {
            // if phrase is regarding attack
            if(phrase.damageFlat != null) {
                if(word == 'damage') {
                    phrase.attack = true;
                    phrase.heal = false;
                }
                if(word == 'healing') {
                    phrase.attack = false;
                    phrase.heal = true;
                }
            }
            // if phrase is regarding charm
            else {
                phrase.charmEffectType = word;
            }
        }


        // get school
        if(isSchool(word)) {
            // if phrase is regarding attack
            if(phrase.damageFlat != null) {
                phrase.damageSchool = word;
            }
            // if phrase is regarding charm
            else {
                phrase.charmEffectSchool = word;
            }
        }
    }

    // for dark pact
    if(currentPhrase > 0) {
        if((phrases[1].target == null) || (phrases[0].target != null)) {
            phrases[1].target = phrases[0].target;
        }
    }

    // verify that the target is always set
    for(var i = 0; i <= currentPhrase; i++) {
        if(phrases[i].target == null) {
            phrases[i].target = 'target';
        }
    }

    // lazy fix :(
    // for tri-blade descriptions like Spirit Blade
    if(currentPhrase == 2) {
        phrases[0].charmEffectType = phrases[2].charmEffectType;
        phrases[1].charmEffectType = phrases[2].charmEffectType;

        phrases[1].charmEffectPercentage = phrases[0].charmEffectPercentage;
        phrases[2].charmEffectPercentage = phrases[0].charmEffectPercentage;
    }

    // merge changes
    var modifiedAttributes = [ // array of possibly modified attributes
        'attack',
        'heal',
        'damageSchool',
        'target',
        'impactFlat',
        'charmEffectPercentage',
        'charmEffectType',
        'charmEffectSchool'
    ];

    var finalizedChanges = {}; // the changes to be saved
    if(currentPhrase > 0) {
        //if there are multiple phrases, merge their attributes into arrays
        mergePhrases(phrases, currentPhrase, modifiedAttributes, finalizedChanges);
    }
    else {
        finalizedChanges = phrases[0];
    }

    //merge finalizedChanges into cardStats
    mergeChanges(finalizedChanges, cardStats, modifiedAttributes);
}

exports.ward = function (parseDescription, cardStats) {
    var phrases = []; // to be able to work with multi-instruction cards
    var currentPhrase = -1; // to keep track of what phrase to work with
    phrases[-1] = {};

    for(var i = 0; i < parseDescription.length; i++) {
        var word = parseDescription[i]; // current word
        var prevWord = parseDescription[i - 1]; // previous word
        var prePrevWord = parseDescription[i - 2]; // word before last
        var number = parseInt(word); // same value; just a number if possible
        var phrase = phrases[currentPhrase];

        if(word == '') { break; }

        // switch between phrases
        if((word == 'and') || (word == ',') || (word == 'for') || (currentPhrase == -1)) {
            // changes to current phrase must be made before moving onto the next one
            if((Object.keys(phrase).length !== 0) || (currentPhrase == -1)) {
                currentPhrase++;
                phrases[currentPhrase] = {};
                phrase = phrases[currentPhrase];
            }

            // lazy fix :(
            if((cardStats.name == 'Shield Minion') || (cardStats.name == 'Ice Armor')) {
                currentPhrase = 0;
                phrase = phrases[currentPhrase];
            }
        }

        // get numbers
        if(!isNaN(word)) {
            if(phrase.wardEffectType == 'absorb') {
                phrase.wardAbsorbAmount = number;
            }
        }

        // get repeats
        if((prePrevWord == 'to') && (prevWord == 'next') && (!isNaN(word))) {
            phrase.wardMultiplier = number;
        }

        // get percentages
        if(isPercentage(word)) {
            phrase.wardEffectPercentage = getPercentage(word);
        }

        // get target
        if(isTarget(word)) {
            phrase.target = word;
        }

        // detect 'per pip'
        if((prevWord == 'per') && (word == 'pip')) {
            if(phrase.wardEffectType == 'absorb') {
                phrase.wardAbsorbPerPip = true;
            }
        }

        // get effect
        if((word == 'damage') || (word == 'absorb')) {
            if(phrase.wardEffectType == null) {
                phrase.wardEffectType = word;
            }
        }

        // get type of absorption
        if((word == 'damage') || (word == 'stun')) {
            if(phrase.wardEffectType == 'absorb') {
                phrase.wardAbsorbType = word;
            }
        }

        // get school
        if(isSchool(word)) {
            phrase.wardEffectSchool = word;
        }
    }

    // verify that the target is always set
    for(var i = 0; i <= currentPhrase; i++) {
        if(phrases[i].target == null) {
            phrases[i].target = 'target';
        }
    }

    // for multi-ward
    if(currentPhrase > 0) {
        var effectType;
        var effectPercentage;

        var needMerging = false;

        for(var i = 0; i <= currentPhrase; i++) {
            if((phrases[i].wardEffectType == null) || (phrases[i].wardEffectPercentage == null)) {
                needMerging = true;
            }
        }

        if(needMerging == true) {
            for(var i = 0; i <= currentPhrase; i++) {
                if(phrases[i].wardEffectType != null) {
                    effectType = phrases[i].wardEffectType;
                }

                if(phrases[i].wardEffectPercentage != null) {
                    effectPercentage = phrases[i].wardEffectPercentage;
                }
            }

            for(var i = 0; i <= currentPhrase; i++) {
                phrases[i].wardEffectType = effectType;
                phrases[i].wardEffectPercentage = effectPercentage;
            }
        }
    }

    // merge changes
    var modifiedAttributes = [ // array of possibly modified attributes
        'target',
        'wardEffectPercentage',
        'wardEffectType',
        'wardEffectSchool',
        'wardMultiplier',
        'wardAbsorbAmount',
        'wardAbsorbType',
        'wardAbsorbPerPip'
    ];

    var finalizedChanges = {}; // the changes to be saved
    if(currentPhrase > 0) {
        //if there are multiple phrases, merge their attributes into arrays
        mergePhrases(phrases, currentPhrase, modifiedAttributes, finalizedChanges);
    }
    else {
        finalizedChanges = phrases[0];
    }

    //merge finalizedChanges into cardStats
    mergeChanges(finalizedChanges, cardStats, modifiedAttributes);
}

exports.manipulation = function (parseDescription, cardStats, $) {
    var phrases = []; // to be able to work with multi-instruction cards
    var currentPhrase = -1; // to keep track of what phrase to work with
    phrases[-1] = {};

    for(var i = 0; i < parseDescription.length; i++) {
        var word = parseDescription[i]; // current word
        var prevWord = parseDescription[i - 1]; // previous word
        var prePrevWord = parseDescription[i - 2]; // word before last
        var number = parseInt(word); // same value; just a number if possible
        var phrase = phrases[currentPhrase];

        if(word == '') { break; }

        // switch between phrases
        if((currentPhrase == -1)) {
            // changes to current phrase must be made before moving onto the next one
            if((Object.keys(phrase).length !== 0) || (currentPhrase == -1)) {
                currentPhrase++;
                phrases[currentPhrase] = {};
                phrase = phrases[currentPhrase];
            }
        }

        // determine target
        if((word == 'all_enemies') || (word == 'target')) {
            phrase.target = word;
        }

        // determine stealing something
        if((word == 'remove') || (word == 'steal')) {
            phrase.takingMethod = word;
        }

        if((prePrevWord == 'remove') && (prevWord == '1') && (word == 'damage')) {
            phrase.takingMethod = null;
            phrase.removeImpactOverTime = true;
        }

        // determine stealing what
        if((phrase.takingMethod != null) && ((word == 'charm') || (word == 'ward'))) {
            phrase.takingCharmWard = word;
            phrase.takingQuantity = 1;
        }

        // get summoning data
        if((word == 'summon') || (word == 'summons')) {
            var minionTable = $('#mw-content-text table');
            minionTable.find('tr').first().remove();

            var pipResults = minionTable.find('tr td:first-child');
            var pipCosts = [];
            pipResults.each(function(i) {
                pipCosts[i] = parseInt($(this).text().trim());
            });

            var minionResults = minionTable.find('tr td:nth-child(2) a');
            var minionNames = [];
            minionResults.each(function(i) {
                minionNames[i] = $(this).text().trim();
            });

            var minionData = [];
            for (var i = 0; i < pipCosts.length; i++) {
                var minionObject = {};
                minionObject[minionNames[i]] = pipCosts[i];
                minionData.push(minionObject);
            }

            phrase.summonsMinion = true;
            phrase.summonedMinions = minionData;
        }

        // detect strucutre 'target helps you'
        if((prevWord == 'helps') && (word == 'you')) {
            phrase.beguileTarget = true;
        }

        // detect stun
        if(word == 'stun') {
            phrase.stunTarget = true;
        }

        // detect threat alteration
        if((word == 'reduce') || (word == 'generate')) {
            phrase.threatImpactNet = word;
        }

        // detect threat magnitude
        if(word == 'majorly') {
            phrase.threatImpactMag = word;
        }
        if((phrase.threatImpactMag == null) && (phrase.threatImpactNet != null)) {
            phrase.threatImpactMag = 'standardly';
        }

        // detect prism
        if(word == 'convert') {
            phrase.prism = true; // not saved ; temporary data
            phrase.target = 'target'; // can be overridden later
        }

        // detect prism conversions
        if((phrase.prism == true) && (isSchool(word))) {
            if(phrase.wardConvertFrom == null) {
                phrase.wardConvertFrom = word;
            }
            else {
                phrase.wardConvertTo = word;
            }
        }

        // detect structure 'give X pips' and 'for X pips'
        if(((prePrevWord == 'give') || (prePrevWord == 'for')) && (!isNaN(prevWord)) && (word == 'pips')) {
            phrase.pipGain = parseInt(prevWord);
        }

        // detect structure 'take X'
        if((prevWord == 'take') && (!isNaN(word))) {
            phrase.heal = false;
            phrase.attack = true;
            phrase.target = 'self';
        }

        // detect damage
        if((phrase.attack == true) && (!isNaN(word))) {
            phrase.impactFlat = parseInt(word);
        }

        // detect school damage
        if((phrase.attack == true) && (isSchool(word))) {
            phrase.damageSchool = word;
        }
    }

    // merge changes
    var modifiedAttributes = [ // array of possibly modified attributes
        'target',
        'attack',
        'heal',
        'impactFlat',
        'damageSchool',
        'summonsMinion',
        'summonedMinions',
        'beguileTarget',
        'stunTarget',
        'takingCharmWard',
        'takingMethod',
        'takingQuantity',
        'wardConvertFrom',
        'wardConvertTo',
        'pipGain',
        'threatImpactNet',
        'threatImpactMag',
        'removeImpactOverTime'
    ];

    var finalizedChanges = {}; // the changes to be saved
    if(currentPhrase > 0) {
        //if there are multiple phrases, merge their attributes into arrays
        mergePhrases(phrases, currentPhrase, modifiedAttributes, finalizedChanges);
    }
    else {
        finalizedChanges = phrases[0];
    }

    //merge finalizedChanges into cardStats
    mergeChanges(finalizedChanges, cardStats, modifiedAttributes);
}

// the formatting of their descriptions is very loose, so this one is very basic
exports.steal = function (parseDescription, cardStats) {
    var phrases = []; // to be able to work with multi-instruction cards
    var currentPhrase = -1; // to keep track of what phrase to work with
    phrases[-1] = {};

    for(var i = 0; i < parseDescription.length; i++) {
        var word = parseDescription[i]; // current word
        var number = parseInt(word); // same value; just a number if possible
        var phrase = phrases[currentPhrase];

        if(word == '') { break; }

        // switch between phrases
        if((currentPhrase == -1)) {
            // changes to current phrase must be made before moving onto the next one
            if((Object.keys(phrase).length !== 0) || (currentPhrase == -1)) {
                currentPhrase++;
                phrases[currentPhrase] = {};
                phrase = phrases[currentPhrase];
            }
        }

        // detect number
        if(!isNaN(word)) {
            phrase.impactFlat = number;
            phrase.attack = true;
            phrase.heal = false;
            phrase.healthSteal = true;
            phrase.damageSchool = 'death';
        }

        // detect target
        if(word == 'all_enemies') {
            phrase.target = word;
        }
        if(phrase.target != 'all_enemies') {
            phrase.target = 'target';
        }
    }



    // merge changes
    var modifiedAttributes = [
        'impactFlat',
        'attack',
        'heal',
        'healthSteal',
        'damageSchool'
    ]; // array of possibly modified attributes

    var finalizedChanges = {}; // the changes to be saved
    if(currentPhrase > 0) {
        //if there are multiple phrases, merge their attributes into arrays
        mergePhrases(phrases, currentPhrase, modifiedAttributes, finalizedChanges);
    }
    else {
        finalizedChanges = phrases[0];
    }

    //merge finalizedChanges into cardStats
    mergeChanges(finalizedChanges, cardStats, modifiedAttributes);
}

exports.template = function (parseDescription, cardStats) {
    var phrases = []; // to be able to work with multi-instruction cards
    var currentPhrase = -1; // to keep track of what phrase to work with
    phrases[-1] = {};

    for(var i = 0; i < parseDescription.length; i++) {
        var word = parseDescription[i]; // current word
        var number = parseInt(word); // same value; just a number if possible
        var phrase = phrases[currentPhrase];

        if(word == '') { break; }

        // switch between phrases
        if((currentPhrase == -1)) {
            // changes to current phrase must be made before moving onto the next one
            if((Object.keys(phrase).length !== 0) || (currentPhrase == -1)) {
                currentPhrase++;
                phrases[currentPhrase] = {};
                phrase = phrases[currentPhrase];
            }
        }
    }

    // merge changes
    var modifiedAttributes = []; // array of possibly modified attributes

    var finalizedChanges = {}; // the changes to be saved
    if(currentPhrase > 0) {
        //if there are multiple phrases, merge their attributes into arrays
        mergePhrases(phrases, currentPhrase, modifiedAttributes, finalizedChanges);
    }
    else {
        finalizedChanges = phrases[0];
    }

    //merge finalizedChanges into cardStats
    mergeChanges(finalizedChanges, cardStats, modifiedAttributes);
}

function isSchool(string) {
    if(
        (string == 'fire') ||
        (string == 'ice') ||
        (string == 'storm') ||
        (string == 'life') ||
        (string == 'myth') ||
        (string == 'death') ||
        (string == 'balance') ||
        (string == 'shadow') ||
        (string == 'sun') ||
        (string == 'moon')
    ) {
        return true;
    }
    else {
        return false;
    }
}

function isTarget(value) {
    if(
        (value == 'target') ||
        (value == 'all_enemies') ||
        (value == 'self') ||
        (value == 'minion') ||
        (value == 'all_friends') ||
        (value == 'all_allies')
    ) {
        return true;
    }
    else {
        return false;
    }
}

function isPercentage(value) {
    return /([+]|-)\d+%/.test(value);
}

function getPercentage(value) {
    if(isPercentage(value)) {
        return parseInt(value.substr(0, value.length - 1));
    }
    else {
        return value;
    }
}

// merge together multiple phrases into array attributes
function mergePhrases(phrases, numPhrases, modifiedAttributes, finalizedChanges) {
    if(numPhrases > 0) {
        for(var a = 0; a < modifiedAttributes.length; a++) {

            var currentAttribute = modifiedAttributes[a];
            var statArray = [];

            for(var i = 0; i <= numPhrases; i++) {
                if(typeof phrases[i][currentAttribute] === 'undefined') {
                    phrases[i][currentAttribute] = null;
                }

                statArray.push(phrases[i][currentAttribute]);
            }

            finalizedChanges[currentAttribute] = statArray;
        }
    }
}

// merge changes from interpreter into main card JSON
function mergeChanges(finalizedChanges, cardStats, modifiedAttributes) {
    for(var i = 0; i < modifiedAttributes.length; i++) {
        var currentAttribute = modifiedAttributes[i];

        if(typeof finalizedChanges[currentAttribute] === 'undefined') {
            finalizedChanges[currentAttribute] = null;
        }

        cardStats[currentAttribute] = finalizedChanges[currentAttribute];
    }
}
