// src/utils/generateToken.js
import jwt from 'jsonwebtoken';

const generateToken = (res, id) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  // Set JWT as an HTTP-Only Cookie
  res.cookie('jwt', token, {
    httpOnly: true, // Cannot be accessed by client-side JS
    secure: process.env.NODE_ENV !== 'development', // Use HTTPS in production
    sameSite: 'strict', // Prevents CSRF attacks
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

export default generateToken;