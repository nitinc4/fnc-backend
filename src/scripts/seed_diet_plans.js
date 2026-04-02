import mongoose from "mongoose";
import dotenv from "dotenv";
import { HealthIssue } from "../models/health_issue/health_issue.model.js";
import { DietPlan } from "../models/diet_plan/diet_plan.model.js";
import { User } from "../models/auth/user.model.js";
import { Food } from "../models/food/food.model.js";
import { Nutrient } from "../models/nutrient.model.js";
import { Meal } from "../models/meal/meal.model.js";

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected");
    } catch (err) {
        console.error("❌ Connection Error:", err);
        process.exit(1);
    }
};

const seedData = async () => {
    await connectDB();

    try {
        // 1. Get or Create Admin User
        let admin = await User.findOne({ role: "admin" });
        if (!admin) {
            admin = await User.findOne(); // Get any user if no admin exists
        }
        if (!admin) {
            console.log("❌ No user found to assign as creator.");
            return;
        }

        // 2. Define Health Issues
        const healthIssuesData = [
            { name: "Cancer Care", cause: "Genetic mutations, environment", treatment: "High protein, antioxidant rich diet", risk_factor: 8 },
            { name: "Pcod/Pcos", cause: "Hormonal imbalance", treatment: "Low GI, high fiber diet", risk_factor: 5 },
            { name: "Bladder Stone Reversal", cause: "Dehydration, high mineral intake", treatment: "High fluid, low oxalate diet", risk_factor: 6 },
            { name: "Kidney Stone Reversal", cause: "High sodium, dehydration", treatment: "Citrus fruits, high hydration", risk_factor: 7 },
            { name: "Thyroid", cause: "Iodine deficiency, autoimmune", treatment: "Selenium and Zinc rich diet", risk_factor: 5 },
            { name: "Diabetes", cause: "Insulin resistance", treatment: "Low carb, complex sugar diet", risk_factor: 7 },
            { name: "Blood Pressure", cause: "High sodium, stress", treatment: "Low sodium, high potassium diet", risk_factor: 6 },
            { name: "Weight Loss", cause: "Sedentary lifestyle, high calories", treatment: "Calorie deficit, high protein", risk_factor: 4 },
            { name: "Gastric Reversal", cause: "Acidic foods, irregular eating", treatment: "Early to digest, non-acidic diet", risk_factor: 5 },
            { name: "Derma Care", cause: "Poor hydration, lack of vitamins", treatment: "Vitamins A, C, E and Omega-3", risk_factor: 3 }
        ];

        console.log("Seeding Health Issues...");
        const healthIssues = [];
        for (const data of healthIssuesData) {
            let issue = await HealthIssue.findOne({ name: data.name });
            if (!issue) {
                issue = await HealthIssue.create(data);
            }
            healthIssues.push(issue);
        }

        // 3. Create Basic Foods (if not exist)
        const foodsData = [
            { name: "Protein Shake", calories: 150, quantity: 1, serving: 1 },
            { name: "Grilled Chicken", calories: 250, quantity: 100, serving: 100 },
            { name: "Paneer Curry", calories: 300, quantity: 150, serving: 150 },
            { name: "Tofu Salad", calories: 180, quantity: 120, serving: 120 },
            { name: "Brown Rice", calories: 200, quantity: 100, serving: 100 },
            { name: "Lentil Soup", calories: 160, quantity: 200, serving: 200 },
            { name: "Steamed Fish", calories: 220, quantity: 150, serving: 150 },
            { name: "Greek Yogurt", calories: 120, quantity: 150, serving: 150 },
            { name: "Oats Khichdi", calories: 210, quantity: 150, serving: 150 }
        ];

        console.log("Checking/Creating Foods...");
        const foods = {};
        for (const data of foodsData) {
            let food = await Food.findOne({ name: data.name });
            if (!food) {
                // Mock Nutrient if none exist
                let nutrient = await Nutrient.findOne();
                if (!nutrient) nutrient = await Nutrient.create({ name: "General", type: "macro" });

                food = await Food.create({
                    name: data.name,
                    description: `${data.name} for diet plans`,
                    calories_per_quantity: data.calories,
                    nutrients_per_quantity: data.quantity,
                    serving: data.serving,
                    nutrients: [{ nutrient_id: nutrient._id, quantity: 10 }]
                });
            }
            foods[data.name] = food;
        }

        // 4. Seeding Diet Plans
        const variants = ['Weight Loss', 'Weight Gain', 'Maintain Weight'];
        const options = ['Veg', 'Non-Veg', 'Vegan'];

        console.log("Seeding 90 Diet Plan variants...");
        await DietPlan.deleteMany({}); // Optional: clear existing plans for fresh seed

        for (const issue of healthIssues) {
            for (const variant of variants) {
                for (const option of options) {
                    const planName = `${issue.name} - ${variant} (${option})`;
                    
                    // Simple logic for lunch/dinner based on option
                    let lunchFood = foods["Brown Rice"];
                    let dinnerFood = foods["Lentil Soup"];

                    if (option === 'Veg') {
                        lunchFood = foods["Paneer Curry"];
                        dinnerFood = foods["Oats Khichdi"];
                    } else if (option === 'Non-Veg') {
                        lunchFood = foods["Grilled Chicken"];
                        dinnerFood = foods["Steamed Fish"];
                    } else if (option === 'Vegan') {
                        lunchFood = foods["Tofu Salad"];
                        dinnerFood = foods["Lentil Soup"];
                    }

                    await DietPlan.create({
                        name: planName,
                        description: `Custom formulated diet plan for ${issue.name} focusing on ${variant} for ${option} users.`,
                        created_by: admin._id,
                        start_date: new Date(),
                        end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                        health_issues: [issue._id],
                        variant: variant,
                        dietary_option: option,
                        breakfast: [{ food_id: foods["Protein Shake"]._id, quantity: 1 }],
                        lunch: [{ food_id: lunchFood._id, quantity: 1 }],
                        dinner: [{ food_id: dinnerFood._id, quantity: 1 }],
                        water_target: 10,
                        green_tea_target: 4,
                        black_coffee_target: 2
                    });
                }
            }
        }

        console.log("✅ All 90 Diet Plans seeded successfully!");
        process.exit(0);

    } catch (err) {
        console.error("❌ Seeding Error:", err);
        process.exit(1);
    }
};

seedData();
