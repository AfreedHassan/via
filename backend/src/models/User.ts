import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    email: string;
    name?: string;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});

export const User = mongoose.model<IUser>('User', UserSchema);
