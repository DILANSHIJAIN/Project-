const Service = require("../models/service-model");

const getServices = async (req, res, next) => {
    try {
        const services = await Service.find();
        
        if (!services || services.length === 0) {
            return res.status(404).json({ message: "No Service Found" });
        }

        return res.status(200).json(services);

    } catch (error) {
        console.error(`services error: ${error}`);
        next(error);
    }
};

const deleteServiceById = async (req, res) => {
    try {
        const id = req.params.id;
        await Service.deleteOne({ _id: id });
        return res.status(200).json({ message: "Service Deleted Successfully" });
    } catch (error) {
        res.status(500).json({ message: "Service deletion failed" });
    }
};

const updateServiceById = async (req, res) => {
    try {
        const id = req.params.id;
        const updatedServiceData = req.body;
        const updatedData = await Service.findByIdAndUpdate(
            id,
            { $set: updatedServiceData },
            { new: true }
        );
        return res.status(200).json(updatedData);
    } catch (error) {
        res.status(500).json({ message: "Service update failed" });
    }
};

const addReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { comment, rating } = req.body;
        const username = req.user.username; // Populated by authMiddleware

        const newReview = {
            username,
            comment,
            rating,
            date: new Date().toLocaleDateString('en-GB') // Matches your frontend format
        };

        const updatedService = await Service.findByIdAndUpdate(
            id,
            {
                $push: { reviews: newReview }
            },
            { new: true, runValidators: true }
        );

        if (!updatedService) {
            return res.status(404).json({ message: "Service not found" });
        }

        // Return the added review so frontend can update state
        return res.status(201).json(newReview);

    } catch (error) {
        console.error(`Add review error: ${error}`);
        res.status(500).json({ message: "Failed to add review", error: error.message });
    }
};

module.exports = { 
    getServices, 
    addReview,
    deleteServiceById,
    updateServiceById
};