const Page = require("./page-model");

const getAboutPageContent = async (req, res) => {
    try {
        const aboutData = await Page.findOne({ pageName: "about" });
        
        if (!aboutData) {
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

        res.status(200).json(aboutData.content);
    } catch (error) {
        console.error("About page error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { getAboutPageContent };