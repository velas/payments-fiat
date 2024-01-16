import React, { useState, useEffect } from 'react';
import logoImage from "../images/logo.svg";

const Header = (props) => {
  const [headerBackground, setHeaderBackground] = useState(false);

  const listenScrollEvent = () => {
    if (window.scrollY > 20) {
      setHeaderBackground(true);
    } else {
      setHeaderBackground(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", listenScrollEvent);

    return () => window.removeEventListener("scroll", listenScrollEvent);
  }, []);

  return (
    <div className={`header-style ${headerBackground ? 'scrolled' : ''}`}>
      <img src={logoImage} alt="Logo" className="header-logo" />
    </div>
  );
};

export default Header;
