var cardTemplate = {
    'id': null, // incrementing card id
    'externalImageUrl': null, // remotely accessible image url
    'internalImageUrl': null, // locally accessible image url; TODO

    'name': null, // card name
    'school': null, // card school
    'pips': null, // card pip cost
    'accuracy': null, // card accuracy
    'type': null, // card type

    'description': null, // card description, parsed and filtered for computer interpretation
    'rawDescription': null, // original card descriptions

    'target': null, // who is affected by this card
    'attack': null, // is this card an attack?
    'heal': null, // is this card a heal?

    'impactFlat': null, // how much damage this card deals
    'impactMin': null, // minimum amount of damage this card deals
    'impactMax': null, // maximum amount of damage this card deals

    'impactOverTimeAmount': null, // how much damage over time is incurred by this card
    'impactOverTimeDuration': null, // how many rounds does the card do damage over time for
    'impactOverTimePerRound': null, // does this card deal 'impactOverTimeAmount' every round?
    'impactOverTimeDistributed': null, // does this card deal 'impactOverTimeAmount' distributed over 'impactOverTimeDuration' rounds?

    'impactPerPip': false, // does damage scale per pip?
    'damageSchool': null, // the school the card does damage in
    'healthSteal': null, // does this card steal health?

    'globalEffectPercentage': null, // the percentage modifier the card incurs globally
    'globalEffectType': null, // the type of card this card modifies (damage, power pips, or healing)
    'globalEffectSchool': null,  // the school the damage effect modifies

    'charmEffectPercentage': null, // the percentage modifier the card incurs on the next card the target casts
    'charmEffectType': null, // the type of card this card modifies (damage, accuracy, or healing)
    'charmEffectSchool': null,  // the school the damage effect modifies

    'wardEffectPercentage': null, // the percentage modifier the card incurs on the next card the target is dealt
    'wardEffectType': null, // the type of cad this card modifies (damage or absorb)
    'wardEffectSchool': null,  // the school the damage effect modifies
    'wardMultiplier': null,  // how many of the wards are applied

    'wardAbsorbAmount': null, // how much damage is absorbed by the ward
    'wardAbsorbType': null, // the type of absorption (stun or damage)
    'wardAbsorbPerPip': null, // does absorption scale per pip?

    'wardConvertFrom': null, // what school of damage to convert from
    'wardConvertTo': null, // what school of damage to convert to

    'destroysMinion': null, // does minion get destroyed?
    'summonsMinion': null, // does minion get summoned?
    'summonedMinions': null, // JSON: [ { "minion name": pipCost }, ... ]

    'beguileTarget': null, // does target switch to your side for one round?
    'stunTarget': null, // do targets get stunned for one round?

    'threatImpactNet': null, // either 'generate' or 'reduce'
    'threatImpactMag': null, // 'majorly' or 'standardly'

    'removeImpactOverTime': null, // does one impact over time effect get removed?

    'takingCharmWard': null, // either 'charm' or 'ward'
    'takingMethod': null, // either 'remove' or 'steal'
    'takingQuantity': null, // generally 1 or 'all'

    'pipGain': null // how many pips to gain
};

exports.card = function () {
    return JSON.parse(JSON.stringify(cardTemplate));
}
