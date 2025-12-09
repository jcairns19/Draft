import models from '../database/models/index.js';
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
    const paymentMethods = await models.PaymentMethod.findAll({
      where: { user_id: userId },
      attributes: ['id', 'user_id', 'card_brand', 'card_number', 'card_exp_month', 'card_exp_year', 'billing_address', 'is_default', 'created_at'],
      order: [['created_at', 'DESC']]
    });

    res.json({ paymentMethods });
  } catch (err) {
    logger.error('Get payment methods error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Creates a new payment method for the authenticated user.
 * If the user has no existing payment methods, is_default will be set to true.
 * If is_default is set to true, all other payment methods for the user will be set to is_default = false.
 * @param {Object} req - Express request object with req.user populated by auth middleware, body containing payment details including optional is_default.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Sends JSON response with created payment method or error.
 */
export async function createPaymentMethod(req, res) {
  const userId = req.user.id;
  const { card_number, card_cvc, card_holder_name, card_brand, card_exp_month, card_exp_year, billing_address, is_default: initialIsDefault = false } = req.body || {};

  let is_default = initialIsDefault;

  if (!card_number || !card_cvc) {
    return res.status(400).json({ error: 'card_number and card_cvc are required' });
  }

  try {
    // Check if user has any existing payment methods
    const existingCount = await models.PaymentMethod.count({ where: { user_id: userId } });
    if (existingCount === 0) {
      is_default = true;
    }

    // If setting as default, unset all others
    if (is_default) {
      await models.PaymentMethod.update(
        { is_default: false },
        { where: { user_id: userId } }
      );
    }

    const paymentMethod = await models.PaymentMethod.create({
      user_id: userId,
      card_number,
      card_cvc,
      card_holder_name,
      card_brand,
      card_exp_month,
      card_exp_year,
      billing_address,
      is_default
    });

    // Mask card number for response
    const responseData = paymentMethod.toJSON();
    if (responseData.card_number) {
      responseData.card_number = responseData.card_number.slice(-4);
      delete responseData.card_cvc;
    }

    res.status(201).json({ paymentMethod: responseData });
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
    const deletedCount = await models.PaymentMethod.destroy({
      where: { id: paymentId, user_id: userId }
    });

    if (deletedCount === 0) {
      return res.status(404).json({ error: 'Payment method not found' });
    }
    res.json({ message: 'Payment method deleted successfully' });
  } catch (err) {
    logger.error('Delete payment method error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}