import axios from 'axios';

export const fetchShopifyProductData = async (url) => {
    try {
        // Append .js to the URL as per your Python logic
        const jsonUrl = url.endsWith('.js') ? url : `${url}.js`;
        
        const response = await axios.get(jsonUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const data = response.data;

        return {
            title: data.title,
            description: data.description,
            price: data.price / 100, // Shopify cents to units
            images: data.images ? data.images.map(img => `https:${img}`) : [],
            brand: data.vendor,
            handle: data.handle,
            product_url: url
        };
    } catch (error) {
        throw new Error(`Failed to fetch product: ${error.message}`);
    }
};