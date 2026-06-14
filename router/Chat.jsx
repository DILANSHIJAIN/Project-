import { useState, useEffect, useRef } from "react";
import { useAuth } from "../store/auth"; 
import { toast } from "react-toastify";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Full list of categories from your project specs
const CATEGORIES = [
    "General", "Technical", "Billing", "Login & Authentication", 
    "Account Management", "Infrastructure", "Security", "Data & Database", 
    "Bug Report", "Service Request", "Performance Issues", "Complaint", 
    "Integration & API", "Printing", "Email & Collaboration", 
    "Feature Request", "Vehicle Maintenance", "Traffic & Logistics", "Food"
];

export const Chat = () => {
    const [message, setMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isSearching, setIsSearching] = useState(false); // Track web search state
    const [suggestions, setSuggestions] = useState([]); // Feature 10
    const [isListening, setIsListening] = useState(false); // State to track if voice recognition is active
    const [selectedCategory, setSelectedCategory] = useState(null); // State for category selection
    const [inputError, setInputError] = useState(false); // State for input validation error
    const [selectedImages, setSelectedImages] = useState([]); // Feature 8 (Updated for multiple)
    const { user, authorizationToken, isLoading } = useAuth();
    const scrollRef = useRef(null);
    const recognitionRef = useRef(null); // Added missing ref to prevent voice crashes
    const [chatLog, setChatLog] = useState([]);
    const [showAllCategories, setShowAllCategories] = useState(false); // State for Show More logic
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedback, setFeedback] = useState({ rating: 0, helpful: null, comment: "" });
    const [chatClosed, setChatClosed] = useState(false);

    // 10. PREDICTIVE SUGGESTIONS (Feature 10)
    const commonPrompts = [
        "Internet is slow", "My SIM has no signal", "How to change address?", 
        "What is my ticket status?", "Billing issue", "Password reset"
    ];

    const handleInputChange = (e) => {
        const val = e.target.value; // Keep original value for display
        setMessage(val);
        setInputError(false); // Clear error when user types
        const searchTerm = val.trim().toLowerCase(); // Use trimmed lowercase for matching

        if (searchTerm.length > 0) { // Show suggestions as soon as user types
            const matches = commonPrompts.filter(p => p.toLowerCase().includes(searchTerm)); // Show all matches
            setSuggestions(matches);
        } else {
            setSuggestions([]);
        }
    };

    // 11. VOICE TICKET CREATION (Feature 11)
    const startVoiceRecognition = () => {
        // Toggle logic: If already listening, stop it.
        if (isListening) {
            recognitionRef.current?.stop();
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return toast.error("Voice recognition not supported in this browser.");
        
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition; // Store recognition instance in ref
        recognition.interimResults = true; // Enables simultaneous writing
        recognition.continuous = true; // Keep listening until stopped or error
        recognition.lang = "en-US"; // Set language for recognition
        const initialMessageContent = message; // Capture current message content once at start

        recognition.onstart = () => {
            setIsListening(true);
            // Do NOT set isTyping here, it's for AI responses
        };

        recognition.onresult = (event) => {
            let currentTranscript = '';
            for (let i = 0; i < event.results.length; ++i) {
                currentTranscript += event.results[i][0].transcript;
            }
            // Update message with initial content + current transcript for simultaneous writing
            setMessage(initialMessageContent + (initialMessageContent && currentTranscript ? " " : "") + currentTranscript);
        };

        recognition.onerror = (event) => {
            if (event.error === "not-allowed") {
                toast.error("Microphone blocked! Please allow access in browser settings (Lock icon in URL bar). Note: Voice requires HTTPS or localhost.");
            } else if (event.error === "no-speech") {
                // Ignore silent pauses to prevent spamming toasts
            } else {
                console.error("Voice Error:", event.error); // Log the actual error for debugging
                toast.error(`Voice error: ${event.error}`);
            }
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        try {
            recognition.start();
        } catch (err) {
            console.error("Recognition start failed:", err);
            setIsListening(false);
        }
    };

    const handleCategorySelection = (cat) => {
        setSelectedCategory(cat);
        
        // Define category-specific checklist for a professional analyst experience
        const checklists = {
            "Technical": ["Device/System Name", "Operating System", "Error Message", "When did the issue start?", "Recent changes or updates?"],
            "Billing": ["Transaction ID", "Amount", "Date & Time", "Payment Method", "Invoice Number (Optional)"],
            "Login & Authentication": ["Application/Platform Name", "Username/Email", "Error Message", "Recent Password Change? (Yes/No)", "MFA/OTP Issue? (Yes/No)"],
            "Account Management": ["Account ID/Username", "Type of Request (Update/Deactivation/Access/Profile)", "Supporting Documents (Optional)"],
            "Infrastructure": ["Infrastructure Type (Water/Electricity/etc)", "Location/Locality", "Since when does the issue exist?", "How many people are affected?", "Severity (Low/Medium/High)"],
            "Security": ["Security Issue Type", "Unauthorized Access?", "Suspicious Activity?", "Affected System", "Time of Incident"],
            "Data & Database": ["Database Name", "Affected Table/System", "Issue Type (Missing/Corruption/Slow/Access)", "Error Message"],
            "Bug Report": ["Application Name", "Module/Page", "Steps to Reproduce", "Expected Behavior", "Actual Behavior"],
            "Service Request": ["Service Required", "Requested Date", "Business Justification", "Department", "Approval Required? (Yes/No)"],
            "Performance Issues": ["Application/System Name", "Performance Problem (Slow/CPU/Timeout)", "Frequency (Always/Sometimes)"],
            "Complaint": ["Complaint Against", "Department/Service", "Detailed Description", "Previous Complaint ID (Optional)"],
            "Integration & API": ["API Name", "Endpoint", "HTTP Method", "Error Code", "Request Timestamp"],
            "Printing": ["Printer Name", "Printer Location", "Issue Type (Jam/Offline/Quality/etc)", "Error Message"],
            "Email & Collaboration": ["Application (Outlook/Gmail/Teams/Slack)", "Issue Type (Login/Send/Receive Failure)", "Error Message"],
            "Feature Request": ["Feature Title", "Feature Description", "Business Purpose", "Expected Benefit", "Priority (Low/Medium/High)"],
            "Vehicle Maintenance": ["Vehicle Number", "Vehicle Type (Car/Bike/Bus/Truck)", "Issue Type (Service/Breakdown/etc)", "Location", "Date of Issue"],
            "Traffic & Logistics": [
                "Shipment ID (for Logistics)", 
                "Location/Affected Area", 
                "Issue Type (Traffic Jam/Signal Failure/Delay/Damage)", 
                "Date & Time", 
                "Severity"
            ],
            "Food": [
                "Food Platform (Swiggy / Zomato / Blinkit / Other)",
                "Order ID",
                "Food Item Name",
                "Issue Type (Food Quality / Hygiene / Missing Item / Wrong Item / Late Delivery / Damaged Packaging)",
                "Restaurant Name",
                "Location",
                "Date & Time",
                "Issue Description",
                "Affected Persons",
                "Photos (Minimum 2 photos REQUIRED)"
            ],
            "default": ["Locality/Location", "Issue Description", "Date & Time the issue started", "Any specific error messages"]
        };

        const items = checklists[cat] || checklists["default"];

        const formattedResponse = `Category: ${cat} ✅

I understand you're experiencing an issue. To help identify the cause, could you provide a few more details?

You can include:
${items.map(item => `• ${item}`).join("\n")}

Once I have this information, I'll suggest the most appropriate troubleshooting steps.`;

        setChatLog((prev) => [...prev, 
            { role: "user", content: `${cat} category selected.`, timestamp: new Date().toISOString() },
            { role: "bot", content: formattedResponse, timestamp: new Date().toISOString() }
        ]);
    };

    const handleFeedbackSubmit = () => {
        toast.success("Thank you for your feedback. Your response helps us improve our support experience.");
        setChatClosed(true);
        setShowFeedback(false);
    };

    // Set initial greeting once user data is available
    useEffect(() => {
        if (!isLoading && user && chatLog.length === 0) {
            setChatLog([
                { 
                    role: "bot", 
                    content: `Hello ${user.username}! I am your AI assistant. To get started, please select the category that best matches your problem:`,
                    isCategorySelection: true,
                    timestamp: new Date().toISOString()
                }
            ]);
        }
    }, [user, isLoading, chatLog]);

    // Auto-scroll to the bottom whenever messages change
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatLog, isTyping]);

    const handleSendMessage = async (e, forceTicket = false, manualQuery = null) => {
        if (e) e.preventDefault();
        const finalQuery = manualQuery || message;

        if (chatClosed || (!finalQuery.trim() && selectedImages.length === 0)) {
            setInputError(true); // Show error if input is empty
            return;
        }

        // Detect if we should show search status
        const infoKeywords = ["how to", "what is", "why", "when", "where", "meaning", "guide", "latest", "news"];
        if (infoKeywords.some(kw => finalQuery.toLowerCase().includes(kw))) {
            setIsSearching(true);
        }

        const userQuery = finalQuery || (selectedImages.length > 1 ? "Images Uploaded" : "Image Uploaded");
        const imagesToUpload = [...selectedImages]; // Store reference before clearing state
        
        setMessage("");
        setSelectedImages([]);
        setSuggestions([]);
        setIsTyping(true);

        try {
            // 1. Upload all selected images in parallel for maximum speed
            const uploadResults = await Promise.all(
                imagesToUpload.map(async (image) => {
                    try {
                        const formData = new FormData();
                        formData.append("image", image);

                        const uploadRes = await fetch(`${API_URL}/api/upload`, {
                            method: "POST",
                            headers: { "Authorization": authorizationToken },
                            body: formData,
                        });

                        if (uploadRes.ok) {
                            const uploadData = await uploadRes.json();
                            return uploadData.filePath.startsWith('uploads/') ? uploadData.filePath : `uploads/${uploadData.filePath}`; // Ensure 'uploads/' prefix
                        }
                    } catch (err) {
                        console.error("Image upload failed:", err);
                    }
                    return null;
                })
            );

            const uploadedUrls = uploadResults.filter(url => url !== null);

            // 1. Construct query string with images BEFORE creating the message objects
            let queryWithImages = userQuery;
            if (uploadedUrls.length > 0) {
                queryWithImages += ` (Attached Images: ${uploadedUrls.join(", ")})`;
            }

            const formattedImages = uploadedUrls.map(url => url.startsWith('/') ? `${API_URL}${url}` : `${API_URL}/${url}`);

            const userMessage = { 
                role: "user", 
                content: userQuery, 
                aiContent: queryWithImages, 
                images: formattedImages,
                timestamp: new Date().toISOString()
            };

            // Pre-calculate history including the current message to ensure AI context is current
            const updatedHistoryForAI = [
                ...chatLog.map(msg => ({
                    role: msg.role === "bot" ? "assistant" : "user",
                    content: msg.aiContent || msg.content // Use full content with image paths for backend validation
                })),
                { role: "user", content: queryWithImages }
            ];

            // Add user message to log
            setChatLog((prev) => [...prev, userMessage]);

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
                    forceTicket: forceTicket,
                    category: selectedCategory, // Pass selected category context
                    chatHistory: chatLog.map(msg => ({
                        role: msg.role === "bot" ? "assistant" : "user",
                        content: msg.aiContent || msg.content 
                    }))
                }),
            });

            const data = await response.json();
            setIsTyping(false);
            setIsSearching(false);

            if (response.ok) {
                if (data.ticketSaved) {
                    setSelectedCategory(null); // Clear context after success
                    setChatLog((prev) => [...prev, {
                        role: "bot",
                        content: data.aiResult, // Use the structured AI response
                        isTicket: true,
                        ticketId: data.ticket._id,
                        category: data.ticket.category,
                        priority: data.ticket.priority,
                        summary: data.ticket.aiSummary,
                        timestamp: new Date().toISOString()
                    }]);
                    setTimeout(() => setShowFeedback(true), 1500);
                } else {
                    let finalAiResult = data.aiResult;
                    
                    // Check if the AI's response is the specific "0 photos" message for food issues
                    const foodPhotoErrorRegex = /I'm sorry, but I cannot create a support ticket for a food issue without at least 2 photos as evidence\. Currently, I only see (\d+) photo\(s\)\./;
                    const match = finalAiResult.match(foodPhotoErrorRegex);

                    if (match) {
                        const backendReportedCount = parseInt(match[1], 10);
                        // Calculate total images from the current message's uploadedUrls
                        const currentUploadImageCount = uploadedUrls.length;
                        
                        // If the backend reported 0, but we know we just uploaded some, override the message
                        if (backendReportedCount === 0 && currentUploadImageCount > 0) {
                            finalAiResult = finalAiResult.replace("0 photo(s)", `${currentUploadImageCount} photo(s)`);
                        }
                    }
                    setChatLog((prev) => [...prev, { role: "bot", content: finalAiResult, timestamp: new Date().toISOString() }]);
                }
            } else {
                setChatLog((prev) => [...prev, { role: "bot", content: data.message || "Sorry, I couldn't process that ticket right now.", timestamp: new Date().toISOString() }]);
            }
        } catch (error) {
            setIsTyping(false);
            setIsSearching(false);
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
                // Update local chat log to show the change
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
                                    {chat.timestamp && (
                                        <span style={{ fontSize: "1.1rem", color: "#94a3b8", display: "block", textAlign: "right", marginTop: "0.3rem", opacity: 0.8 }}>
                                            {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}

                                    {/* Quick Selection Buttons like Jio/Swiggy */}
                                    {chat.isCategorySelection && (
                                        <div style={{ marginTop: "1.5rem", display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", width: "240px" }}> {/* Narrow vertical container */}
                                                {(showAllCategories ? CATEGORIES.filter(c => c !== "General") : CATEGORIES.filter(c => c !== "General").slice(0, 5)).map((cat) => (
                                                    <button 
                                                        key={cat} 
                                                        onClick={() => handleCategorySelection(cat)}
                                                        className="btn"
                                                        style={{ 
                                                            padding: "0.8rem 1.5rem", 
                                                            fontSize: "1.4rem", 
                                                            borderRadius: "0.6rem", 
                                                            background: "white", // White box
                                                            border: "1px solid #e2e8f0", 
                                                            color: "black", // Black text
                                                            textAlign: "center",
                                                            width: "100%",
                                                            fontWeight: "700",
                                                            transition: "transform 0.1s ease"
                                                        }}
                                                    >
                                                        {cat}
                                                    </button>
                                                ))}
                                                <button 
                                                    onClick={() => setShowAllCategories(!showAllCategories)}
                                                    style={{ 
                                                        background: "none", 
                                                        border: "none", 
                                                        color: "#646cff", 
                                                        fontSize: "1.3rem", 
                                                        cursor: "pointer", 
                                                        textAlign: "center",
                                                        textDecoration: "underline",
                                                        padding: "0.5rem 0",
                                                        fontWeight: "600"
                                                    }}
                                                >
                                                    {showAllCategories ? "↑ Show Less" : "↓ Show More..."}
                                                </button>
                                            </div>
                                            <p style={{ width: "100%", fontSize: "1.2rem", color: "#94a3b8", marginTop: "0.5rem" }}>...or just type your issue below.</p>
                                        </div>
                                    )}
                                    
                                    {/* Troubleshooting Actions */}
                                    {/* Decision Workflow Buttons */}
                                    {!chat.isTicket && chat.role === "bot" && chat.content.includes("proceed with a ticket") && (
                                        <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
                                            <button onClick={() => { setMessage("Please proceed with the ticket."); handleSendMessage(null, true); }} style={{ padding: "0.5rem 1rem", borderRadius: "0.4rem", background: "#cc0000", border: "none", color: "white", cursor: "pointer", fontSize: "1.2rem" }}>Create Ticket</button>
                                            <button onClick={() => setChatLog(prev => [...prev, { role: "bot", content: "Great! I'm glad I could help. Let me know if you need anything else." }])} style={{ padding: "0.5rem 1rem", borderRadius: "0.4rem", background: "#10b981", border: "none", color: "white", cursor: "pointer", fontSize: "1.2rem" }}>It's Fixed</button>
                                            <button onClick={() => handleSendMessage(null, true, "Please create a support ticket for me.")} style={{ padding: "0.5rem 1rem", borderRadius: "0.4rem", background: "#ef4444", border: "none", color: "white", cursor: "pointer", fontSize: "1.2rem", fontWeight: "600" }}>Create Support Ticket</button>
                                            <button onClick={() => setChatLog(prev => [...prev, { role: "bot", content: "Great! I'm glad I could help. Is there anything else I can assist you with?" }])} style={{ padding: "0.5rem 1rem", borderRadius: "0.4rem", background: "#10b981", border: "none", color: "white", cursor: "pointer", fontSize: "1.2rem" }}>Yes, Resolved</button>
                                        </div>
                                    )}

                                    {/* Escalation Options for Troubleshooting failure */}
                                    {chat.role === "bot" && (chat.content.toLowerCase().includes("continue troubleshooting") || chat.content.toLowerCase().includes("support ticket")) && !chatClosed && !chat.isTicket && (
                                        <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
                                            <button 
                                                onClick={() => handleSendMessage(null, false, "I want to continue troubleshooting.")} 
                                                style={{ padding: "0.8rem 1.2rem", borderRadius: "0.5rem", background: "#334155", border: "1px solid #4b5563", color: "white", cursor: "pointer", fontSize: "1.3rem" }}>
                                                Continue Troubleshooting
                                            </button>
                                            <button 
                                                onClick={() => handleSendMessage(null, true, "The problem still exists. Please create a support ticket.")} 
                                                style={{ padding: "0.8rem 1.2rem", borderRadius: "0.5rem", background: "#ef4444", border: "none", color: "white", cursor: "pointer", fontSize: "1.3rem", fontWeight: "600" }}>
                                                Create Support Ticket
                                            </button>
                                        </div>
                                    )}
                                    
                                    {/* Category Correction Option */}
                                    {chat.isTicket && (
                                        <div style={{ marginTop: "1.5rem", borderTop: "1px solid #4b5563", paddingTop: "1rem" }}>
                                            <p style={{ fontSize: "1.2rem", color: "#94a3b8", marginBottom: "0.5rem" }}>Wrong category? Select the right one:</p>
                                            <select
                                                value={chat.category === "General" ? "" : chat.category} // If AI defaults to General, show placeholder
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

                                    {/* Feedback System */}
                                    {showFeedback && index === chatLog.length - 1 && (
                                        <div style={{ marginTop: "2rem", padding: "2rem", background: "#1e293b", borderRadius: "1rem", border: "2px solid var(--btn-color)" }}>
                                            <p style={{ fontSize: "1.6rem", fontWeight: "bold", marginBottom: "1rem" }}>How would you rate your experience?</p>
                                            <div style={{ display: "flex", gap: "0.5rem", fontSize: "2.5rem", marginBottom: "1.5rem" }}>
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <span key={star} onClick={() => setFeedback({ ...feedback, rating: star })} style={{ cursor: "pointer", color: star <= feedback.rating ? "#fbbf24" : "#4b5563" }}>★</span>
                                                ))}
                                            </div>
                                            <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
                                                <button onClick={() => setFeedback({ ...feedback, helpful: true })} style={{ padding: "0.6rem 1.2rem", borderRadius: "2rem", border: "1px solid #4b5563", background: feedback.helpful === true ? "var(--btn-color)" : "transparent", color: "white", cursor: "pointer" }}>👍 Helpful</button>
                                                <button onClick={() => setFeedback({ ...feedback, helpful: false })} style={{ padding: "0.6rem 1.2rem", borderRadius: "2rem", border: "1px solid #4b5563", background: feedback.helpful === false ? "#ef4444" : "transparent", color: "white", cursor: "pointer" }}>👎 Not Helpful</button>
                                            </div>
                                            <textarea 
                                                placeholder="Additional comments (optional)" 
                                                value={feedback.comment}
                                                onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })}
                                                style={{ width: "100%", padding: "1rem", borderRadius: "0.5rem", background: "#0f172a", border: "1px solid #334155", color: "white", marginBottom: "1rem", fontSize: "1.4rem" }}
                                            />
                                            <button onClick={handleFeedbackSubmit} className="btn" style={{ width: "100%" }}>Submit Feedback</button>
                                        </div>
                                    )}

                                    {chatClosed && index === chatLog.length - 1 && (
                                        <p style={{ marginTop: "1rem", fontSize: "1.4rem", color: "#94a3b8", fontStyle: "italic" }}>Chat Closed.</p>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isListening && (
                            <div style={{ textAlign: "right", marginBottom: "1rem" }}>
                                <div style={{ display: "inline-block", padding: "1rem", borderRadius: "1rem", background: "#cc0000", color: "white", fontSize: "1.4rem", fontWeight: "bold" }}>
                                    🎤 Listening...
                                </div>
                            </div>
                        )}
                        {isSearching && (
                            <div style={{ textAlign: "left", marginBottom: "1rem" }}>
                                <div style={{ display: "inline-block", padding: "1rem", borderRadius: "1rem", background: "#1e293b", color: "#60a5fa", fontSize: "1.4rem", border: "1px solid #60a5fa" }}>
                                    🌐 Searching Google for the best answer...
                                </div>
                            </div>
                        )}
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
                        {/* Active Context Bar - Allows changing category at any time */}
                        {selectedCategory && (
                            <div style={{ 
                                background: "#0f172a", 
                                padding: "0.8rem 1.5rem", 
                                borderRadius: "0.5rem 0.5rem 0 0", 
                                border: "1px solid #334155", 
                                borderBottom: "none",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}>
                                <span style={{ fontSize: "1.3rem", color: "#94a3b8" }}>
                                    Dealing with: <strong style={{ color: "var(--btn-color)" }}>{selectedCategory}</strong>
                                </span>
                                <button 
                                    onClick={() => setSelectedCategory(null)}
                                    style={{ background: "none", border: "none", color: "#ef4444", fontSize: "1.2rem", cursor: "pointer", textDecoration: "underline" }}
                                >
                                    Change Category
                                </button>
                            </div>
                        )}
                        {suggestions.length > 0 && (
                            <div className="suggestions" style={{ 
                                position: "absolute", 
                                bottom: "100%", 
                                left: 0, 
                                width: "100%", 
                                background: "#334155", 
                                borderRadius: "0.5rem", 
                                marginBottom: "0.5rem", 
                                padding: "0.5rem", 
                                zIndex: 10,
                                boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.4)",
                                border: "1px solid #4b5563",
                                maxHeight: "200px",
                                overflowY: "auto"
                            }}>
                                {suggestions.map((s, i) => (
                                    <div key={i} 
                                        onClick={() => { setMessage(s); setSuggestions([]); }} 
                                        style={{ padding: "1rem", cursor: "pointer", fontSize: "1.4rem", borderBottom: "1px solid #475569", color: "white", transition: "background 0.2s" }}
                                        onMouseOver={(e) => e.target.style.background = "#475569"}
                                        onMouseOut={(e) => e.target.style.background = "transparent"}
                                    >{s}</div>
                                ))}
                            </div>
                        )}
                        {/* Attached Images Preview Tray */}
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
                            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <button 
                                    type="button" 
                                    onClick={startVoiceRecognition} 
                                    style={{ 
                                        background: "none", 
                                        border: "none", 
                                        fontSize: "2.4rem", 
                                        cursor: "pointer",
                                        color: isListening ? "#cc0000" : "inherit",
                                        transition: "all 0.3s ease",
                                        zIndex: 2
                                    }}
                                >
                                    {isListening ? "🛑" : "🎤"}
                                </button>
                                {isListening && <span className="pulse-ring"></span>}
                            </div>
                            <input 
                                type="text" 
                                value={message} 
                                onChange={handleInputChange}
                                placeholder={chatClosed ? "Conversation ended." : "Ask about your tickets..."}
                                disabled={chatClosed}
                                style={{ flexGrow: 1, padding: "1rem", borderRadius: "0.5rem", border: inputError ? "3px solid #cc0000" : "none", boxShadow: inputError ? "0 0 8px rgba(204, 0, 0, 0.6)" : "none", fontSize: "1.6rem", opacity: chatClosed ? 0.6 : 1 }}
                            />
                            <button type="submit" className="btn" disabled={chatClosed}>Send</button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
};