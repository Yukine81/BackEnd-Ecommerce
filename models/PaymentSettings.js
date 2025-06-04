import mongoose from 'mongoose';

const PaymentSettingsSchema = new mongoose.Schema({
  settingsId: {
    type: String,
    required: true,
    unique: true,
    default: 'default_payment_settings'
  },
  stripe: {
    enabled: {
      type: Boolean,
      default: false,
    },
    secretKey: {
      type: String,
      trim: true,
      default: '',
    },
  },
  cod: { // Cash On Delivery
    enabled: {
      type: Boolean,
      default: true, // Mặc định COD được bật
    },
  },
  
}, {
  timestamps: true, 
});

const PaymentSettings = mongoose.models.PaymentSettings || mongoose.model('PaymentSettings', PaymentSettingsSchema);

export default PaymentSettings;