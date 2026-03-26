import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

class FatSecretUtil {
    constructor() {
        this.consumerKey = process.env.FATSECRET_CLIENT_ID;
        this.consumerSecret = process.env.FATSECRET_CLIENT_SECRET;
        this.apiUrl = 'https://platform.fatsecret.com/rest/server.api';
    }

    /**
     * RFC 3986 percentage encoding
     */
    _encode(str) {
        if (!str) return '';
        return encodeURIComponent(str)
            .replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
    }

    /**
     * Generate OAuth 1.0 HMAC-SHA1 signature
     */
    _generateSignature(method, url, params) {
        // 1. Collect and sort parameters
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${this._encode(key)}=${this._encode(params[key].toString())}`)
            .join('&');

        // 2. Construct signature base string
        const baseString = [
            method.toUpperCase(),
            this._encode(url),
            this._encode(sortedParams)
        ].join('&');

        // 3. Construct signing key (ConsumerSecret & TokenSecret - for 2-legged TokenSecret is empty)
        const signingKey = `${this._encode(this.consumerSecret)}&`;

        // 4. Calculate HMAC-SHA1
        return crypto
            .createHmac('sha1', signingKey)
            .update(baseString)
            .digest('base64');
    }

    /**
     * Prepare signed parameters for OAuth 1.0 request
     */
    _getSignedParams(apiMethod, apiParams = {}) {
        const oauthParams = {
            oauth_consumer_key: this.consumerKey,
            oauth_nonce: Math.random().toString(36).substring(2),
            oauth_signature_method: 'HMAC-SHA1',
            oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
            oauth_version: '1.0',
            method: apiMethod,
            format: 'json',
            region: 'IN',
            ...apiParams
        };

        const signature = this._generateSignature('GET', this.apiUrl, oauthParams);
        return { ...oauthParams, oauth_signature: signature };
    }

    /**
     * Search foods by expression (OAuth 1.0 Signed Request)
     */
    async searchFoods(searchExpression, maxResults = 20) {
        try {
            const params = this._getSignedParams('foods.search', {
                search_expression: searchExpression,
                max_results: maxResults,
            });

            const response = await axios.get(this.apiUrl, { params });

            if (response.data.error) {
                throw new Error(`FatSecret API Error: ${response.data.error.message} (Code: ${response.data.error.code})`);
            }

            return response.data.foods?.food || [];
        } catch (error) {
            console.error('FatSecret Search Error:', error.message);
            throw new Error(`Failed to search foods on FatSecret: ${error.message}`);
        }
    }

    /**
     * Get detailed food information (OAuth 1.0 Signed Request)
     */
    async getFoodDetails(foodId) {
        try {
            const params = this._getSignedParams('food.get.v2', {
                food_id: foodId,
            });

            const response = await axios.get(this.apiUrl, { params });

            if (response.data.error) {
                throw new Error(`FatSecret API Error: ${response.data.error.message} (Code: ${response.data.error.code})`);
            }

            return response.data.food;
        } catch (error) {
            console.error('FatSecret Details Error:', error.message);
            throw new Error(`Failed to get food details from FatSecret: ${error.message}`);
        }
    }
}

export default new FatSecretUtil();
