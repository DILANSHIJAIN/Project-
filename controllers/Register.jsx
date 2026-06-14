import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../store/auth";
import { toast } from "react-toastify";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const Register = () => {

  const [user, setUser] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { storeTokenInLS } = useAuth();

  // HANDLE INPUT
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

  // HANDLE SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    ["username", "email", "phone", "password"].forEach(field => {
      if (!user[field]) newErrors[field] = true;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      // Clean the data before sending
      const registerUser = {
        username: user.username.trim(),
        email: user.email.trim().toLowerCase(),
        phone: user.phone.toString().trim(),
        password: user.password.trim(),
      };

      const response = await fetch(
        `${API_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(registerUser),
        }
      );

      const data = await response.json();
      console.log(data);

      if (response.ok) {
        storeTokenInLS(data.token);
        toast.success("Registration Successful");

        setUser({
          username: "",
          email: "",
          phone: "",
          password: "",
        });
        // Navigate to AI Chat after successful registration
        navigate("/chat");

      } else {
        toast.error(data.extraDetails ? data.extraDetails : data.message);
      }

    } catch (error) {
      console.error("register", error);
      toast.error("An error occurred during registration");
    }
  };

  return (
    <>
      <section>

        <main>

          <div className="section-registration">

            <div className="container grid grid-two-cols">

              {/* FORM SECTION */}
              <div className="registration-form-container" style={{ order: 1 }}>
                <h1 className="main-heading mb-3">Registration Form</h1>

                <form onSubmit={handleSubmit} noValidate>

                  {/* USERNAME */}
                  <div>

                    <label htmlFor="username" className="form-label">
                      Username
                    </label>

                    <input
                      type="text"
                      name="username"
                      placeholder="Enter Your Username"
                      id="username"
                      minLength="3"
                      autoComplete="off"
                      value={user.username}
                      onChange={handleInput}
                      style={{ border: errors.username ? "3px solid #cc0000" : "1px solid #475569", boxShadow: errors.username ? "0 0 8px rgba(204, 0, 0, 0.6)" : "none", backgroundColor: "white", color: "black" }}
                    />

                  </div>

                  {/* EMAIL */}
                  <div>

                    <label htmlFor="email" className="form-label">
                      Email
                    </label>

                    <input
                      type="email"
                      name="email"
                      placeholder="Enter Your Email"
                      id="email"
                      autoComplete="off"
                      value={user.email}
                      onChange={handleInput}
                      style={{ border: errors.email ? "3px solid #cc0000" : "1px solid #475569", boxShadow: errors.email ? "0 0 8px rgba(204, 0, 0, 0.6)" : "none", backgroundColor: "white", color: "black" }}
                    />

                  </div>

                  {/* PHONE */}
                  <div>

                    <label htmlFor="phone" className="form-label">
                      Phone
                    </label>

                    <input
                      type="number"
                      name="phone"
                      placeholder="Enter Your Phone"
                      id="phone"
                      autoComplete="off"
                      value={user.phone}
                      onChange={handleInput}
                      style={{ border: errors.phone ? "3px solid #cc0000" : "1px solid #475569", boxShadow: errors.phone ? "0 0 8px rgba(204, 0, 0, 0.6)" : "none", backgroundColor: "white", color: "black" }}
                    />

                  </div>

                  {/* PASSWORD */}
                  <div>

                    <label htmlFor="password" className="form-label">
                      Password
                    </label>

                    <input
                      type="password"
                      name="password"
                      placeholder="Enter Your Password"
                      id="password"
                      autoComplete="off"
                      value={user.password}
                      onChange={handleInput}
                      style={{ border: errors.password ? "3px solid #cc0000" : "1px solid #475569", boxShadow: errors.password ? "0 0 8px rgba(204, 0, 0, 0.6)" : "none", backgroundColor: "white", color: "black" }}
                    />

                  </div>

                  {/* BUTTON */}
                  <button
                    type="submit"
                    className="btn btn-submit"
                  >
                    Register Now
                  </button>

                  <div style={{ marginTop: "1.5rem" }}>
                    <p>
                      Already have an account?{" "}
                      <NavLink to="/login" style={{ textDecoration: "underline", color: "var(--btn-color)" }}>
                        Login here
                      </NavLink>
                    </p>
                  </div>
                </form>
              </div>
              {/* IMAGE SECTION - Right for desktop, bottom for mobile */}
              {/* IMAGE SECTION - Moved to right */}
              <div className="registration-image" style={{ order: 2 }}>
                <img src="/images/register.png" alt="A girl is trying to do registration" style={{ width: "100%", height: "auto", display: "block" }} />
              </div>
            </div>

          </div>

        </main>

      </section>
    </>
  );
};