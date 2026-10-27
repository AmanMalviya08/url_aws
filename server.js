require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const shortid = require('shortid');
const Url = require('./models/Url');
const { apiLimiter, redirectLimiter } = require('./middleware/rateLimiter');

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parses incoming JSON requests

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// --- ROUTES ---

// 1. Create Short URL (Protected by Rate Limiter)
app.post('/api/shorten', apiLimiter, async (req, res) => {
  try {
    const { originalUrl } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Check if URL already exists (prevents duplicates)
    let url = await Url.findOne({ originalUrl });
    if (url) {
      return res.json({
        originalUrl: url.originalUrl,
        shortUrl: `${process.env.BASE_URL}/${url.shortId}`,
        clicks: url.clicks
      });
    }

    // Generate short ID
    const shortId = shortid.generate();

    url = new Url({
      originalUrl,
      shortId
    });

    await url.save();

    res.json({
      originalUrl: url.originalUrl,
      shortUrl: `${process.env.BASE_URL}/${url.shortId}`,
      clicks: url.clicks
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 2. Health / Root Route
app.get('/', async (req, res) => {
  res.json({ message: 'Server is running on port 5000' });
});

// 3. Redirect to Original URL (Protected by Rate Limiter)
app.get('/:shortId', redirectLimiter, async (req, res) => {
  try {
    const { shortId } = req.params;

    const url = await Url.findOne({ shortId });

    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    // Increment click count
    url.clicks++;
    await url.save();

    // Redirect user
    res.redirect(url.originalUrl);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Ready to accept connections at port ${PORT}`);
});
