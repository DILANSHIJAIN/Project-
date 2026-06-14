import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../store/auth";
import {toast} from "react-toastify";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const URL = `${API_URL}/api/auth/login`;

export const Login = () => {
  const [user, setUser] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const {storeTokenInLS} =useAuth();

  const handleInput = (e) => {
    const name = e.target.name;
    const value = e.target.value;

    setUser((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleSubmit = async(e) => {
    e.preventDefault();

    const newErrors = {};
    if (!user.email) newErrors.email = true;
    if (!user.password) newErrors.password = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try{
      const loginUser = {
        email: user.email.trim().toLowerCase(),
        password: user.password.trim(),
      };

      const response=await fetch(URL,{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
        },
        body:JSON.stringify(loginUser),
      });

      let data = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
          data = await response.json();
      } else {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      if(response.ok){
        storeTokenInLS(data.token);
        toast.success("Login Successful");

        setUser({
          email:"",
          password:"",
        });
        navigate("/");
      }else{
        toast.error(data.extraDetails ? data.extraDetails : data.message);
      }
    }catch(error){
        toast.error(error.message || "An error occurred during login");
        console.error("Login Error Details:", error);
      }
    };

  return (
    <section>
      <main>
        <div className="section-login">
          <div className="container grid grid-two-cols">
            {/* FORM SECTION - Moved to left */}
            <div className="login-form-container" style={{ order: 1 }}>
              <h1 className="main-heading mb-3">Login Form</h1> {/* Heading inside form container */}

              <form onSubmit={handleSubmit} noValidate>
                <div>
                  <label htmlFor="email" className="form-label">Email or Username</label>

                  <input
                    type="text"
                    name="email"
                    placeholder="Enter your email or username"
                    value={user.email}
                    onChange={handleInput}
                    autoComplete="off"
                    style={{ border: errors.email ? "3px solid #cc0000" : "1px solid #475569", boxShadow: errors.email ? "0 0 8px rgba(204, 0, 0, 0.6)" : "none", backgroundColor: "white", color: "black" }}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="form-label">Password</label>

                  <input
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    value={user.password}
                    onChange={handleInput}
                    autoComplete="off"
                    style={{ border: errors.password ? "3px solid #cc0000" : "1px solid #475569", boxShadow: errors.password ? "0 0 8px rgba(204, 0, 0, 0.6)" : "none", backgroundColor: "white", color: "black" }}
                  />
                </div>

                <button type="submit" className="btn btn-submit">
                  Login
                </button>

                <div style={{ marginTop: "1.5rem" }}>
                  <p>
                    Don't have an account?{" "}
                    <NavLink to="/register" style={{ textDecoration: "underline", color: "var(--btn-color)" }}>
                      Register here
                    </NavLink>
                  </p>
                  <p style={{ marginTop: "0.5rem" }}>
                    <NavLink to="#" onClick={() => alert("Forgot password functionality requires backend integration to send reset emails.")} style={{ fontSize: "0.9rem", color: "#666" }}>
                      Forgot Password?
                    </NavLink>
                  </p>
                </div>
              </form>
            </div>

            {/* IMAGE SECTION - Moved to right */}
            <div className="login-image" style={{ order: 2 }}>
              <img
                src="/images/login.png"
                alt="A girl is doing login"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>
          </div>
        </div>
      </main>
    </section>
  );
};