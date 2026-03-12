import mongoose from "mongoose";

const userProfileSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    city: String,
    state: String,
    country: String,
    weight: Number,
    target_weight: Number,
    height: Number,
    //dob: Date,
    age: Number,
    gender: {
        type: String,
        enums: ["male", "female", "other",],
        lowercase: true
    },
    activity_level: {
        type: String,
        enums: ["sedentary", "lightlyactive", "moderatelyactive", "veryactive", "superactive",]
    },
    goal: String,
    diet_plans: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DietPlan",
        }
    ],
    health_issues: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "HealthIssue",
        }
    ],
}, { timestamps: true }
);


export const UserProfile = mongoose.model("UserProfile", userProfileSchema);