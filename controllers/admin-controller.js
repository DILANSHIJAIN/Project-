const User=require("../models/user-model");
const Contact=require("../models/contact-model");
const Service=require("../models/service-model");
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

        const updatedData = await User.updateOne(
            { _id: id },
            { $set: updateUserData }
        );
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

module.exports = { 
    getAllUsers, getAllContacts, updateUserById, deleteUserById, deleteContactById,
    getAllServices, updateServiceById, deleteServiceById,
    getHomePageData, getAboutPageData,
    updateHomePageContent, updateAboutPageContent
};