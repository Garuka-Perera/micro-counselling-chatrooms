import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

export default function PublicNavbar() {
  return (
    <div className="mc-public-navbar-wrap">
      <nav className="mc-public-navbar">
        <Link to="/" className="mc-public-brand">
          <img src={logo} alt="Micro-Counsel" />
          <div>
            <h1>Micro-Counsel</h1>
            <p>Gentle support for better mental health</p>
          </div>
        </Link>

        <div className="mc-public-navlinks">
          <Link to="/" className="mc-navlink">
            Home
          </Link>
          <Link to="/how-it-works" className="mc-navlink">
            How it works
          </Link>
          <Link to="/become-a-listener" className="mc-navlink">
            Become a listener
          </Link>
          <Link to="/emergency-help" className="mc-navlink">
            Emergency help
          </Link>
          <Link to="/admin-login" className="mc-navlink admin">
            Admin login
          </Link>
          <Link to="/user-login" className="mc-navlink cta">
            Student login
          </Link>
        </div>
      </nav>
    </div>
  );
}