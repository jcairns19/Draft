import pool from '../database/config.js';
import logger from '../logger.js';

/**
 * Retrieves all payment methods associated with the authenticated user.
 * @param {Object} req - Express request object with req.user populated by auth middleware.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Sends JSON response with array of payment methods.
 */
export async function getPaymentMethods(req, res) {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      'SELECT id, user_id, card_brand, card_number, card_exp_month, card_exp_year, billing_address, is_default, created_at FROM payment_methods WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json({ paymentMethods: result.rows });
  } catch (err) {
    logger.error('Get payment methods error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Creates a new payment method for the authenticated user.
 * If is_default is set to true, all other payment methods for the user will be set to is_default = false.
 * @param {Object} req - Express request object with req.user populated by auth middleware, body containing payment details including optional is_default.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Sends JSON response with created payment method or error.
 */
export async function createPaymentMethod(req, res) {
  const userId = req.user.id;
  const { card_number, card_cvc, card_holder_name, card_brand, card_exp_month, card_exp_year, billing_address, is_default = false } = req.body || {};

  if (!card_number || !card_cvc) {
    return res.status(400).json({ error: 'card_number and card_cvc are required' });
  }

  try {
    // If setting as default, unset all others
    if (is_default) {
      await pool.query('UPDATE payment_methods SET is_default = FALSE WHERE user_id = $1', [userId]);
    }

    const query = `
      INSERT INTO payment_methods (user_id, card_number, card_cvc, card_holder_name, card_brand, card_exp_month, card_exp_year, billing_address, is_default)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, user_id, card_brand, card_number, card_exp_month, card_exp_year, billing_address, is_default, created_at
    `;
    const values = [userId, card_number, card_cvc, card_holder_name, card_brand, card_exp_month, card_exp_year, billing_address || null, is_default];

    const result = await pool.query(query, values);
    const paymentMethod = result.rows[0];

    // Mask card number for response
    if (paymentMethod.card_number) {
      paymentMethod.card_number = paymentMethod.card_number.slice(-4);
      delete paymentMethod.card_number;
      delete paymentMethod.card_cvc;
    }

    res.status(201).json({ paymentMethod });
  } catch (err) {
    logger.error('Create payment method error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Deletes a payment method for the authenticated user.
 * @param {Object} req - Express request object with req.user populated by auth middleware, params.id for payment method ID.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Sends JSON response confirming deletion or error.
 */
export async function deletePaymentMethod(req, res) {
  const userId = req.user.id;
  const paymentId = req.params.id;

  try {
    const result = await pool.query('DELETE FROM payment_methods WHERE id = $1 AND user_id = $2', [paymentId, userId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Payment method not found' });
    }
    res.json({ message: 'Payment method deleted successfully' });
  } catch (err) {
    logger.error('Delete payment method error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}