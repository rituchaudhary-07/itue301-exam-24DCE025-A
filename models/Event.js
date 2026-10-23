import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [80, 'Title cannot exceed 80 characters']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    validate: {
      validator: function(v) {
        return v instanceof Date && !isNaN(v.getTime());
      },
      message: 'A real valid date is required'
    }
  },
  category: {
    type: String,
    enum: {
      values: ['tech', 'cultural', 'sports'],
      message: 'Category must be tech, cultural or sports'
    },
    default: 'tech'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be at least 1'],
    max: [500, 'Capacity cannot exceed 500'],
    validate: [
      {
        validator: function(v) {
          return Number.isInteger(v);
        },
        message: 'Capacity must be a whole number'
      },
      {
        validator: function(v) {
          // Rule: the capacity of a cultural event may not exceed 200
          if (this.category === 'cultural') {
            return v <= 200;
          }
          return true;
        },
        message: 'The capacity of a cultural event may not exceed 200'
      }
    ]
  },
  fee: {
    type: Number,
    default: 0,
    min: [0, 'Fee must be 0 or more']
  }
});

export const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);
export default Event;
