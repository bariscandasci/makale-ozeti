const mongoose = require('mongoose');

const summarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    originalText: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      required: true,
    },
    keywords: {
      type: [String],
      default: [],
    },
    sentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral'],
      default: 'neutral',
    },
    originalLength: Number,
    summaryLength: Number,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Summary', summarySchema);