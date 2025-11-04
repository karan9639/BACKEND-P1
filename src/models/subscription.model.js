import mongoose, {Schema} from "mongoose";
import bcrypt from "bcrypt";
import  jwt  from "jsonwebtoken";

const subscriptionSchema = new Schema({
    subscriber: {type: Schema.Types.ObjectId, ref: 'User', required: true}, // The user who is subscribing
    subscribedTo: {type: Schema.Types.ObjectId, ref: 'User', required: true}, // The user being subscribed to
}, {timestamps: true});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
