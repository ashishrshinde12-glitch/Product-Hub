import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Email Transport Setup
  // Note: For Gmail, you need to use an App Password
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // API Route for Payment Notifications
  app.post("/api/payment-notification", async (req, res) => {
    const { type, buyerName, buyerPhone, utrNumber, productTitle, amount, message } = req.body;
    
    const subject = `Payment ${type === 'SUCCESS' ? 'Successful' : 'Failed'} - ${productTitle}`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: ${type === 'SUCCESS' ? '#22c55e' : '#ef4444'};">${subject}</h2>
        <p><strong>Buyer Name:</strong> ${buyerName}</p>
        <p><strong>Phone Number:</strong> ${buyerPhone}</p>
        <p><strong>UTR Number:</strong> ${utrNumber}</p>
        <p><strong>Product:</strong> ${productTitle}</p>
        ${amount ? `<p><strong>Amount:</strong> ₹${amount}</p>` : ''}
        ${message ? `<p><strong>Error Message:</strong> ${message}</p>` : ''}
        <p style="color: #666; font-size: 12px; margin-top: 20px;">Notification sent from Ashiieditzx Store</p>
      </div>
    `;

    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail({
          from: `"Ashiieditzx Alerts" <${process.env.EMAIL_USER}>`,
          to: "ashishrshinde15@gmail.com",
          subject: subject,
          html: html,
        });
        res.json({ status: "ok", message: "Email sent successfully" });
      } else {
        console.log("Email credentials not set. Notification details:", req.body);
        res.json({ status: "ok", message: "Email logged to console (credentials missing)" });
      }
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ status: "error", message: "Failed to send email" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
