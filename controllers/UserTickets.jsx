import { useEffect, useState } from "react";
import { useAuth } from "../store/auth"; // Use the correct auth context from store
import { toast } from "react-toastify";
import { PRIORITIES } from "../constants/priorities";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const STATUS_COLORS = {
  "Open": "#ef4444",
  "In-Progress": "#f97316",
  "Closed": "#10b981",
};

export const UserTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { authorizationToken } = useAuth();

  const getTickets = async () => {
    try {
      setError(null);
      const response = await fetch(`${API_URL}/api/tickets/user`, {
        method: "GET",
        headers: {
          Authorization: authorizationToken,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tickets: ${response.status}`);
      }

      const data = await response.json();
      setTickets(data || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setError(error.message);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/tickets/${ticketId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: authorizationToken,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update ticket status");
      }

      // Update local state
      setTickets(tickets.map(t => t._id === ticketId ? { ...t, status: newStatus } : t));
      toast.success(`Ticket status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating ticket:", error);
      toast.error("Failed to update ticket status");
    }
  };

  useEffect(() => {
    if (authorizationToken) {
      getTickets();
    } else {
      setLoading(false);
    }
  }, [authorizationToken]);

  if (loading) return <h1 className="main-heading">Loading...</h1>;

  return (
    <section className="section-tickets" style={{ background: "#0f172a", minHeight: "calc(100vh - 180px)", padding: "12rem 0 6rem 0", color: "white", display: "flex", flexDirection: "column" }}>
      <div className="container" style={{ maxWidth: "1300px", margin: "0 auto", padding: "0 2rem", flexGrow: 1 }}>
        <h1 className="main-heading" style={{ fontSize: "3.5rem", marginBottom: "3rem" }}>My Support Tickets</h1>
        {error && <p style={{ color: "red", padding: "1rem", backgroundColor: "#ffe5e5", borderRadius: "0.5rem", marginBottom: "1rem" }}>{error}</p>}
        {tickets.length > 0 ? (
          <table style={{ width: "100%", marginTop: "2rem", borderCollapse: "collapse", color: "white" }}>
            <thead>
              <tr style={{ background: "#334155" }}>
                <th style={{ padding: "1.8rem", textAlign: "left", fontSize: "1.8rem" }}>Issue</th>
                <th style={{ padding: "1.8rem", textAlign: "left", fontSize: "1.8rem" }}>Category</th>
                <th style={{ padding: "1.8rem", textAlign: "left", fontSize: "1.8rem" }}>Priority</th>
                <th style={{ padding: "1.8rem", textAlign: "left", fontSize: "1.8rem" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => {
                const priority = PRIORITIES[ticket.priority] || PRIORITIES.P3;
                return (
                  <tr key={ticket._id} style={{ borderBottom: "1px solid #475569", transition: "background 0.3s" }}>
                    <td style={{ padding: "2rem 1.8rem", fontSize: "1.6rem" }}>{ticket.title}</td>
                    <td style={{ padding: "2rem 1.8rem", fontSize: "1.6rem" }}>{ticket.aiCategory || ticket.category || "General"}</td>
                    <td style={{ padding: "2rem 1.8rem", fontSize: "1.6rem" }}>
                      <span style={{ 
                        padding: "0.5rem 0.75rem", 
                        borderRadius: "0.25rem",
                        fontWeight: "bold",
                        backgroundColor: priority.bgColor,
                        color: priority.color
                      }}>
                        {ticket.priority || "P3"}
                      </span>
                    </td> {/* Inline style for error border */}
                    <td style={{ padding: "2rem 1.8rem", fontSize: "1.6rem" }}><span className="badge" style={{ backgroundColor: STATUS_COLORS[ticket.status] || STATUS_COLORS.Open, padding: "0.7rem 1.2rem", borderRadius: "0.25rem" }}>{ticket.status || "Open"}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p style={{ color: "white", marginTop: "2rem" }}>No tickets found. Ask the AI assistant to open one!</p>
        )}
      </div>
    </section>
  );
};