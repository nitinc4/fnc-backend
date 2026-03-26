import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class FatSecretUtil {
    constructor() {
        this.clientId = process.env.FATSECRET_CLIENT_ID;
        this.clientSecret = process.env.FATSECRET_CLIENT_SECRET;
        this.tokenUrl = 'https://oauth.fatsecret.com/connect/token';
        this.apiUrl = 'https://platform.fatsecret.com/rest/server.api';
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    /**
     * Get or refresh OAuth 2.0 access token
     */
    async getAccessToken() {
        // Return cached token if it's still valid (with 1-minute buffer)
        if (this.accessToken && this.tokenExpiry && Date.now() < (this.tokenExpiry - 60000)) {
            return this.accessToken;
        }

        try {
            const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
            const response = await axios.post(this.tokenUrl, 'grant_type=client_credentials&scope=basic', {
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            const { access_token, expires_in } = response.data;
            this.accessToken = access_token;
            this.tokenExpiry = Date.now() + (expires_in * 1000);
            
            return this.accessToken;
        } catch (error) {
            console.error('FatSecret OAuth Error:', error.response?.data || error.message);
            throw new Error('Failed to retrieve FatSecret access token');
        }
    }

    /**
     * Search foods by expression
     */
    async searchFoods(searchExpression, maxResults = 20) {
        const token = await this.getAccessToken();
        try {
            const response = await axios.get(this.apiUrl, {
                headers: { 'Authorization': `Bearer ${token}` },
                params: {
                    method: 'foods.search',
                    search_expression: searchExpression,
                    format: 'json',
                    max_results: maxResults,
                },
            });

            return response.data.foods?.food || [];
        } catch (error) {
            console.error('FatSecret Search Error:', error.response?.data || error.message);
            throw new Error(`Failed to search foods on FatSecret: ${error.message}`);
        }
    }

    /**
     * Get detailed food information including nutrition facts
     */
    async getFoodDetails(foodId) {
        const token = await this.getAccessToken();
        try {
            const response = await axios.get(this.apiUrl, {
                headers: { 'Authorization': `Bearer ${token}` },
                params: {
                    method: 'food.get.v2',
                    food_id: foodId,
                    format: 'json',
                },
            });

            return response.data.food;
        } catch (error) {
            console.error('FatSecret Details Error:', error.response?.data || error.message);
            throw new Error(`Failed to get food details from FatSecret: ${error.message}`);
        }
    }
}

export default new FatSecretUtil();
