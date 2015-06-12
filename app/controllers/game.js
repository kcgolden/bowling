import Ember from 'ember';
function __isStrike(index, score) {
    var rollIsFirstInFrame = index % 2 === 0 && index < 20;
    return rollIsFirstInFrame && score === 10;
}
function __isSpare(index, score, rolls) {
    var rollIsSecondInFrame = index % 2 === 1;
    return rollIsSecondInFrame && score > 0 && (score + rolls[index - 1]) === 10;
}
function __calculateSpareBonus(index, score, rolls) {
    var bonus = 0;
    if (__isSpare(index, score, rolls)) {
        bonus = (rolls[index + 1] || 0);
    }
    return bonus;
}
function __calculateStrikeBonus(index, score, rolls) {
    var bonus = 0;
    if(!__isStrike(index, score)) {
        bonus = 0;
    } 
    //strikes for frames 1 - 8 (handles special case where a strike can occur in the next frame)
    else if (index < 15) {
        bonus = (rolls[index + 2] || 0);
        if (bonus === 10) {
            //next frame is also a strike so add the value of the frame after
            bonus += (rolls[index + 4] || 0);
        } else {
            bonus += (rolls[index + 3] || 0);
        }
    }
    //strikes for frame 9 (next frame is 10 so we can safely add the first two rolls)
    else if (index === 16) {
        bonus = (rolls[18] || 0) + (rolls[19] || 0);
    } 
    //strikes for frame 10
    else if (index === 18) {
        bonus = (rolls[19] || 0) + (rolls[21] || 0);
    }
    return bonus;
}
function __calculateBonus(index, score, rolls) {
    return __calculateSpareBonus(index, score, rolls) + __calculateStrikeBonus(index, score, rolls);
}
function __calculatePinsLeftInCurrentFrame(rolls) {
    var atSecondInFrame = rolls.length % 2 === 1 && rolls.length < 21,
        previousFrameWasStrike = atSecondInFrame && __isStrike(rolls.length - 1, rolls[rolls.length - 1]),
        secondInFinalFrame = rolls.length === 19,
        pinsLeft = 10;
    if(previousFrameWasStrike && secondInFinalFrame) {
        pinsLeft = 10;
    } else if (atSecondInFrame) {
        pinsLeft -= rolls[rolls.length - 1];
    }
    return pinsLeft;
}

export default Ember.Controller.extend({
    pinsToKnockDown: 0,
    score: Ember.computed.sum('__rollScoresWithBonuses'),
    __rollScoresWithBonuses: function() {
        return this.get('__rawRollScores').map(function(pinsKnockedDown, index, self){
            //return the scores for all frames except the 21st which is only used to calculate bonuses
            return index < 20 ? (pinsKnockedDown + __calculateBonus(index, pinsKnockedDown, self)) : 0;
        });
    }.property('__rawRollScores.@each'),
    __rawRollScores: [],
    gameOver: Ember.computed.equal('__rawRollScores.length', 21),
    errorMessage: function() {
        var pinsLeft = __calculatePinsLeftInCurrentFrame(this.get('__rawRollScores')),
            pinsToKnockDown = this.get('pinsToKnockDown'),
            msg = '';
        if (isNaN(pinsToKnockDown)) {
            msg = 'You must enter a valid number.';
        } else if (parseInt(pinsToKnockDown, 10) > pinsLeft){
            msg = 'You only have ' + pinsLeft + ' pins left for this frame. You cannot knock down more than you are eligible to knock down.';
        }
        return msg;
    }.property('pinsToKnockDown', '__rawRollScores.@each'),
    actions: {
        roll: function(pinsKnockedDown) {
            var rawRollScores = this.get('__rawRollScores'),
                isInFinalFrame = rawRollScores.length >= 18,
                isStrike = __isStrike(rawRollScores.length, parseInt(pinsKnockedDown, 10)),
                isSpare = __isSpare(rawRollScores.length, parseInt(pinsKnockedDown, 10), rawRollScores);
            if (rawRollScores.length < 21) {
                rawRollScores.pushObject(parseInt(pinsKnockedDown, 10));
                if (isStrike && !isInFinalFrame) {
                    rawRollScores.pushObject(0);
                } else if (!isSpare && rawRollScores.length === 20) {
                    rawRollScores.pushObject(0);
                }
            }
        },
        reset: function() {
            this.set('__rawRollScores', []);
        }
    }
});
