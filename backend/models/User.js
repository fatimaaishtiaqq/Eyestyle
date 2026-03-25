import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['customer', 'superadmin', 'manager', 'support'],
        default: 'customer'
    },
    status: {
        type: String,
        enum: ['active', 'blocked'],
        default: 'active'
    }
}, { timestamps: true });

// Virtual `isAdmin` for backward compatibility with existing code
userSchema.virtual('isAdmin').get(function () {
    return this.role === 'superadmin' || this.role === 'manager';
});
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });


userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);
export default User;
