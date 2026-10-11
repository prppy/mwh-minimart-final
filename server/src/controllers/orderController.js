import { validationResult } from 'express-validator';
import * as OrderModel from '../models/orderModel.js';

const validationFailed = (req, res) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return false;
  res.status(400).json({
    error: { message: 'Validation failed', details: errors.array() }
  });
  return true;
};

/**
 * The logged-in user's own orders (My Orders page)
 */
export const getMyOrders = async (req, res) => {
  try {
    if (validationFailed(req, res)) return;

    const orders = await OrderModel.findOrdersByUser(req.user.userId, {
      limit: req.query.limit
    });

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

/**
 * Staff order list: ?scope=active|history|<status>&type=normal|preorder
 */
export const getOrders = async (req, res) => {
  try {
    if (validationFailed(req, res)) return;

    const orders = await OrderModel.findOrders({
      scope: req.query.scope || 'active',
      orderType: req.query.type,
      limit: req.query.limit
    });

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

/**
 * Staff status change: { status: 'ready' | 'collected' | 'cancelled' }
 */
export const updateOrderStatus = async (req, res) => {
  try {
    if (validationFailed(req, res)) return;

    const order = await OrderModel.updateOrderStatus(req.params.id, req.body.status);

    res.json({
      success: true,
      data: order,
      message: `Order ${order.ticketCode} is now ${order.status}`
    });
  } catch (error) {
    console.error('Update order status error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({ error: { message: error.message } });
    }
    if (error.message.includes('Invalid status') || error.message.includes('already updated')) {
      return res.status(409).json({ error: { message: error.message } });
    }

    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

/**
 * App settings (readable by everyone so residents can see the expiry rule)
 */
export const getSettings = async (req, res) => {
  try {
    const settings = await OrderModel.getSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

/**
 * Update settings (staff only): { ticketExpiryDays }
 */
export const updateSettings = async (req, res) => {
  try {
    if (validationFailed(req, res)) return;

    const settings = await OrderModel.updateSettings(req.body);
    res.json({ success: true, data: settings, message: 'Settings saved' });
  } catch (error) {
    console.error('Update settings error:', error);

    if (error.message.includes('must be between')) {
      return res.status(400).json({ error: { message: error.message } });
    }

    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};
