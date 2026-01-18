// models/Leave.js
import mongoose from 'mongoose';

const leaveSchema = mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      default: 'Personal Leave',
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'], // Useful if an Admin needs to approve leaves
      default: 'Approved',
    },
  },
  {
    timestamps: true,
  }
);

const Leave = mongoose.model('Leave', leaveSchema);
export default Leave;