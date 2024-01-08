import { assertGameState, playOutOfTurn } from '../support/helpers';
import { Card } from '../fixtures/cards';
import { myUser} from '../fixtures/userFixtures';

const { _ } = Cypress;

describe('Login', () => {
    beforeEach(() => {
      cy.visit('http://localhost:8080'); 
      cy.stub(cy, 'wipeDatabase').as('wipeDatabaseStub');
      cy.stub(cy, 'visit').as('visitStub');
    });
  
    it('Redirects to Signup Page for Unauthenticated Stats Access', () => {
      cy.get('@wipeDatabaseStub').then(() => {
        cy.visit('/#/stats');
        cy.hash().should('eq', '#/signup');
      });
    });
  });


describe('Check the rules', () => {
    beforeEach(() => {
      cy.wipeDatabase();
      cy.visit('http://localhost:8080');
    });
  
    it('Navigation as non-authenticated user', () => {
        cy.vueRoute('/rules');
    });

    it('Navigation as authenticated user', () => {
        cy.hash().should('eq', '#/signup');
        cy.signupPlayer(myUser);
        cy.vueRoute('/rules');
        cy.get('[data-cy=top-home-button]').click();
        cy.hash().should('eq', '#/');
      });

  });


  describe('Create Game in Home Screen', () => {
    beforeEach(() =>{
        cy.wipeDatabase();
        cy.visit('http://localhost:8080');
        cy.signupPlayer(myUser);
        cy.vueRoute('/');
    });
  
    it('New unranked game', () => {
      cy.get('[data-cy=create-game-btn]').click();
      cy.get('[data-cy=create-game-dialog]')
        .should('be.visible')
        .find('[data-cy=game-name-input]')
        .should('be.visible')
        .type('test game');
      cy.get('[data-cy=submit-create-game]').should('be.visible').click();
  
      cy.get('[data-cy=create-game-dialog]').should('not.exist');
/*    
      cy.get('[data-cy=game-list-item]')
        .should('have.length', 1)
        .should('include.text', 'test game')
        .should('include.text', '0 / 2 players');
*/
    });
  });


  describe('Win Full Interaction Flow', () => {
    beforeEach(() => {
    cy.setupGameAsP0();
    });
  
    it('Validating Winning Mechanism', () => {
        const scrap = [Card.ACE_OF_SPADES, Card.TEN_OF_HEARTS, Card.TEN_OF_SPADES, Card.FOUR_OF_CLUBS];
        cy.loadGameFixture(0, {
          p0Hand: [Card.THREE_OF_CLUBS],
          p0Points: [],
          p0FaceCards: [],
          p1Hand: [Card.TEN_OF_DIAMONDS],
          p1Points: [Card.ACE_OF_HEARTS],
          p1FaceCards: [Card.KING_OF_HEARTS],
          scrap,
        });
  
        cy.get('[data-player-hand-card=3-0]').click(); // three of clubs
        cy.get('[data-move-choice=oneOff]').click();
    
        cy.get('#waiting-for-opponent-counter-scrim').should('be.visible');
    
        cy.resolveOpponent();
    
        cy.get('#waiting-for-opponent-counter-scrim').should('not.exist');
    
        cy.get('#three-dialog').should('be.visible');
  
        cy.get('[data-cy=three-resolve').should('be.disabled');
    
        const mapElementsToRank = (elements) => {
          return _.map(elements, (element) => {
            return Number(element.attributes['data-three-dialog-card'].value.split('-')[0]);
          });
        };
        cy.get('[data-three-dialog-card]')
          .then(mapElementsToRank)
          .then((elementRanks) => {
            const sortedScrapRanksFromFixture = _.sortBy(scrap, 'rank').map((card) => card.rank);
            expect(elementRanks).to.deep.equal(sortedScrapRanksFromFixture);
          });
    
        cy.get('[data-three-dialog-card=10-2]').click();
        cy.get('[data-cy=three-resolve').should('not.be.disabled').click();
        
        //check scrap card shows and then disappears
        cy.get('[data-cy="scrap-chosen-card"]').should('be.visible');
        cy.get('[data-cy="scrap-chosen-card"]').should('not.exist');
        
        assertGameState(0, {
          p0Hand: [Card.TEN_OF_HEARTS],
          p0Points: [],
          p0FaceCards: [],
          p1Hand: [Card.TEN_OF_DIAMONDS],
          p1Points: [Card.ACE_OF_HEARTS],
          p1FaceCards: [Card.KING_OF_HEARTS],
          scrap: [Card.ACE_OF_SPADES, Card.THREE_OF_CLUBS, Card.TEN_OF_SPADES, Card.FOUR_OF_CLUBS],
        });
    
        // Player attempts to play out of turn
        cy.get('[data-player-hand-card=10-2]').click(); // ten of hearts
        playOutOfTurn('points');
    
        cy.playPointsOpponent(Card.TEN_OF_DIAMONDS);
    
        assertGameState(0, {
          p0Hand: [Card.TEN_OF_HEARTS],
          p0Points: [],
          p0FaceCards: [],
          p1Hand: [],
          p1Points: [Card.ACE_OF_HEARTS, Card.TEN_OF_DIAMONDS],
          p1FaceCards: [Card.KING_OF_HEARTS],
          scrap: [Card.ACE_OF_SPADES, Card.THREE_OF_CLUBS, Card.TEN_OF_SPADES, Card.FOUR_OF_CLUBS],
        });

    });
  });

  describe('Losing the game', () => {
    beforeEach(() => {
      cy.setupGameAsP1();
    });

    it('Concession and Game Over Workflow', () => {
      cy.loadGameFixture(1, {
        p0Hand: [Card.SEVEN_OF_CLUBS],
        p0Points: [Card.SEVEN_OF_DIAMONDS, Card.SEVEN_OF_HEARTS],
        p0FaceCards: [],
        p1Hand: [],
        p1Points: [],
        p1FaceCards: [],
      });
  
      cy.get('#game-menu-activator').click();
      cy.get('#game-menu').should('be.visible').get('[data-cy=concede-initiate]').click();
  

      cy.get('#request-gameover-dialog').should('be.visible').get('[data-cy=request-gameover-cancel]').click();
      cy.get('#request-gameover-dialog').should('not.be.visible');

      cy.get('#game-menu-activator').click();
      cy.get('#game-menu').should('be.visible').get('[data-cy=concede-initiate]').click();
      cy.get('#request-gameover-dialog').should('be.visible').get('[data-cy=request-gameover-confirm]').click();
      cy.log('Asserting player loss');
      cy.get('#game-over-dialog').should('be.visible').get('[data-cy=loss-heading]').should('be.visible');
      cy.get('[data-cy=loss-img]').should('be.visible');
      cy.window()
        .its('cuttle.gameStore')
        .then((game) => {
          if (game.isRanked) {
            const gameNumber = game.currentMatch.games.length;
            const matchWinner = game.currentMatch.winner;
            cy.get('#game-over-dialog')
              .should('contain', matchWinner ? 'You Lose the Match' : `Game ${gameNumber}: You Lose`)
              .should('be.visible')
              .get('[data-cy=match-result-section]')
              .should('be.visible')
              .get(`[data-cy=match-result-game-${gameNumber}]`)
              .should('contain', 'L')
              .get('[data-cy=icon-L]')
              .should('be.visible');
          } else {
            cy.get('#game-over-dialog').should('be.visible').should('not.contain', 'Match against');
          }
        });
      cy.log('Going home');
      cy.get('[data-cy=gameover-go-home]').click();
      cy.url().should('not.include', '/game');
    });
  });