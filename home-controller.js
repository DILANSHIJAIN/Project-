const Page = require("./page-model");

const getHomePageContent = async (req, res) => {
    try {
        const homeData = await Page.findOne({ pageName: "home" });
        
        if (!homeData) {
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
        
        res.status(200).json(homeData.content);
    } catch (error) {
        console.error("Home page error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { getHomePageContent };