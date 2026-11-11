const fs = require('fs');
const path = require('path');
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds
} = require('@firebase/rules-unit-testing');

const PROJECT_ID = 'territory-grid-hunt';
const RULES_PATH = path.resolve(__dirname, '../firestore.rules');

describe('Territory Grid Firestore Security Rules', () => {
  let testEnv;

  before(async () => {
    const rules = fs.readFileSync(RULES_PATH, 'utf8');
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: rules,
        host: '127.0.0.1',
        port: 8080
      }
    });
  });

  after(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    if (testEnv) {
      await testEnv.clearFirestore();
    }
  });

  describe('users collection rules', () => {
    it('unauthenticated requests cannot read or write users', async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(unauthDb.collection('users').doc('user1').get());
      await assertFails(unauthDb.collection('users').doc('user1').set({
        name: 'Hacker',
        email: 'hacker@recon.grid',
        role: 'ADMIN'
      }));
    });

    it('users can read their own profile but not another user profile', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('user1').set({
          name: 'Operative Alpha',
          email: 'alpha@recon.grid',
          role: 'PLAYER',
          teamId: 'team1',
          zoneId: null,
          createdAt: null
        });
        await context.firestore().collection('users').doc('user2').set({
          name: 'Operative Beta',
          email: 'beta@recon.grid',
          role: 'PLAYER',
          teamId: 'team2',
          zoneId: null,
          createdAt: null
        });
      });

      const user1Db = testEnv.authenticatedContext('user1').firestore();
      await assertSucceeds(user1Db.collection('users').doc('user1').get());
      await assertFails(user1Db.collection('users').doc('user2').get());
    });

    it('admin can read any user profile and provision new operatives', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('admin_user').set({
          name: 'Game Master',
          email: 'admin@recon.grid',
          role: 'ADMIN',
          teamId: null,
          zoneId: null,
          createdAt: null
        });
        await context.firestore().collection('users').doc('user1').set({
          name: 'Operative Alpha',
          email: 'alpha@recon.grid',
          role: 'PLAYER',
          teamId: 'team1',
          zoneId: null,
          createdAt: null
        });
      });

      const adminDb = testEnv.authenticatedContext('admin_user').firestore();
      // Admin reads another user
      await assertSucceeds(adminDb.collection('users').doc('user1').get());

      // Admin provisions a new member
      await assertSucceeds(adminDb.collection('users').doc('new_marshal').set({
        name: 'Marshal Delta',
        email: 'marshal@recon.grid',
        role: 'MEMBER',
        teamId: null,
        zoneId: 'ZONE_01',
        createdAt: null
      }));
    });

    it('non-admin cannot create or modify user documents', async () => {
      const user1Db = testEnv.authenticatedContext('user1').firestore();
      await assertFails(user1Db.collection('users').doc('user1').set({
        name: 'Operative Alpha Escalation',
        email: 'alpha@recon.grid',
        role: 'ADMIN',
        teamId: null,
        zoneId: null,
        createdAt: null
      }));
    });
  });

  describe('game/state rules', () => {
    it('any signed-in user can read game state', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('game').doc('state').set({
          status: 'PLAYER_PHASE',
          startedAt: null,
          endedAt: null,
          pausedAt: null,
          totalPausedMs: 0
        });
      });

      const playerDb = testEnv.authenticatedContext('player1').firestore();
      await assertSucceeds(playerDb.collection('game').doc('state').get());
    });

    it('only admin can update game state', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('admin_user').set({
          name: 'Game Master',
          email: 'admin@recon.grid',
          role: 'ADMIN',
          teamId: null,
          zoneId: null,
          createdAt: null
        });
        await context.firestore().collection('game').doc('state').set({
          status: 'LOBBY',
          startedAt: null,
          endedAt: null,
          pausedAt: null,
          totalPausedMs: 0
        });
      });

      const playerDb = testEnv.authenticatedContext('player1').firestore();
      await assertFails(playerDb.collection('game').doc('state').update({
        status: 'PLAYER_PHASE'
      }));

      const adminDb = testEnv.authenticatedContext('admin_user').firestore();
      await assertSucceeds(adminDb.collection('game').doc('state').update({
        status: 'PLAYER_PHASE'
      }));
    });
  });

  describe('clues collection rules', () => {
    it('player can read only active clue document matching currentClueIndex', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('player1').set({
          name: 'Hunter',
          email: 'hunter@recon.grid',
          role: 'PLAYER',
          teamId: 'team1',
          zoneId: null,
          createdAt: null
        });
        await context.firestore().collection('teams').doc('team1').set({
          name: 'Titans',
          score: 100,
          cards: [],
          clueOrder: ['clue_active', 'clue_locked'],
          currentClueIndex: 0,
          visitedZones: [],
          updatedAt: null
        });
        await context.firestore().collection('clues').doc('clue_active').set({
          text: 'Find the fountain.',
          zoneId: 'Z1',
          zoneLabel: 'Zone 1'
        });
        await context.firestore().collection('clues').doc('clue_locked').set({
          text: 'Climb the clocktower.',
          zoneId: 'Z2',
          zoneLabel: 'Zone 2'
        });
      });

      const playerDb = testEnv.authenticatedContext('player1').firestore();
      // Player reads active clue
      await assertSucceeds(playerDb.collection('clues').doc('clue_active').get());
      // Player blocked from reading future clue
      await assertFails(playerDb.collection('clues').doc('clue_locked').get());
    });
  });

  describe('checkins and atomic scoring rules', () => {
    it('checkin updates are completely forbidden (immutable records)', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('checkins').doc('team1_Z1').set({
          teamId: 'team1',
          zoneId: 'Z1',
          memberId: 'marshal1',
          cone: 'GREEN',
          cardRank: 10,
          cardSuit: '♠',
          points: 25,
          timestamp: null
        });
      });

      const memberDb = testEnv.authenticatedContext('marshal1').firestore();
      await assertFails(memberDb.collection('checkins').doc('team1_Z1').update({
        points: 28
      }));
    });
  });
});
