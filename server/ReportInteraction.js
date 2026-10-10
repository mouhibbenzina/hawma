import mongoose from 'mongoose';

const reportInteractionSchema = new mongoose.Schema(
  {
    reportId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    kind: { type: String, enum: ['support', 'flag'], required: true },
    visitorHash: { type: String, required: true },
    reason: { type: String, enum: ['concern'], default: 'concern' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

reportInteractionSchema.index({ reportId: 1, kind: 1, visitorHash: 1 }, { unique: true });
reportInteractionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31_536_000 });

export default mongoose.model('ReportInteraction', reportInteractionSchema);
