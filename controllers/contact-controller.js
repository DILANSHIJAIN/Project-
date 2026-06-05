const Contact =require("../models/contact-model");
const { categorizeTicket, predictPriority } = require("../utils/ai");

const contactForm=async (req,res,next)=>{
    try{
        const response=req.body;
        const title = response.title || "Web Contact Form";
        const query = response.query || "";
        
        const category = categorizeTicket(title, query);
        const priority = predictPriority(title, query, category);

        const ticketData = {
            ...response,
            status: "Open",
            priority: priority,
            category: category,
            ai_summary: "Generated from contact form",
        };

        const ticket = await Contact.create(ticketData); 
        return res.status(200).json({
            message: "Ticket generated successfully",
            ticketId: ticket._id.toString()
        });
    }catch(error){
        next(error);
    }
};

// Get all contact messages for Admin
const getAllContacts = async (req, res, next) => {
    try {
        const contacts = await Contact.find();
        if (!contacts || contacts.length === 0) {
            return res.status(404).json({ message: "No messages found" });
        }
        return res.status(200).json(contacts);
    } catch (error) {
        next(error);
    }
};

// Delete contact message
const deleteContactById = async (req, res, next) => {
    try {
        const id = req.params.id;
        await Contact.deleteOne({ _id: id });
        return res.status(200).json({ message: "Contact Deleted Successfully" });
    } catch (error) {
        next(error);
    }
};

// Update contact message (The missing piece)
const updateContactById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const updateData = {};
        
        // Only include fields that are actually in the body
        ["name", "email", "phone", "category", "query", "status"].forEach(field => {
            if (req.body[field] !== undefined) updateData[field] = req.body[field];
        });
        
        const updatedContact = await Contact.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedContact) {
            return res.status(404).json({ message: "Contact not found" });
        }
        return res.status(200).json({ message: "Contact Updated Successfully", updatedContact });
    } catch (error) {
        next(error);
    }
};

module.exports = { 
    contactForm, 
    getAllContacts, 
    deleteContactById, 
    updateContactById 
};