// src/routes/search.routes.js
const express = require('express');
const router = express.Router();

// Optional models: try to load if present
let Product = null;
let Service = null;
try { Product = require('../models/Product'); } catch (_) {}
try { Service = require('../models/Service'); } catch (_) {}

const Event = require('../models/Event');

// Escape regex special chars in user input
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get('/', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 2) {
      return res.status(400).json({ message: 'Query must be at least 2 characters', results: { events: [], products: [], services: [] } });
    }

    const regex = new RegExp(escapeRegExp(q), 'i');

    // Search Events
    const events = await Event.find({
      $or: [
        { title: regex },
        { description: regex },
        { location: regex },
        { farmerName: regex },
        { farmerEmail: regex },
      ],
    })
      .limit(10)
      .lean();

    // Search Products (if model exists)
    let products = [];
    if (Product) {
      products = await Product.find({
        $or: [{ name: regex }, { description: regex }, { category: regex }],
      })
        .limit(10)
        .lean();
    }

    // Search Services (if model exists)
    let services = [];
    if (Service) {
      services = await Service.find({
        $or: [{ name: regex }, { description: regex }, { category: regex }],
      })
        .limit(10)
        .lean();
    }

    const total = events.length + products.length + services.length;

    return res.json({
      query: q,
      counts: { events: events.length, products: products.length, services: services.length },
      results: { events, products, services },
      message: total === 0 ? 'No results found' : undefined,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;