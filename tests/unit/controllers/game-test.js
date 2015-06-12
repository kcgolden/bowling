/* jshint expr:true */
import { expect } from 'chai';
import {
  describeModule,
  it,
  beforeEach
} from 'ember-mocha';

describeModule(
  'controller:game',
  'GameController',
  {
    // Specify the other units that are required for this test.
    // needs: ['controller:foo']
  },
  function() {
    var advanceRollNumber = function(rollNumber, controller, fillerScore) {
      for (var i = 0; i < rollNumber; i++) {
        controller.send('roll', fillerScore || 0);
      }
    };
    it('exists', function() {
      var controller = this.subject();
      expect(controller).to.be.ok;
    });
    it('should reset game', function() {
       var controller = this.subject();
      controller.send('roll', 1);
      controller.send('roll', 1);
      expect(controller.get('score')).to.equal(2);
      controller.send('reset');
      expect(controller.get('score')).to.equal(0);
    });
    it('calculates frame score for non-spare/strikes', function() {
       var controller = this.subject();
      controller.send('reset');
      controller.send('roll', 0);
      controller.send('roll', 1);
      controller.send('roll', 6);
      controller.send('roll', 1);
      expect(controller.get('score')).to.equal(8);
      controller.send('reset');
      controller.send('roll', 4);
      controller.send('roll', 0);
      controller.send('roll', 6);
      expect(controller.get('score')).to.equal(10);
    });
    it('properly advances to the third roll on the tenth frame', function() {
       var controller = this.subject();
       controller.send('reset');
      for (var i = 0; i < 18; i++) {
        controller.send('roll', 0);
      }
      controller.send('roll', 5);
      controller.send('roll', 5);
      controller.send('roll', 5);
      expect(controller.get('score')).to.equal(15);
    });
    it('a perfect game is the maximum score (300)', function() {
      var controller = this.subject();
      controller.send('reset');
      advanceRollNumber(18, controller, 10);
      expect(controller.get('score')).to.equal(300);
    });
    it('calculates strike bonuses', function() {
       var controller = this.subject();
       controller.send('reset');
      controller.send('roll', 10);
      controller.send('roll', 5);
      controller.send('roll', 5);
      expect(controller.get('score')).to.equal(30);
      controller.send('reset');
      controller.send('roll', 4);
      controller.send('roll', 0);
      controller.send('roll', 6);
      expect(controller.get('score')).to.equal(10);
    });

    it('calculates spare bonuses', function() {
       var controller = this.subject();
       controller.send('reset');
      controller.set('rollNumber', 1);
      controller.send('roll', 0);
      controller.send('roll', 10);
      controller.send('roll', 6);
      controller.send('roll', 1);
      expect(controller.get('score')).to.equal(23);
      controller.send('reset');
      controller.send('roll', 0);
      controller.send('roll', 1);
      controller.send('roll', 6);
      controller.send('roll', 1);
      expect(controller.get('score')).to.equal(8);
    });
      it('handles final frame strike', function() {
         var controller = this.subject();
         controller.send('reset');
        advanceRollNumber(18, controller);
        controller.send('roll', 10);
        controller.send('roll', 5);
        controller.send('roll', 5);
        expect(controller.get('score')).to.equal(20);
      });
      it('handles final frame spare', function() {
        var controller = this.subject();
        controller.send('reset');
        advanceRollNumber(18, controller);
        controller.send('roll', 9);
        controller.send('roll', 1);
        controller.send('roll', 5);
        expect(controller.get('score')).to.equal(15);
      });
      it('handles non-spare/non-strike', function() {
        var controller = this.subject();
        controller.send('reset');
        advanceRollNumber(18, controller);
        controller.send('roll', 1);
        controller.send('roll', 1);
        expect(controller.get('score')).to.equal(1 + 1);
        controller.send('roll', 1);
        expect(controller.get('score')).to.equal(1 + 1);
      });
    it('calculates when the game is over', function() {
      var controller = this.subject();
        controller.send('reset');
        expect(controller.get('gameOver')).to.equal(false);
        advanceRollNumber(18, controller);
        controller.send('roll', 1);
        controller.send('roll', 1);
        expect(controller.get('gameOver'), 'should not be waiting for a third bonus roll on final round without a strike or spare').to.equal(true);
        controller.send('reset');
        expect(controller.get('gameOver')).to.equal(false);
        advanceRollNumber(18, controller);
        controller.send('roll', 10);
        expect(controller.get('gameOver')).to.equal(false);
        controller.send('roll', 1);
        expect(controller.get('gameOver')).to.equal(true);
        controller.send('reset');
        expect(controller.get('gameOver')).to.equal(false);
        advanceRollNumber(18, controller);
        controller.send('roll', 5);
        controller.send('roll', 5);
        expect(controller.get('gameOver')).to.equal(false);
        controller.send('roll', 5);
        expect(controller.get('gameOver')).to.equal(true);
    });
    it('in each frame before final, 2 opportunities to knock down 10 pins', function(){
      var controller = this.subject();
      controller.send('reset');
      for (var i = 0; i < 20; i++) {
        controller.send('roll', 1);
      }
      expect(controller.get('score')).to.equal(20);
      controller.send('roll', 1);
    });
    it('must reject bad input', function() {
      var controller = this.subject();
      controller.send('reset');
      controller.set('pinsToKnockDown', 1);
      expect(controller.get('errorMessage')).to.equal('');
      controller.set('pinsToKnockDown', "1");
      expect(controller.get('errorMessage')).to.equal('');
      controller.set('pinsToKnockDown', "non numeric data");
      expect(controller.get('errorMessage')).to.equal('You must enter a valid number.');
      controller.set('pinsToKnockDown', "1");
      expect(controller.get('errorMessage')).to.equal('');
    });
    it('must complain when user enters an invalid number of pins to knock down', function() {
      var controller = this.subject();
      controller.send('reset');
      controller.send('roll', 1);
      expect(controller.get('errorMessage')).to.equal('');
      controller.set('pinsToKnockDown', 10);
      expect(controller.get('errorMessage')).to.equal('You only have 9 pins left for this frame. You cannot knock down more than you are eligible to knock down.');
      controller.send('reset');
      advanceRollNumber(18, controller);
      controller.send('roll', 10);
      controller.set('pinsToKnockDown', 1);
      expect(controller.get('errorMessage')).to.equal('');
    });
});