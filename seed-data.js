require("dotenv").config();
const mongoose = require("mongoose");
const Page = require("./page-model");
const Service = require("./models/service-model");
const connectDb = require("./utils/db");

const seedPages = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error("❌ MONGO_URI not found in .env file. Please ensure it's set correctly.");
            process.exit(1);
        }
        console.log("Attempting to connect to MongoDB Atlas...");
        await connectDb();
        
        const pages = [
            {
                pageName: "home",
                content: {
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
                }
            },
            {
                pageName: "about",
                content: {
                    title: "WHY CHOOSE US?",
                    description: "Expertise: Our team is made up of highly skilled IT professionals...",
                    mission: "Our mission is to ensure your systems remain stable and secure.",
                    analyticsCompanies: "50+",
                    analyticsProjects: "150+",
                    analyticsClients: "250+",
                    analyticsYoutube: "650k+",
                    aboutImage: "/images/about.png" // Default image for about page
                }
            }
        ];

        const sampleServices = [
            { service: "AI Technical Support", description: "Intelligent 24/7 technical assistance for your team.", price: "5000", provider: "SmartDesk AI" },
            { service: "System Health Monitor", description: "Real-time monitoring and predictive maintenance.", price: "3000", provider: "CloudWatch" },
            { service: "Network Optimization", description: "AI-driven bandwidth and security management.", price: "4500", provider: "NetWise" }
        ];

        console.log("Seeding pages...");
        for (const page of pages) {
            await Page.findOneAndUpdate(
                { pageName: page.pageName },
                { content: page.content },
                { upsert: true, new: true }
            );
            console.log(`✅ Seeded or updated "${page.pageName}" page`);
        }

        console.log("Seeding sample services...");
        for (const s of sampleServices) {
            await Service.findOneAndUpdate(
                { service: s.service },
                s,
                { upsert: true, new: true }
            );
        }
        console.log("✅ Seeded sample services");

        console.log("Database seeding completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error.message);
        process.exit(1);
    }
};

seedPages();