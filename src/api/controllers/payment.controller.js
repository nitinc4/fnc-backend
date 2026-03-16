import ApiResponse from "../../utils/api_response.js";
import { Payment } from "../../models/payment/payment.model.js";
import { Setting } from "../../models/setting/setting.model.js";
import { User } from "../../models/auth/user.model.js";

class PaymentController {
    // App: Fetch UPI Details
    static async getUpiDetails(req, res) {
        try {
            const settings = await Setting.findOne();
            return res.status(200).json(ApiResponse.success('UPI Details', {
                upi_id: settings?.upi_id || "test@upi",
                payee_name: settings?.payee_name || "FNC",
                amount: settings?.subscription_amount || 999
            }));
        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message));
        }
    }

    // App: Create pending payment record
    static async createIntent(req, res) {
        try {
            const { user_id, transaction_ref, amount } = req.body;
            const payment = await Payment.create({
                user_id, transaction_ref, amount, status: 'pending'
            });
            return res.status(200).json(ApiResponse.success('Payment Intent Created', payment));
        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message));
        }
    }

    // App: Poll payment status
    static async checkStatus(req, res) {
        try {
            const { transaction_ref } = req.params;
            const payment = await Payment.findOne({ transaction_ref });
            if(!payment) return res.status(404).json(ApiResponse.error("Not found"));
            
            return res.status(200).json(ApiResponse.success('Status fetched', { status: payment.status }));
        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message));
        }
    }

    // Admin: Get all payments
    static async getAllPayments(req, res) {
        try {
            const payments = await Payment.find().populate('user_id', 'name email phone').sort({ createdAt: -1 });
            return res.status(200).json(ApiResponse.success('All Payments', payments));
        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message));
        }
    }

    // Admin: Manually Verify Payment
    static async verifyPayment(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body; // 'verified' or 'failed'
            
            const payment = await Payment.findByIdAndUpdate(id, { status }, { new: true });
            
            // If verified, set the user's plan to paid
            if (payment && status === 'verified') {
                await User.findByIdAndUpdate(payment.user_id, { plan: 'paid' });
            }

            return res.status(200).json(ApiResponse.success('Payment verified', payment));
        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message));
        }
    }
    // Admin: Update UPI Details
    static async updateUpiDetails(req, res) {
        try {
            const { upi_id, payee_name, subscription_amount } = req.body;
            
            // { upsert: true } is the magic here. If the DB is empty, it creates the first record!
            const settings = await Setting.findOneAndUpdate(
                {}, // Empty filter matches the first document it finds
                { upi_id, payee_name, subscription_amount },
                { new: true, upsert: true } 
            );
            
            return res.status(200).json(ApiResponse.success('Settings updated successfully', settings));
        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message));
        }
    }
}
export default PaymentController;