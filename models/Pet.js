import mongoose from 'mongoose';

const PetSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  logo: {
    type: String,
  },
}, {
  timestamps: true,
});

const Pet = mongoose.models.Pet || mongoose.model('Pet', PetSchema);

export default Pet;