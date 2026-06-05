const { Schema, model } = require("mongoose");

const contactSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  category: { type: String, required: true, default: "General" }, // Added category
  query: { type: String, required: true },
  priority: { type: String, default: "P3" },
  status: { type: String, default: "Open" },
});

const Contact = model("Contact", contactSchema);
module.exports = Contact;