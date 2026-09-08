import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDestination extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  state: string;
  heroImage: string;
  tagline: string;
  description: string;
  popularCategories: Array<'SCOOTER' | 'MOTORCYCLE' | 'CAR' | 'EV'>;
  averagePrices: {
    scooter: number;
    motorcycle: number;
    car: number;
    ev: number;
  };
  travelTips: string[];
  attractions: Array<{
    name: string;
    distance: string;
    description: string;
    image: string;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  safetyGuidelines: string[];
  popularPickupLocations: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DestinationSchema = new Schema<IDestination>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    state: { type: String, required: true, default: 'Uttarakhand' },
    heroImage: { type: String, required: true },
    tagline: { type: String, default: '' },
    description: { type: String, required: true },
    popularCategories: [{ type: String, enum: ['SCOOTER', 'MOTORCYCLE', 'CAR', 'EV'] }],
    averagePrices: {
      scooter: { type: Number, default: 399 },
      motorcycle: { type: Number, default: 599 },
      car: { type: Number, default: 1499 },
      ev: { type: Number, default: 449 },
    },
    travelTips: [{ type: String }],
    attractions: [
      {
        name: { type: String, required: true },
        distance: { type: String, required: true },
        description: { type: String, required: true },
        image: { type: String, default: '' },
      },
    ],
    faqs: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
    safetyGuidelines: [{ type: String }],
    popularPickupLocations: [{ type: String }],
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

export const Destination: Model<IDestination> =
  mongoose.models.Destination || mongoose.model<IDestination>('Destination', DestinationSchema);

export default Destination;
