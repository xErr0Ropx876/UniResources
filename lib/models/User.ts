import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IUser extends Document {
    name: string
    email: string
    password?: string
    role: 'student' | 'tech' | 'admin'
    image?: string
    provider?: string
    bannedUntil?: Date
    preferences: {
        theme: 'light' | 'dark'
        notifications: boolean
    }
    enrolledResources: mongoose.Types.ObjectId[]
    recentViews: {
        resourceId: mongoose.Types.ObjectId
        viewedAt: Date
    }[]
    createdAt: Date
    updatedAt: Date
}

const UserSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
        },
        password: {
            type: String,
            minlength: [6, 'Password must be at least 6 characters'],
        },
        role: {
            type: String,
            enum: ['student', 'tech', 'admin'],
            default: 'student',
            required: true,
        },
        image: {
            type: String,
        },
        provider: {
            type: String,
        },
        bannedUntil: {
            type: Date,
        },
        preferences: {
            theme: {
                type: String,
                enum: ['light', 'dark'],
                default: 'light',
            },
            notifications: {
                type: Boolean,
                default: true,
            },
        },
        enrolledResources: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Resource',
            },
        ],
        recentViews: [
            {
                resourceId: {
                    type: Schema.Types.ObjectId,
                    ref: 'Resource',
                },
                viewedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
)

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

export default User
