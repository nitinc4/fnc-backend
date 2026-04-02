import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fnc';

async function check() {
    await mongoose.connect(MONGO_URI);
    const HealthIssue = mongoose.model('HealthIssue', new mongoose.Schema({name: String}));
    const issues = await HealthIssue.find({});
    console.log('--- HEALTH ISSUES ---');
    console.log(issues.map(i => i.name));
    process.exit(0);
}
check();
