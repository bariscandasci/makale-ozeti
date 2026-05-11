const mongoose = require('mongoose');

const trainingDataSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
      minlength: 10,
    },
    summary: {
      type: String,
      required: true,
      minlength: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TrainingData', trainingDataSchema);
