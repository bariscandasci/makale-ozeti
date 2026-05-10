const mongoose = require('mongoose');

const { isDatabaseReady } = require('../config/db');
const User = require('../models/User');
const Summary = require('../models/Summary');
const Subscription = require('../models/Subscription');

const memoryStore = {
  users: [],
  summaries: [],
  subscriptions: [],
};

function createId() {
  return new mongoose.Types.ObjectId().toString();
}

function mapUser(user) {
  if (!user) {
    return null;
  }

  const record = user.toObject ? user.toObject() : user;

  return {
    id: record._id?.toString() || record.id,
    email: record.email,
    password: record.password,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapSubscription(subscription) {
  if (!subscription) {
    return null;
  }

  const record = subscription.toObject ? subscription.toObject() : subscription;

  return {
    id: record._id?.toString() || record.id,
    userId: record.userId?.toString() || record.userId,
    tier: record.tier,
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapSummary(summary) {
  if (!summary) {
    return null;
  }

  const record = summary.toObject ? summary.toObject() : summary;

  return {
    id: record._id?.toString() || record.id,
    userId: record.userId?.toString() || record.userId,
    originalText: record.originalText,
    summary: record.summary,
    keywords: record.keywords || [],
    sentiment: record.sentiment,
    originalLength: record.originalLength || 0,
    summaryLength: record.summaryLength || 0,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

async function findUserByEmail(email) {
  if (isDatabaseReady()) {
    return mapUser(await User.findOne({ email: email.toLowerCase() }));
  }

  return memoryStore.users.find((user) => user.email === email.toLowerCase()) || null;
}

async function findUserById(userId) {
  if (isDatabaseReady()) {
    return mapUser(await User.findById(userId));
  }

  return memoryStore.users.find((user) => user.id === userId) || null;
}

async function createUser({ email, password }) {
  const normalizedEmail = email.toLowerCase();

  if (isDatabaseReady()) {
    const createdUser = await User.create({ email: normalizedEmail, password });
    const createdSubscription = await Subscription.create({
      userId: createdUser._id,
      tier: 'free',
      status: 'active',
    });

    return {
      user: mapUser(createdUser),
      subscription: mapSubscription(createdSubscription),
    };
  }

  const now = new Date().toISOString();
  const user = {
    id: createId(),
    email: normalizedEmail,
    password,
    createdAt: now,
    updatedAt: now,
  };

  const subscription = {
    id: createId(),
    userId: user.id,
    tier: 'free',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  memoryStore.users.push(user);
  memoryStore.subscriptions.push(subscription);

  return { user, subscription };
}

async function getSubscriptionByUserId(userId) {
  if (isDatabaseReady()) {
    return mapSubscription(await Subscription.findOne({ userId }));
  }

  return memoryStore.subscriptions.find((subscription) => subscription.userId === userId) || null;
}

async function createSummary(summaryData) {
  if (isDatabaseReady()) {
    const createdSummary = await Summary.create(summaryData);
    return mapSummary(createdSummary);
  }

  const now = new Date().toISOString();
  const record = {
    id: createId(),
    ...summaryData,
    createdAt: now,
    updatedAt: now,
  };

  memoryStore.summaries.unshift(record);
  return record;
}

async function getSummariesByUserId(userId) {
  if (isDatabaseReady()) {
    const summaries = await Summary.find({ userId }).sort({ createdAt: -1 });
    return summaries.map(mapSummary);
  }

  return memoryStore.summaries
    .filter((summary) => summary.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function deleteSummaryById(summaryId, userId) {
  if (isDatabaseReady()) {
    const deleted = await Summary.findOneAndDelete({ _id: summaryId, userId });
    return !!deleted;
  }

  const summaryIndex = memoryStore.summaries.findIndex(
    (summary) => summary.id === summaryId && summary.userId === userId
  );

  if (summaryIndex === -1) {
    return false;
  }

  memoryStore.summaries.splice(summaryIndex, 1);
  return true;
}

module.exports = {
  createSummary,
  createUser,
  deleteSummaryById,
  findUserByEmail,
  findUserById,
  getSubscriptionByUserId,
  getSummariesByUserId,
};
