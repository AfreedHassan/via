import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
    userId: Schema.Types.ObjectId;
    theme: string;
    createdAt: Date;
    updatedAt: Date;
}

const SettingsSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    theme: {
        type: String,
        default: 'light'
    }
}, {
    timestamps: true
});

export const Settings = mongoose.model<ISettings>('Settings', SettingsSchema);
