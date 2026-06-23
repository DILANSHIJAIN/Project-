import { useState, useEffect, useRef } from "react";
import { useAuth } from "../store/auth"; 
import { toast } from "react-toastify";

// 🚀 Pull raw environment variable safely
const RAW_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// 🧹 AUTO-CLEAN: Automatically trims any trailing slash to avoid double slash (//) paths during fetch handshakes
const API_URL = RAW_API_URL.endsWith('/') ? RAW_API_URL.slice(0, -1) : RAW_API_URL;

// Full list of categories from your project specs
const CATEGORIES = [
    "General", "Technical", "Billing", "Login & Authentication", 
    "Account Management", "Infrastructure", "Security", "Data & Database", 
    "Bug Report", "Service Request", "Performance Issues", "Complaint", 
    "Integration & API", "Printing", "Email & Collaboration", 
    "Feature Request", "Vehicle Maintenance", "Traffic & Logistics"
];

export const Chat = () => {
    const [message, setMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [suggestions, setSuggestions] = useState([]); 
    const [selectedImages, setSelectedImages] = useState([]); 
    const [inputError, setInputError] = useState(false); // ✅ FIXED: Declared missing validation state reference
    const { user, authorizationToken, isLoading } = useAuth();
    const scrollRef = useRef(null);
    const [chatLog, setChatLog] = useState([]);

    // 10. PREDICTIVE SUGGESTIONS (Feature 10)
    const commonPrompts = [
        "Internet is slow", "My SIM has no signal", "How to change address?", 
        "What is my ticket status?", "Billing issue", "Password reset"
    ];

    const handleInputChange = (e) => {
        const val = e.target.value;
        setMessage(val);
        if (inputError) setInputError(false); // Clear error layout once user types
        if (val.length > 2) {
            const matches = commonPrompts.filter(p => p.toLowerCase().includes(val.toLowerCase())).slice(0, 3);
            setSuggestions(matches);
        } else {
            setSuggestions([]);
        }
    };

    // 11. VOICE TICKET CREATION (Feature 11)
    const startVoiceRecognition = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return toast.error("Voice recognition not supported in this browser.");
        
        const recognition = new SpeechRecognition();
        recognition.onstart = () => setIsTyping(true);
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
            setIsTyping(false);
        };
        recognition.start();
    };

    // Set initial greeting once user data is available
    useEffect(() => {
        if (!isLoading && user && chatLog.length === 0) {
            setChatLog([
                { role: "bot", content: `Hello ${user.username}! I am your AI assistant. How can I help you with your tickets today?` }
            ]);
        }
    }, [user, isLoading, chatLog]);

    // Auto-scroll to the bottom whenever messages change
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatLog, isTyping]);

    const handleSendMessage = async (e, forceTicket = false) => {
        if (e) e.preventDefault();
        if (!message.trim() && selectedImages.length === 0) {
            setInputError(true);
            return;
        }

        const userQuery = message || (selectedImages.length > 1 ? "Images Uploaded" : "Image Uploaded");
        const imagesToUpload = [...selectedImages]; 
        
        setMessage("");
        setSelectedImages([]);
        setSuggestions([]);
        setIsTyping(true);
        setInputError(false);

        try {
            let uploadedUrls = [];

            // 1. Upload all selected images
            for (const image of imagesToUpload) {
                const formData = new FormData();
                formData.append("image", image);

                const uploadRes = await fetch(`${API_URL}/api/upload`, {
                    method: "POST",
                    headers: { "Authorization": authorizationToken },
                    body: formData,
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    uploadedUrls.push(uploadData.filePath);
                }
            }

            // 2. Add user message to log (with images if uploaded)
            setChatLog((prev) => [...prev, { 
                role: "user", 
                content: userQuery, 
                images: uploadedUrls.map(url => `${API_URL}${url}`)
            }]);

            // Construct query string with multiple image references
            let queryWithImages = userQuery;
            if (uploadedUrls.length > 0) {
                queryWithImages += ` (Attached Images: ${uploadedUrls.join(", ")})`;
            }

            const response = await fetch(`${API_URL}/api/tickets`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": authorizationToken,
                },
                body: JSON.stringify({
                    query: queryWithImages,
                    name: user?.username || "Guest",
                    email: user?.email || "anonymous@example.com",
                    phone: user?.phone || "0000000000",
                    title: "New AI Support Request",
                    forceTicket: forceTicket
                }),
            });

            const data = await response.json();
            setIsTyping(false);

            if (response.ok) {
                if (data.ticketSaved) {
                    setChatLog((prev) => [...prev, {
                        role: "bot",
                        content: `✅ **Ticket Created!** I've categorized this as **${data.ticket.category}**.`,
                        isTicket: true,
                        ticketId: data.ticket._id,
                        category: data.ticket.category
                    }]);
                } else {
                    setChatLog((prev) => [...prev, { role: "bot", content: data.aiResult }]);
                }
            } else {
                setChatLog((prev) => [...prev, { role: "bot", content: data.message || "Sorry, I couldn't process that ticket right now." }]);
            }
        } catch (error) {
            setIsTyping(false);
            console.error("Error creating ticket:", error);
            setChatLog((prev) => [...prev, { role: "bot", content: "An error occurred while connecting to the server." }]);
        }
    };

    const handleCategoryChange = async (ticketId, newCategory) => {
        try {
            const response = await fetch(`${API_URL}/api/tickets/${ticketId}/category`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": authorizationToken,
                },
                body: JSON.stringify({ category: newCategory }),
            });

            if (response.ok) {
                toast.success(`Category updated to ${newCategory}`);
                setChatLog(prev => prev.map(msg => 
                    msg.ticketId === ticketId ? { ...msg, category: newCategory } : msg
                ));
            }
        } catch (error) {
            console.error("Update error:", error);
            toast.error("Failed to update category");
        }
    };

    if (isLoading) return <h1 className="main-heading">Loading Assistant...</h1>;

    return (
        <section className="section-chat" style={{ padding: "12rem 0 6rem 0", background: "#0f172a", minHeight: "100vh" }}>
            <div className="container">
                <h1 className="main-heading">AI Chat Assistant</h1>
                <div className="chat-window" style={{ 
                    background: "#1e293b", 
                    borderRadius: "1rem", 
                    padding: "2rem", 
                    marginTop: "2rem",
                    minHeight: "400px",
                    display: "flex",
                    flexDirection: "column"
                }}>
                    <div className="chat-messages" style={{ flexGrow: 1, overflowY: "auto", marginBottom: "2rem", paddingRight: "1rem" }}>
                        {chatLog.map((chat, index) => (
                            <div key={index} style={{ marginBottom: "1rem", textAlign: chat.role === "user" ? "right" : "left" }}>
                                <div style={{ display: "inline-block", padding: "1rem", borderRadius: "1rem", background: chat.role === "user" ? "var(--btn-color)" : "#334155", maxWidth: "70%", whiteSpace: "pre-wrap" }}>
                                    {chat.images && chat.images.map((imgUrl, idx) => (
                                        <img 
                                            key={idx}
                                            src={imgUrl} 
                                            alt="Uploaded attachment" 
                                            style={{ maxWidth: "100%", borderRadius: "0.5rem", marginBottom: "0.5rem", display: "block" }} 
                                        />
                                    ))}
                                    <p style={{ margin: 0, fontSize: "1.6rem" }}>{chat.content}</p>
                                    
                                    {!chat.isTicket && chat.role === "bot" && chat.content.includes("proceed with a ticket") && (
                                        <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
                                            <button onClick={() => { setMessage("Please proceed with the ticket."); handleSendMessage(null, true); }} style={{ padding: "0.5rem 1rem", borderRadius: "0.4rem", background: "#cc0000", border: "none", color: "white", cursor: "pointer", fontSize: "1.2rem" }}>Create Ticket</button>
                                            <button onClick={() => setChatLog(prev => [...prev, { role: "bot", content: "Great! I'm glad I could help. Let me know if you need anything else." }])} style={{ padding: "0.5rem 1rem", borderRadius: "0.4rem", background: "#10b981", border: "none", color: "white", cursor: "pointer", fontSize: "1.2rem" }}>It's Fixed</button>
                                        </div>
                                    )}
                                    
                                    {chat.isTicket && (
                                        <div style={{ marginTop: "1.5rem", borderTop: "1px solid #4b5563", paddingTop: "1rem" }}>
                                            <p style={{ fontSize: "1.2rem", color: "#94a3b8", marginBottom: "0.5rem" }}>Wrong category? Select the right one:</p>
                                            <select 
                                                value={chat.category}
                                                onChange={(e) => handleCategoryChange(chat.ticketId, e.target.value)}
                                                style={{ 
                                                    width: "100%", 
                                                    padding: "0.5rem", 
                                                    background: "#1e293b", 
                                                    color: "white", 
                                                    border: "1px solid #4b5563",
                                                    borderRadius: "0.4rem",
                                                    fontSize: "1.3rem"
                                                }}
                                            >
                                                {CATEGORIES.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div style={{ textAlign: "left", marginBottom: "1rem" }}>
                                <div style={{ display: "inline-block", padding: "1rem", borderRadius: "1rem", background: "#334155", color: "#94a3b8", fontSize: "1.4rem" }}>
                                    AI is typing...
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                    <div className="chat-input-container" style={{ position: "relative" }}>
                        {suggestions.length > 0 && (
                            <div className="suggestions" style={{ position: "absolute", bottom: "100%", left: 0, width: "100%", background: "#334155", borderRadius: "0.5rem", marginBottom: "0.5rem", padding: "0.5rem", zIndex: 10 }}>
                                {suggestions.map((s, i) => (
                                    <div key={i} onClick={() => { setMessage(s); setSuggestions([]); }} style={{ padding: "0.5rem", cursor: "pointer", fontSize: "1.4rem", borderBottom: "1px solid #475569" }}>{s}</div>
                                ))}
                            </div>
                        )}
                        {selectedImages.length > 0 && (
                            <div style={{ 
                                background: "#0f172a", 
                                padding: "1rem", 
                                borderRadius: "0.5rem", 
                                border: "1px solid #334155", 
                                display: "flex", 
                                gap: "1rem", 
                                flexWrap: "wrap", 
                                marginBottom: "1rem",
                                zIndex: 10,
                                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.5)"
                            }}>
                                {selectedImages.map((file, idx) => (
                                    <div key={idx} style={{ 
                                        background: "#1e293b", 
                                        padding: "0.8rem 1.2rem", 
                                        borderRadius: "0.5rem", 
                                        display: "flex", 
                                        alignItems: "center", 
                                        gap: "1rem", 
                                        border: "1px solid #475569",
                                        color: "white"
                                    }}>
                                        <span style={{ fontSize: "1.4rem" }}>📎 {file.name.length > 15 ? file.name.substring(0, 12) + "..." : file.name}</span>
                                        <button 
                                            type="button" 
                                            onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== idx))} 
                                            style={{ 
                                                background: "#ef4444", 
                                                color: "white", 
                                                border: "none", 
                                                borderRadius: "50%", 
                                                width: "2.4rem", 
                                                height: "2.4rem", 
                                                display: "flex", 
                                                alignItems: "center", 
                                                justifyContent: "center", 
                                                cursor: "pointer", 
                                                fontSize: "1.8rem",
                                                fontWeight: "bold",
                                                lineHeight: 1,
                                                transition: "transform 0.2s"
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                                            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                                            title="Remove image"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                            <label style={{ cursor: "pointer", fontSize: "2.4rem" }}>
                                📷
                                <input 
                                    type="file" 
                                    hidden
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => { setSelectedImages(prev => [...prev, ...Array.from(e.target.files)]); toast.info(`${e.target.files.length} more image(s) added.`); }}
                                />
                            </label>
                            <button type="button" onClick={startVoiceRecognition} style={{ background: "none", border: "none", fontSize: "2.4rem", cursor: "pointer" }}>🎤</button>
                            <input 
                                type="text" 
                                value={message} 
                                onChange={handleInputChange}
                                placeholder="Ask about your tickets..."
                                style={{ flexGrow: 1, padding: "1rem", borderRadius: "0.5rem", border: inputError ? "3px solid #cc0000" : "none", boxShadow: inputError ? "0 0 8px rgba(204, 0, 0, 0.6)" : "none", fontSize: "1.6rem" }}
                            />
                            <button type="submit" className="btn">Send</button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
};