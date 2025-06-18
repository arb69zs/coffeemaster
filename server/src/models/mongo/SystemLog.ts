import mongoose, { Document, Schema } from 'mongoose';

// Log levels
export enum LogLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error'
}

// Log categories
export enum LogCategory {
  AUTH = 'auth',
  ORDER = 'order',
  INVENTORY = 'inventory',
  PRODUCT = 'product',
  SYSTEM = 'system'
}

// Interface for system log document
export interface SystemLogDocument extends Document {
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: any;
  userId?: number;
  createdAt: Date;
}

// System log schema
const systemLogSchema = new Schema<SystemLogDocument>(
  {
    level: {
      type: String,
      enum: Object.values(LogLevel),
      required: true
    },
    category: {
      type: String,
      enum: Object.values(LogCategory),
      required: true
    },
    message: {
      type: String,
      required: true
    },
    details: {
      type: Schema.Types.Mixed
    },
    userId: {
      type: Number
    }
  },
  {
    timestamps: true
  }
);

// Create and export the model
export const SystemLog = mongoose.model<SystemLogDocument>('SystemLog', systemLogSchema);

// Helper function to create a log entry
export const createLog = async (
  level: LogLevel,
  category: LogCategory,
  message: string,
  details?: any,
  userId?: number
): Promise<SystemLogDocument> => {
  return await SystemLog.create({
    level,
    category,
    message,
    details,
    userId
  });
}; 