import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  fullname: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    unique: true, 
    lowercase: true,
    required: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true,
    minlenght: 6 
  },
  role: { 
    type: String, 
    enum: ['customer', 'admin','employee'],
    default: 'customer',  
  },
  userInfo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'UserInfo' 
  },
},
//createdAt, updatedAt
{
  timestamps: true
});

// Pre-save hook to hash password before saving to database
UserSchema.pre("save", async function (next) {
	if (!this.isModified("password")) return next();

	try {
		const salt = await bcrypt.genSalt(10);
		this.password = await bcrypt.hash(this.password, salt);
		next();
	} catch (error) {
		next(error);
	}
});

UserSchema.methods.comparePassword = async function (password) {
	return bcrypt.compare(password, this.password);
};

const User = mongoose.models?.User || mongoose.model("User", UserSchema);

export default User;
