import React from "react";
import headerImg from "../pic/header.jpg";

const WelcomePage = ({ onEnterLogin }) => {
  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <img
          src={headerImg}
          alt="Balayan Fitness Studio"
          className="welcome-logo"
        />

        <h1 className="welcome-title">
          Welcome to <span>Balayan Fitness Studio</span>
        </h1>

        <p className="welcome-subtitle">
          An all-in-one fitness management platform with members, coaches, and studio operations for better results every day.
        </p>

        <div className="welcome-actions">
          <button
            type="button"
            className="btn-welcome-login"
            onClick={onEnterLogin}
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;