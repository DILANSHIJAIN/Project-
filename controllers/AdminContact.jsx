import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../store/auth";
import { toast } from "react-toastify";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const AdminContact = () => {
    const [content, setContent] = useState({
        contactImage: "/images/contact.png", // Default image
        mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d224346.48167620343!2d77.06889926628777!3d28.52755440978482!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce3c6c1f8b7df%3A0x7c5f5d7b5d8c5f6d!2sNew%20Delhi%2C%20Delhi!5e0!3m2!1sen!2sin!4v1710000000000!5m2!1sen!2sin" // Default map
    });
    const { authorizationToken, isAdmin, isLoading } = useAuth();

    const getContactContent = async () => {
        if (!authorizationToken) return;
        try {
            const response = await fetch(`${API_URL}/api/admin/contact-content`, {
                method: "GET",
                headers: { Authorization: authorizationToken },
            });
            if (response.ok) {
                const data = await response.json();
                setContent(data);
            } else {
                toast.error("Failed to fetch contact page content for editing.");
            }
        } catch (error) {
            console.error("Error fetching contact content:", error.message);
            toast.error("Error fetching contact page content.");
        }
    };

    const handleInput = (e) => {
        const { name, value } = e.target;
        setContent({ ...content, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/api/admin/contact-content`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: authorizationToken,
                },
                body: JSON.stringify(content),
            });
            if (response.ok) {
                toast.success("Contact page content updated successfully");
            } else {
                console.error("AdminContact: Server response not OK:", response); // Log the full response for debugging
                let errorData = {};
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    errorData = await response.json();
                } else {
                    errorData.message = await response.text() || response.statusText;
                }
                toast.error(errorData.extraDetails || errorData.message || `Failed to update contact content. Status: ${response.status}`);
            }
        } catch (error) {
            console.error("Update error:", error);
            toast.error("Update failed");
        }
    };

    useEffect(() => {
        if (!isLoading && isAdmin) {
            getContactContent();
        }
    }, [isLoading, isAdmin, authorizationToken]);

    if (isLoading) return <h1 className="main-heading">Verifying Admin Access...</h1>;

    if (!isAdmin) {
        return (
            <section style={{ padding: "4rem 0", background: "#0f172a", minHeight: "100vh", color: "white", textAlign: "center" }}>
                <div className="container">
                    <h1>⛔ Access Denied</h1>
                    <p style={{ fontSize: "1.8rem", marginTop: "1rem" }}>You do not have permission to access this page.</p>
                    <NavLink to="/" className="btn" style={{ marginTop: "2rem", display: "inline-block" }}>Go Home</NavLink>
                </div>
            </section>
        );
    }

    return (
        <section className="section-admin-contact" style={{ padding: "4rem 0", background: "#0f172a", minHeight: "100vh", color: "white" }}>
            <div className="container">
                <NavLink to="/admin-dashboard" style={{ color: "var(--btn-color)", fontSize: "1.6rem", marginBottom: "2rem", display: "inline-block" }}>
                    ← Back to Dashboard
                </NavLink>
                <h1 className="main-heading">Edit Contact Page Content</h1>
                <form onSubmit={handleSubmit} style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
                    <div>
                        <label className="form-label" htmlFor="contactImage">Contact Image URL</label>
                        <input 
                            type="text" 
                            id="contactImage"
                            name="contactImage" 
                            value={content.contactImage} 
                            onChange={handleInput} 
                            placeholder="e.g., /images/contact.png or a full URL"
                            style={{ width: "100%", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #334155", background: "#1e293b", color: "white" }}
                        />
                        {content.contactImage && (
                            <div style={{ marginTop: "1rem", textAlign: "center" }}>
                                <p style={{ fontSize: "1.4rem", marginBottom: "0.5rem", color: "#94a3b8" }}>Image Preview:</p>
                                <img src={content.contactImage} alt="Contact Page Preview" style={{ maxWidth: "200px", maxHeight: "150px", objectFit: "cover", borderRadius: "0.5rem", border: "1px solid #334155" }} />
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="form-label" htmlFor="mapEmbedUrl">Google Map Embed URL (iframe src)</label>
                        <textarea 
                            id="mapEmbedUrl"
                            name="mapEmbedUrl" 
                            value={content.mapEmbedUrl} 
                            onChange={handleInput} 
                            placeholder="Paste the full iframe src URL here"
                            style={{ width: "100%", padding: "1rem", borderRadius: "0.5rem", minHeight: "150px", border: "1px solid #334155", background: "#1e293b", color: "white" }}
                        />
                    </div>
                    <button type="submit" className="btn">Update Contact Content</button>
                </form>
            </div>
        </section>
    );
};