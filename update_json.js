import fs from 'fs';

const FOOD_NUTRITION_MAP = {
    "Bitter Gourd": { cal: 17, p: 1.0, c: 3.7, f: 0.1, fib: 2.8 },
    "Fenugreek Seeds": { cal: 323, p: 23.0, c: 58.0, f: 6.4, fib: 24.6 },
    "Oats": { cal: 389, p: 16.9, c: 66.3, f: 6.9, fib: 10.6 },
    "Oatmeal": { cal: 389, p: 16.9, c: 66.3, f: 6.9, fib: 10.6 },
    "Lentils": { cal: 116, p: 9.0, c: 20.0, f: 0.4, fib: 7.9 },
    "Dal": { cal: 116, p: 9.0, c: 20.0, f: 0.4, fib: 7.9 },
    "Dal/Lentils": { cal: 116, p: 9.0, c: 20.0, f: 0.4, fib: 7.9 },
    "Grilled Fish": { cal: 105, p: 20.0, c: 0.0, f: 2.5, fib: 0.0 },
    "Chicken Breast": { cal: 165, p: 31.0, c: 0.0, f: 3.6, fib: 0.0 },
    "Lean Chicken": { cal: 165, p: 31.0, c: 0.0, f: 3.6, fib: 0.0 },
    "Grilled Chicken Breast": { cal: 165, p: 31.0, c: 0.0, f: 3.6, fib: 0.0 },
    "Boiled Chicken": { cal: 165, p: 31.0, c: 0.0, f: 3.6, fib: 0.0 },
    "Eggs": { cal: 155, p: 12.6, c: 1.1, f: 10.6, fib: 0.0 },
    "Tofu": { cal: 145, p: 15.0, c: 4.0, f: 8.0, fib: 1.0 },
    "Quinoa": { cal: 120, p: 4.4, c: 21.3, f: 1.9, fib: 2.8 },
    "Chia Seeds": { cal: 486, p: 16.5, c: 42.1, f: 30.7, fib: 34.4 },
    "Almonds": { cal: 579, p: 21.2, c: 21.7, f: 49.9, fib: 12.5 },
    "Pumpkin Seeds": { cal: 559, p: 30.2, c: 10.7, f: 49.1, fib: 6.0 },
    "Spinach": { cal: 23, p: 2.9, c: 3.6, f: 0.4, fib: 2.2 },
    "Leafy Greens": { cal: 23, p: 2.9, c: 3.6, f: 0.4, fib: 2.2 },
    "Berries": { cal: 50, p: 0.7, c: 12.0, f: 0.3, fib: 2.4 },
    "Cinnamon": { cal: 247, p: 4.0, c: 80.6, f: 1.2, fib: 53.1 },
    "Salmon": { cal: 208, p: 20.4, c: 0.0, f: 13.4, fib: 0.0 },
    "Grilled Salmon": { cal: 208, p: 20.4, c: 0.0, f: 13.4, fib: 0.0 },
    "Walnuts": { cal: 654, p: 15.2, c: 13.7, f: 65.2, fib: 6.7 },
    "Flaxseeds": { cal: 534, p: 18.3, c: 28.9, f: 42.2, fib: 27.3 },
    "Kale": { cal: 49, p: 4.3, c: 8.8, f: 0.9, fib: 3.6 },
    "Brazil Nuts": { cal: 656, p: 14.3, c: 12.3, f: 66.4, fib: 7.5 },
    "Greek Yogurt": { cal: 97, p: 10.0, c: 3.6, f: 5.0, fib: 0.0 },
    "Baked Fish": { cal: 105, p: 20.0, c: 0.0, f: 2.5, fib: 0.0 },
    "Sea Bass": { cal: 97, p: 18.0, c: 0.0, f: 2.3, fib: 0.0 },
    "Shrimp": { cal: 99, p: 24.0, c: 0.2, f: 0.3, fib: 0.0 },
    "Seaweed": { cal: 35, p: 5.8, c: 5.1, f: 0.3, fib: 0.0 },
    "Chickpeas": { cal: 164, p: 8.9, c: 27.0, f: 2.6, fib: 7.6 },
    "Cashews": { cal: 553, p: 18.2, c: 30.2, f: 43.8, fib: 3.3 },
    "Bananas": { cal: 89, p: 1.1, c: 22.8, f: 0.3, fib: 2.6 },
    "Beets": { cal: 43, p: 1.6, c: 9.6, f: 0.2, fib: 2.8 },
    "Low-fat Yogurt": { cal: 63, p: 5.3, c: 7.0, f: 1.5, fib: 0.0 },
    "Egg Whites": { cal: 52, p: 11.0, c: 0.7, f: 0.2, fib: 0.0 },
    "Avocados": { cal: 160, p: 2.0, c: 8.5, f: 14.7, fib: 6.7 },
    "Avocado": { cal: 160, p: 2.0, c: 8.5, f: 14.7, fib: 6.7 },
    "Garlic": { cal: 149, p: 6.4, c: 33.0, f: 0.5, fib: 2.1 },
    "Pistachios": { cal: 562, p: 20.3, c: 27.5, f: 45.4, fib: 10.6 },
    "Broccoli": { cal: 34, p: 2.8, c: 6.6, f: 0.4, fib: 2.6 },
    "Turmeric": { cal: 354, p: 8.0, c: 65.0, f: 10.0, fib: 21.1 },
    "Green Tea": { cal: 1, p: 0.2, c: 0.0, f: 0.0, fib: 0.0 },
    "Blueberries": { cal: 57, p: 0.7, c: 14.5, f: 0.3, fib: 2.4 },
    "Poached Fish": { cal: 100, p: 20.0, c: 0.0, f: 2.0, fib: 0.0 },
    "Soy Milk": { cal: 33, p: 3.3, c: 1.8, f: 1.9, fib: 0.6 },
    "Lemons": { cal: 29, p: 1.1, c: 9.3, f: 0.3, fib: 2.8 },
    "Watermelon": { cal: 30, p: 0.6, c: 7.6, f: 0.2, fib: 0.4 },
    "Basil": { cal: 23, p: 3.1, c: 2.7, f: 0.6, fib: 1.6 },
    "Cauliflower": { cal: 25, p: 1.9, c: 5.0, f: 0.3, fib: 2.0 },
    "White Fish": { cal: 100, p: 20.0, c: 0.0, f: 2.0, fib: 0.0 },
    "Cucumber": { cal: 15, p: 0.7, c: 3.6, f: 0.1, fib: 0.5 },
    "Red Bell Peppers": { cal: 31, p: 1.0, c: 6.0, f: 0.3, fib: 2.1 },
    "Ginger": { cal: 80, p: 1.8, c: 17.8, f: 0.8, fib: 2.0 },
    "Plain Yogurt": { cal: 61, p: 3.5, c: 4.7, f: 3.3, fib: 0.0 },
    "Rice": { cal: 130, p: 2.7, c: 28.0, f: 0.3, fib: 0.4 },
    "Steamed Fish": { cal: 100, p: 20.0, c: 0.0, f: 2.0, fib: 0.0 },
    "Coconut Water": { cal: 19, p: 0.7, c: 3.7, f: 0.2, fib: 0.0 },
    "Applesauce": { cal: 52, p: 0.3, c: 14.0, f: 0.1, fib: 1.2 },
    "Sweet Potatoes": { cal: 86, p: 1.6, c: 20.1, f: 0.1, fib: 3.0 },
    "Oranges": { cal: 47, p: 0.9, c: 11.8, f: 0.1, fib: 2.4 },
    "Oyster": { cal: 81, p: 9.5, c: 4.9, f: 2.3, fib: 0.0 },
    "Sun-dried tomatoes": { cal: 258, p: 14.1, c: 55.8, f: 3.0, fib: 12.3 },
    "Apple Cider Vinegar": { cal: 21, p: 0.0, c: 0.9, f: 0.0, fib: 0.0 },
    "Sprouts": { cal: 30, p: 3.0, c: 6.0, f: 0.2, fib: 1.1 },
    "Curd": { cal: 61, p: 3.5, c: 4.7, f: 3.3, fib: 0.0 },
    "Paneer": { cal: 265, p: 18.0, c: 3.1, f: 20.0, fib: 0.0 },
    "Mutton": { cal: 294, p: 25.0, c: 0.0, f: 21.0, fib: 0.0 },
    "Fish": { cal: 105, p: 20.0, c: 0.0, f: 2.5, fib: 0.0 },
    "Prawns": { cal: 99, p: 24.0, c: 0.2, f: 0.3, fib: 0.0 },
    "Potato": { cal: 77, p: 2.0, c: 17.5, f: 0.1, fib: 2.2 }
};

const jsonPath = 'c:/Users/nitin/OneDrive/Desktop/projects/Work/FNC/fnc-backend-main/fnc-backend-main/foods.json';
const foods = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

let count = 0;
const updatedFoods = foods.map(food => {
    if (FOOD_NUTRITION_MAP[food.name]) {
        const data = FOOD_NUTRITION_MAP[food.name];
        count++;
        return {
            ...food,
            calories: data.cal,
            protein: data.p,
            carbs: data.c,
            fat: data.f,
            fiber: data.fib || 0
        };
    }
    return food;
});

fs.writeFileSync(jsonPath, JSON.stringify(updatedFoods, null, 2));
console.log(`Updated ${count} foods in foods.json`);
