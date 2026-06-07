import { useState } from "react";
import DashboardPage from "./DashboardPage";
import VibePlusPage from "./VibePlusPage";
import "./DashboardPage.css";

export default function CallPage() {
  const [currentView, setCurrentView] = useState("dashboard");

  const handleNavigateToPlus = () => {
    setCurrentView("plus-loading");
    window.setTimeout(() => {
      setCurrentView("plus");
      window.scrollTo({ top: 0, behavior: "instant" });
    }, 1200);
  };

  if (currentView === "plus-loading") {
    return (
      <div className="page-transition-screen">
        <div className="loader" />
      </div>
    );
  }

  if (currentView === "plus") {
    return <VibePlusPage />;
  }

  return (
    <div>
      <DashboardPage onNavigateToPlus={handleNavigateToPlus} />
    </div>
  );
}
