import mongoose from "mongoose";
import dotenv from "dotenv";
import { HealthIssue } from "../models/health_issue/health_issue.model.js";
import { DietPlan } from "../models/diet_plan/diet_plan.model.js";
import { Food } from "../models/food/food.model.js";
import { Meal } from "../models/meal/meal.model.js";
import { Nutrient } from "../models/nutrient.model.js";
import { User } from "../models/auth/user.model.js";

dotenv.config();

const mongoURI = process.env.MONGO_URI;

const HEALTH_ISSUES = [
  { name: "Cancer Care" },
  { name: "Pcod" },
  { name: "Pcos" },
  { name: "Bladder Stone Reversal" },
  { name: "Kidney Stone Reversal" },
  { name: "Thyroid" },
  { name: "Diabetes" },
  { name: "Blood Pressure" },
  { name: "Gastric Reversal" },
  { name: "Derma Care" },
  { name: "General plan" }
];

const VARIANTS = ["Weight Loss", "Weight Gain", "Weight Maintenance"];

const IDEAL_FOODS_MAP = {
  Diabetes: {
    veg: ["Bitter Gourd", "Fenugreek Seeds", "Oats", "Lentils", "Spinach", "Broccoli", "Cinnamon", "Green Beans", "Walnuts", "Greek Yogurt", "Apple"],
    nonVeg: ["Grilled Fish", "Chicken Breast", "Eggs", "Turkey", "Shrimp"],
    vegan: ["Tofu", "Quinoa", "Chia Seeds", "Almonds", "Soy Milk", "Flaxseeds"]
  },
  Pcod: {
    veg: ["Pumpkin Seeds", "Leafy Greens", "Berries", "Cinnamon", "Spearmint Tea", "Broccoli", "Avocado", "Sweet Potato", "Lentils"],
    nonVeg: ["Salmon", "Eggs", "Lean Chicken", "Cod", "Tuna"],
    vegan: ["Walnuts", "Flaxseeds", "Kale", "Tempeh", "Sunflower Seeds"]
  },
  Pcos: {
    veg: ["Pumpkin Seeds", "Leafy Greens", "Berries", "Cinnamon", "Spearmint Tea", "Broccoli", "Avocado", "Sweet Potato", "Lentils"],
    nonVeg: ["Salmon", "Eggs", "Lean Chicken", "Cod", "Tuna"],
    vegan: ["Walnuts", "Flaxseeds", "Kale", "Tempeh", "Sunflower Seeds"]
  },
  Thyroid: {
    veg: ["Brazil Nuts", "Greek Yogurt", "Spinach", "Strawberries", "Blueberries", "Pumpkin Seeds", "Asparagus"],
    nonVeg: ["Baked Fish", "Shrimp", "Tuna", "Sardines"],
    vegan: ["Seaweed", "Chickpeas", "Lentils", "Sesame Seeds"]
  },
  "Blood Pressure": {
    veg: ["Bananas", "Beets", "Oats", "Spinach", "Pistachios", "Pomegranate", "Celery", "Watermelon"],
    nonVeg: ["Grilled Salmon", "Chicken Breast", "Mackerel"],
    vegan: ["Avocados", "Garlic", "Lentils", "Flaxseeds"]
  },
  "Cancer Care": {
    veg: ["Broccoli", "Turmeric", "Green Tea", "Garlic", "Berries", "Carrots", "Mushroom", "Pomegranate", "Spinach"],
    nonVeg: ["Poached Fish", "Boiled Chicken", "Steamed Fish"],
    vegan: ["Tofu", "Walnuts", "Lentils", "Chia Seeds"]
  },
  "General plan": {
    veg: ["Rice", "Dal", "Paneer", "Spinach", "Potato", "Tomato", "Cucumber", "Curd", "Roti", "Mixed Veg"],
    nonVeg: ["Chicken Breast", "Eggs", "Fish", "Mutton", "Prawns"],
    vegan: ["Lentils", "Oats", "Tofu", "Chickpeas", "Soy Nuggets"]
  }
};

const buildMealOptions = (foods, count = 5, scale = 1) => {
  const shuffled = [...foods].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map(f => ({
    food_id: f._id,
    quantity: scale
  }));
};

async function seed() {
  try {
    await mongoose.connect(mongoURI);
    console.log("🚀 Connected to MongoDB");

    const admin = await User.findOne();

    const nutrientMap = {};
    const nutrients = await Nutrient.find({});
    nutrients.forEach(n => (nutrientMap[n.name.toLowerCase()] = n._id));

    const mealMap = {};
    const meals = await Meal.find({});
    meals.forEach(m => (mealMap[m.name] = m._id));

    // ✅ Ensure Protein Shake exists
    let proteinShake = await Food.findOne({ name: "Protein Shake" });
    if (!proteinShake) {
      proteinShake = await Food.create({
        name: "Protein Shake",
        nutrients_per_quantity: 100,
        calories_per_quantity: 120,
        serving: 1,
        meals: [mealMap["Breakfast"]],
        nutrients: [
          { nutrient_id: nutrientMap["protein"], quantity: 24 },
          { nutrient_id: nutrientMap["carbohydrate"], quantity: 3 },
          { nutrient_id: nutrientMap["fat"], quantity: 1 }
        ]
      });
    }

    const resolveFoods = async names => {
      const foods = [];
      for (const name of names) {
        let f = await Food.findOne({ name });
        if (!f) {
          f = await Food.create({
            name,
            nutrients_per_quantity: 100,
            calories_per_quantity: 150,
            serving: 1,
            meals: [mealMap["Lunch"], mealMap["Dinner"]],
            nutrients: [
              { nutrient_id: nutrientMap["protein"], quantity: 10 },
              { nutrient_id: nutrientMap["carbohydrate"], quantity: 20 },
              { nutrient_id: nutrientMap["fat"], quantity: 5 }
            ]
          });
        }
        foods.push(f);
      }
      return foods;
    };

    for (const issue of HEALTH_ISSUES) {
      const ideal = IDEAL_FOODS_MAP[issue.name] || IDEAL_FOODS_MAP["General plan"];

      for (const variant of VARIANTS) {
        let scale = 1;
        if (variant === "Weight Loss") scale = 0.8;
        if (variant === "Weight Gain") scale = 1.3;

        const allUniqueFoodsNames = [...new Set([...ideal.veg, ...ideal.nonVeg, ...ideal.vegan])];
        const allFoods = await resolveFoods(allUniqueFoodsNames);

        const plan = {
          created_by: admin._id,
          name: `${issue.name} - ${variant}`,
          variant,
          dietary_option: "all",
          isActive: true,

          // ✅ Combined all 3 into veg (and others for consistency)
          breakfast: {
            veg: [
              { food_id: proteinShake._id, quantity: scale },
              ...allFoods.slice(0, 5).map(f => ({ food_id: f._id, quantity: scale }))
            ],
            non_veg: [
              { food_id: proteinShake._id, quantity: scale },
              ...allFoods.slice(0, 5).map(f => ({ food_id: f._id, quantity: scale }))
            ],
            vegan: [
              { food_id: proteinShake._id, quantity: scale },
              ...allFoods.slice(0, 5).map(f => ({ food_id: f._id, quantity: scale }))
            ]
          },

          lunch: {
            veg: buildMealOptions(allFoods, 5, scale),
            non_veg: buildMealOptions(allFoods, 5, scale),
            vegan: buildMealOptions(allFoods, 5, scale)
          },

          dinner: {
            veg: buildMealOptions([...allFoods].reverse(), 5, scale),
            non_veg: buildMealOptions([...allFoods].reverse(), 5, scale),
            vegan: buildMealOptions([...allFoods].reverse(), 5, scale)
          },

          water: variant === "Weight Gain" ? 12 : 10,
          green_tea_target: 3,
          black_coffee_target: 2
        };

        await DietPlan.findOneAndUpdate(
          { name: plan.name },
          plan,
          { upsert: true }
        );
      }

      console.log(`✅ ${issue.name} done`);
    }

    console.log("🎉 ALL DIETS SEEDED SUCCESSFULLY");
    process.exit(0);
  } catch (err) {
    console.error("❌ ERROR:", err);
    process.exit(1);
  }
}

seed();