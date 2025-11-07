import mongoose, { Schema, Model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

export type Role = 'user' | 'admin';

export interface IUser {
    email: string;
    passwordHash: string;
    name?: string;
    roles: Role[];
    isActive: boolean;
    avatarUrl?: string;
    lastLogin?: Date;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IUserDocument extends IUser, Document {
    setPassword(password: string): Promise<void>;
    comparePassword(password: string): Promise<boolean>;
}

export interface IUserModel extends Model<IUserDocument> {
    findByEmail(email: string): Promise<IUserDocument | null>;
}

const userSchema = new Schema<IUserDocument>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        passwordHash: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            trim: true,
        },
        roles: {
            type: [String],
            enum: ['user', 'admin'],
            default: ['user'],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        avatarUrl: {
            type: String,
        },
        lastLogin: {
            type: Date,
        },
        resetPasswordToken: {
            type: String,
        },
        resetPasswordExpires: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// If passwordHash looks unhashed, hash it before save.
// bcrypt hashed strings typically start with $2a$ or $2b$ or $2y$
userSchema.pre<IUserDocument>('save', async function (next) {
    if (!this.isModified('passwordHash')) return next();
    const hash = this.passwordHash;
    if (/^\$2[aby]\$/.test(hash)) return next(); // already hashed
    try {
        const salt = await bcrypt.genSalt(SALT_ROUNDS);
        this.passwordHash = await bcrypt.hash(hash, salt);
        next();
    } catch (err) {
        next(err as any);
    }
});

userSchema.methods.setPassword = async function (password: string) {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.passwordHash = await bcrypt.hash(password, salt);
};

userSchema.methods.comparePassword = function (password: string) {
    return bcrypt.compare(password, this.passwordHash);
};

userSchema.statics.findByEmail = function (email: string) {
    return this.findOne({ email: email.toLowerCase().trim() }).exec();
};

const UserModel = mongoose.model<IUserDocument, IUserModel>('User', userSchema);

export default UserModel;