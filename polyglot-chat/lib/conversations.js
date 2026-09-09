// lib/conversations.js — strictly 1-to-1 conversation helpers.
const store = require('./storage');
const { genId } = require('./common');

async function create(userA, userB) {
  let id;
  do { id = 'C' + genId(8); } while (await store.find('conversation', (c) => c.id === id));
  const conversation = {
    id,
    participants: [userA, userB].sort(), // exactly two users, order-independent
    createdAt: Date.now(),
  };
  await store.save('conversation', conversation);
  return conversation;
}

async function get(id) {
  return store.find('conversation', (c) => c.id === id);
}

function isParticipant(conversation, userId) {
  return !!conversation && conversation.participants.includes(userId);
}

function otherParticipant(conversation, userId) {
  return conversation.participants.find((p) => p !== userId);
}

module.exports = { create, get, isParticipant, otherParticipant };
