const User=require("../models/user-model");
const Contact=require("../models/contact-model");
const Service=require("../models/service-model");

// Ensure page-model.js is in your backend root or models folder
// If you move it to models/, change this to require("../models/page-model")
const Page = require("../page-model"); 

const getAllUsers=async(req,res,next)=>{
    try{
        const users=await User.find();
        if(!users || users.length===0){
        return res.status(404).json({message:"No users found"});
        }
        return res.status(200).json(users);

    }catch(error){
        next(error);
    }
};
const getAllContacts=async(req,res,next)=>{
    try{
        const contacts=await Contact.find();
        console.log(contacts); 
           if(!contacts || contacts.length===0){
        return res.status(404).json({message:"No contacts found"});
        }
        return res.status(200).json(contacts);
    }catch(error){
        next(error);
    }

};

const updateUserById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const updateUserData = req.body;

        const updatedData = await User.findByIdAndUpdate(
            id,
            { $set: updateUserData },
            { new: true, runValidators: true }
        );

        if (!updatedData) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json(updatedData);
    } catch (error) {
        next(error);
    }
};

const deleteUserById = async (req, res, next) => {
    try {
        const id = req.params.id;
        await User.deleteOne({ _id: id });
        return res.status(200).json({ message: "User Deleted Successfully" });
    } catch (error) {
        next(error);
    }
};

const deleteContactById = async (req, res, next) => {
    try {
        const id = req.params.id;
        await Contact.deleteOne({ _id: id });
        return res.status(200).json({ message: "Contact Deleted Successfully" });
    } catch (error) {
        next(error);
    }
};

const getAllServices = async (req, res, next) => {
    try {
        const services = await Service.find();
        return res.status(200).json(services);
    } catch (error) {
        next(error);
    }
};

const updateServiceById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const updateData = req.body;
        const updated = await Service.findByIdAndUpdate(id, { $set: updateData }, { new: true });
        return res.status(200).json(updated);
    } catch (error) {
        next(error);
    }
};

const deleteServiceById = async (req, res, next) => {
    try {
        const id = req.params.id;
        await Service.deleteOne({ _id: id });
        return res.status(200).json({ message: "Service Deleted Successfully" });
    } catch (error) {
        next(error);
    }
};

const getHomePageData = async (req, res, next) => {
    try {
        let page = await Page.findOne({ pageName: "home" });
        if (!page) {
            // Return default structure if not found to prevent frontend crashes
            return res.status(200).json({
                heroSubtitle: "Welcome to Ticketing System",
                heroTitle: "WELCOME TO AI-POWERED HELPDESK AND TICKETING SYSTEM",
                heroText: "Welcome to SmartDesk AI — the ultimate AI-powered helpdesk and ticketing platform.",
                heroCtaText: "Connect Now",
                analyticsCompanies: "50+",
                analyticsClients: "100,000+",
                analyticsDevelopers: "500+",
                analyticsAvailability: "24/7",
                ctaSubtitle: "We Are Here To Help You",
                ctaTitle: "GET STARTED TODAY",
                ctaBody: "Experience intelligent ticket management and seamless communication.",
                homeImage: "/images/home.png", // Default image for home page
                ctaImage: "/images/design.png" // Default image for CTA section
            });
        }
        return res.status(200).json(page.content);
    } catch (error) {
        next(error);
    }
};

const getAboutPageData = async (req, res, next) => {
    try {
        let page = await Page.findOne({ pageName: "about" });
        if (!page) {
            return res.status(200).json({
                title: "WHY CHOOSE US?",
                description: "Expertise: Our team is made up of highly skilled IT professionals...",
                mission: "Our mission is to ensure your systems remain stable and secure.",
                analyticsCompanies: "50+",
                analyticsProjects: "150+",
                analyticsClients: "250+",
                analyticsYoutube: "650k+",
                aboutImage: "/images/about.png" // Default image for about page
            });
        }
        return res.status(200).json(page.content);
    } catch (error) {
        next(error);
    }
};

const updateHomePageContent = async (req, res, next) => {
    try {
        const updatedPage = await Page.findOneAndUpdate(
            { pageName: "home" },
            { content: req.body },
            { new: true, upsert: true }
        );
        res.status(200).json({
            message: "Home page updated successfully",
            content: updatedPage.content
        });
    } catch (error) {
        next(error);
    }
};

const updateAboutPageContent = async (req, res, next) => {
    try {
        const updatedPage = await Page.findOneAndUpdate(
            { pageName: "about" },
            { content: req.body },
            { new: true, upsert: true }
        );
        res.status(200).json({
            message: "About page updated successfully",
            content: updatedPage.content
        });
    } catch (error) {
        next(error);
    }
};

const getContactPageData = async (req, res, next) => {
    try {
        let page = await Page.findOne({ pageName: "contact" });
        if (!page) {
            // Return default structure if not found to prevent frontend crashes
            return res.status(200).json({
                contactImage: "/images/contact.png", // Default image
                mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d224346.48167620343!2d77.06889926628777!3d28.52755440978482!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce3c6c1f8b7df%3A0x7c5f5d7b5d8c5f6d!2sNew%20Delhi%2C%20Delhi!5e0!3m2!1sen!2sin!4v1710000000000!5m2!1sen!2sin" // Default map
            });
        }
        return res.status(200).json(page.content);
    } catch (error) {
        next(error);
    }
};

const updateContactPageContent = async (req, res, next) => {
    try {
        const updatedPage = await Page.findOneAndUpdate(
            { pageName: "contact" },
            { content: req.body },
            { new: true, upsert: true, runValidators: true } // upsert: true creates the document if it doesn't exist, runValidators ensures schema validation
        );
        res.status(200).json({
            message: "Contact page updated successfully",
            content: updatedPage.content
        });
    } catch (error) {
        console.error("Error updating contact page content:", error); // Log the detailed error on the server
        res.status(500).json({
            message: "Failed to update contact content due to a server error.",
            extraDetails: error.message // Provide the actual error message from Mongoose/MongoDB
        });
    }
};

// Placeholder for your Ticket/Chat logic enhancement
const processAIChat = async (req, res) => {
    const { query, chatHistory, category } = req.body;
    
    /* 
       For Google Gemini:
       const chat = model.startChat({ history: chatHistory });
       const result = await chat.sendMessage(query);
       
       For Groq:
       const completion = await groq.chat.completions.create({
         messages: [...chatHistory, { role: "user", content: query }],
         model: "llama3-70b-8192",
       });
    */
    
    // This ensures the bot provides a "Valid Conversation" based on history.
};

module.exports = { 
    getAllUsers, getAllContacts, updateUserById, deleteUserById, deleteContactById,
    getAllServices, updateServiceById, deleteServiceById,
    getHomePageData, getAboutPageData, getContactPageData,
    updateHomePageContent, updateAboutPageContent, updateContactPageContent
};