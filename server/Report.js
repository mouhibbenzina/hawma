import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    titleAr: { type: String, trim: true, maxlength: 100, default: '' },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    descriptionAr: { type: String, trim: true, maxlength: 1000, default: '' },
    category: {
      type: String,
      required: true,
      enum: ['water', 'waste', 'road', 'lighting', 'other'],
    },
    location: { type: String, required: true, trim: true, maxlength: 160 },
    area: { type: String, required: true, trim: true, maxlength: 80 },
    status: {
      type: String,
      enum: ['new', 'in_progress', 'resolved'],
      default: 'new',
    },
    visibility: { type: String, enum: ['public', 'hidden'], default: 'public' },
    moderationNote: { type: String, maxlength: 300, default: '' },
    moderatedAt: { type: Date, default: null },
    sample: { type: Boolean, default: false },
    lang: { type: String, enum: ['fr', 'ar'], default: 'fr' },
  },
  { timestamps: true },
);

export default mongoose.model('Report', reportSchema);
