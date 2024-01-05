// routes/appointment.js
const express = require("express");
const router = express.Router();
const moment = require("moment");
const Appointment = require("../models/Appointment");
const authenticateJWT = require("../middleware/authenticateJWT");
const nodemailer = require("nodemailer");
const axios = require("axios");
const jwt = require("jsonwebtoken");

// Configure nodemailer with your email service provider credentials
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "your_email@gmail.com",
    pass: "your_email_password",
  },
});

// Function to send confirmation email
const sendConfirmationEmail = (username, email, date, time, service) => {
  const mailOptions = {
    from: "your_email@gmail.com",
    to: email,
    subject: "Appointment Confirmation",
    text: `Dear ${username},\n\nYour appointment for ${service} on ${date} at ${time} has been confirmed.\n\nThank you!`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending confirmation email:", error);
    } else {
      console.log("Confirmation email sent:", info.response);
    }
  });
};

// Route for fetching available slots
router.get("/available-slots", authenticateJWT, async (req, res) => {
  try {
    const yourAuthToken = process.env.JWT_SECRET;

    // Make the API request
    const response = await axios.get(
      "https://localhost:5000/api/appointment/available-slots",
      {
        headers: {
          Authorization: `Bearer ${yourAuthToken}`,
        },
      }
    );

    // Extract availableSlots from the response
    const availableSlots = response.data.availableSlots;

    // Send the availableSlots as the response
    res.json({ availableSlots });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

const bookedAppointments = [];

// Route for booking an appointment
router.post("/book", authenticateJWT, async (req, res) => {
  try {
    const { date, time, service } = req.body;

    // Validate input data
    if (!date || !time || !service) {
      return res
        .status(400)
        .json({ message: "Date, time, and service are required" });
    }

    // Check if the date is in the future
    const appointmentDateTime = moment(`${date} ${time}`, "YYYY-MM-DD HH:mm");
    if (
      !appointmentDateTime.isValid() ||
      appointmentDateTime.isBefore(moment())
    ) {
      return res
        .status(400)
        .json({ message: "Invalid date and time for appointment" });
    }

    // Check if the appointment slot is available (example: not already booked)
    if (isAppointmentSlotAvailable(date, time)) {
      // Additional logic to store the appointment in the database, send confirmation emails, etc.
      const newAppointment = new Appointment({
        date,
        time,
        service,
        userId: req.user.userId, // Assuming you have userId in the JWT payload
      });

      await newAppointment.save();
      bookedAppointments.push(newAppointment);

      // Send confirmation email
      sendConfirmationEmail(
        req.user.username,
        req.user.email,
        date,
        time,
        service
      );

      res.json({
        message: "Appointment booked successfully",
        appointment: newAppointment,
      });
    } else {
      res.status(400).json({ message: "Appointment slot not available" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Function to check if an appointment slot is available
const isAppointmentSlotAvailable = (date, time) => {
  // Check against booked appointments or any other logic
  const existingAppointment = bookedAppointments.find(
    (appointment) => appointment.date === date && appointment.time === time
  );

  return !existingAppointment;
};

module.exports = router;
