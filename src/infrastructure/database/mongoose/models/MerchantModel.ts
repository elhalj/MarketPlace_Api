import mongoose, { Model, Schema, Document } from "mongoose";

export interface IMerchantDocument {
    businessName: string;
    businessAddress: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    businessRegistrationNumber: string;
    taxId: string;
    phoneNumber: string;
    email: string;
    password: string;
    documentsUrls: string[];
    isVerified: boolean;
    status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
    role: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IMerchantModel extends Model<IMerchantDocument> {
    findByEmail(email: string): Promise<IMerchantDocument | null>;
    findByTaxId(taxId: string): Promise<IMerchantDocument | null>;
}

const merchantSchema = new Schema<IMerchantDocument>(
    {
        businessName: {
            type: String,
            required: true,
        },
        businessAddress: {
            street: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            zipCode: { type: String, required: true },
            country: { type: String, required: true },
        },
        businessRegistrationNumber: {
            type: String,
            required: true,
            unique: true,
        },
        taxId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        phoneNumber: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            index: true,
        },
        password: {
            type: String,
            required: true,
        },
        documentsUrls: {
            type: [String],
            default: [],
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        status: {
            type: String,
            enum: ['PENDING', 'ACTIVE', 'SUSPENDED'],
            default: 'PENDING',
        },
        role: {
            type: String,
            default: 'merchant',
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

merchantSchema.static('findByEmail', function (email: string) {
    return this.findOne({ email });
});

merchantSchema.static('findByTaxId', function (taxId: string) {
    return this.findOne({ taxId });
});

export const MerchantModel = mongoose.model<IMerchantDocument, IMerchantModel>('Merchant', merchantSchema);
