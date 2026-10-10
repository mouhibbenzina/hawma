import mongoose from 'mongoose';
import { governorates } from '../shared/governorates.js';

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
    governorate: {
      type: String,
      enum: governorates.map(({ id }) => id),
      default: '',
    },
    status: {
      type: String,
      enum: ['new', 'in_progress', 'resolved'],
      default: 'new',
    },
    visibility: { type: String, enum: ['pending', 'public', 'hidden'], default: 'public' },
    moderationNote: { type: String, maxlength: 300, default: '' },
    moderatedAt: { type: Date, default: null },
    supportCount: { type: Number, min: 0, default: 0 },
    flagCount: { type: Number, min: 0, default: 0 },
    sample: { type: Boolean, default: false },
    lang: { type: String, enum: ['fr', 'ar'], default: 'fr' },
  },
  { timestamps: true },
);

reportSchema.index({ visibility: 1, createdAt: -1 });
reportSchema.index({ category: 1, visibility: 1, createdAt: -1 });
reportSchema.index({ governorate: 1, visibility: 1, createdAt: -1 });

export default mongoose.model('Report', reportSchema);
