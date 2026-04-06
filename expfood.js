import "dotenv/config";
import fs from "fs";
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URI);

async function exportFoods() {
  try {
    await client.connect();
    const db = client.db();
    const foods = await db.collection("foods").find({}).toArray();

    console.log(`📦 Found ${foods.length} food items`);

    // ✅ Clean transform (flatten nutrients)
    const formatted = foods.map(food => {
      const nutrients = {
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0
      };

      if (food.nutrients && Array.isArray(food.nutrients)) {
        food.nutrients.forEach(n => {
          const id = n.nutrient_id?.toString();

          if (id === "69ce04a98e8f6f7980ad48ab") nutrients.protein = n.quantity;
          if (id === "69ce04a98e8f6f7980ad48b1") nutrients.carbs = n.quantity;
          if (id === "69ce04a98e8f6f7980ad48ae") nutrients.fat = n.quantity;
          if (id === "69ce04aa8e8f6f7980ad48b4") nutrients.fiber = n.quantity;
        });
      }

      return {
        id: food._id.toString(),
        name: food.name,
        category: food.category || "",
        calories: food.calories_per_quantity,
        quantity: food.nutrients_per_quantity,
        ...nutrients
      };
    });

    // ✅ Export JSON
    fs.writeFileSync(
      "foods.json",
      JSON.stringify(formatted, null, 2)
    );

    // ✅ Export CSV
    const csvHeader = "id,name,category,calories,quantity,protein,carbs,fat,fiber\n";
 
    const csvRows = formatted.map(f =>
      `${f.id},${f.name},${f.category},${f.calories},${f.quantity},${f.protein},${f.carbs},${f.fat},${f.fiber}`
    );

    fs.writeFileSync(
      "foods.csv",
      csvHeader + csvRows.join("\n")
    );

    console.log("✅ Export complete → foods.json & foods.csv");

  } catch (err) {
    console.error("❌ Export error:", err);
  } finally {
    await client.close();
  }
}

exportFoods();