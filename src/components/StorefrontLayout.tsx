import { Outlet } from "react-router-dom";
import { Footer } from "./Footer";
import BackgroundWatermark from "./BackgroundWatermark";
import { Navbar } from "./Navbar";

export const StorefrontLayout = () => {
  return (
    <>
      <BackgroundWatermark />
      <div className="min-h-screen bg-white">
        <Navbar />
        <Outlet />
        <Footer />
      </div>
    </>
  );
};
