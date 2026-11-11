import mongoose from 'mongoose';
import { DELIVERY_STATUS } from '../constants/index.js';

const deliverySchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true
    },
    courier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      validate: {
        validator(value) {
          return this.status === DELIVERY_STATUS.PENDING ? value == null : value != null;
        },
        message: 'La asignación del repartidor no coincide con el estado de la entrega'
      }
    },
    trackingCode: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: Object.values(DELIVERY_STATUS),
      default: DELIVERY_STATUS.PENDING,
      required: true
    }
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model('Delivery', deliverySchema);

