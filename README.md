# Scraper and Parser for Wizard101 Cards
Card descriptions are written to be human-readable, not for computers. This is sometimes inconvenient, and this program overcomes this by reading similarly to a human. In many cases, only reading for simple keywords like 'damage' or 'healing' is not enough: a card performing multiple functions may have several keywords which would otherwise conflict with each other. This program is capable of determining the different parts or phrases of a card description, filling in missing information if any, and saving the gathered data in JSON format for use. The program is currently configured for Wizard101, but can be modified to accomodate other card games.

## Notice: Scraper
A major part of this application is scraping data from the Wizard101 Wikia, and consideration was put in from the very start to minimize impact on server load. There is a 2.5 second delay between every request to avoid overloading their webserver with requests. This is the suggested minimum when running: be considerate!

The data is already included in `data/cardsDb.json`, so you don't need to unnecessarily run if you only want to see the result. :)

## Notice: No Affiliation
I am not associated with Wizard101 or Wikia. This is a personal project.

## Configuration
There are several variables within `index.js` that can be configured to your liking.

`directoryUrls` is an array of urls which have links to spell cards. The default state points to the categories pages on the wiki: Damage, Healing, Global, Charm, Ward, Manipulation, and Steal.

`blacklistUrls` is an array of card urls which should **not** be accessed. The default state points to urls which the program cannot currently parse.

`unitTest` is for debugging, testing a single card. The default state is `null`, which gets urls from the directoryUrls. If `unitTest` is set to a card page, it will skip directoryUrls and only run on the set page.

`port` is what port to run the server on, the default is `8080`.

## How to use
Simply run `index.js` to run!

If you want to see gathered information while it's being collected, visit `localhost:8080/scrapeInfo` and the data will be output to the console and to the browser.

Data is saved in `data/cardsDb.json`.

## Data Format
`id`: incrementing card id  
`externalImageUrl`: remotely accessible image url  
`internalImageUrl`: locally accessible image url  

`name`: card name  
`school`: card school  
`pips`: card pip cost  
`accuracy`: card accuracy  
`type`: card type  

`description`: card description, parsed and filtered for computer interpretation  
`rawDescription`: original card descriptions  

`target`: who is affected by this card  
`attack`: is this card an attack?  
`heal`: is this card a heal?  

`impactFlat`: how much damage this card deals  
`impactMin`: minimum amount of damage this card deals  
`impactMax`: maximum amount of damage this card deals  

`impactOverTimeAmount`: how much damage over time is incurred by this card  
`impactOverTimeDuration`: how many rounds does the card do damage over time for  
`impactOverTimePerRound`: does this card deal `impactOverTimeAmount` every round?  
`impactOverTimeDistributed`: does this card deal `impactOverTimeAmount` distributed over `impactOverTimeDuration` rounds?  

`impactPerPip`: false, // does damage scale per pip?  
`damageSchool`: the school the card does damage in  
`healthSteal`: does this card steal health?  

`globalEffectPercentage`: the percentage modifier the card incurs globally  
`globalEffectType`: the type of card this card modifies (damage, power pips, or healing)  
`globalEffectSchool`: the school the damage effect modifies  

`charmEffectPercentage`: the percentage modifier the card incurs on the next card the target casts  
`charmEffectType`: the type of card this card modifies (damage, accuracy, or healing)  
`charmEffectSchool`: the school the damage effect modifies  

`wardEffectPercentage`: the percentage modifier the card incurs on the next card the target is dealt  
`wardEffectType`: the type of cad this card modifies (damage or absorb)  
`wardEffectSchool`: the school the damage effect modifies  
`wardMultiplier`: how many of the wards are applied  

`wardAbsorbAmount`: how much damage is absorbed by the ward  
`wardAbsorbType`: the type of absorption (stun or damage)  
`wardAbsorbPerPip`: does absorption scale per pip?  

`wardConvertFrom`: what school of damage to convert from  
`wardConvertTo`: what school of damage to convert to  

`destroysMinion`: does minion get destroyed?  
`summonsMinion`: does minion get summoned?  
`summonedMinions`: JSON: [ { "minion name": pipCost }, ... ]  

`beguileTarget`: does target switch to your side for one round?  
`stunTarget`: do targets get stunned for one round?  

`threatImpactNet`: either 'generate' or 'reduce'  
`threatImpactMag`: 'majorly' or 'standardly'  

`removeImpactOverTime`: does one impact over time effect get removed?  

`takingCharmWard`: either 'charm' or 'ward'  
`takingMethod`: either 'remove' or 'steal'  
`takingQuantity`: generally 1 or 'all'  

`pipGain`: how many pips to gain
