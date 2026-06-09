import DashboardPage from "./DashboardPage";
import "./DashboardPage.css";

export default function CallPage({ onLogout }) {
  const [currentView, setCurrentView] = useState("dashboard");

  const handleNavigateToPlus = () => {
    // Short 350ms transition matching App.jsx
    setCurrentView("plus-loading");
    window.setTimeout(() => {
      setCurrentView("plus");
      window.scrollTo({ top: 0, behavior: "instant" });
    }, 350);
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  if (currentView === "plus-loading") {
    // Fixed: use app-page-transition and app-loader which exist in App.css
    return (
      <div className="app-page-transition">
        <div className="app-loader" />
      </div>
    );
  }

  if (currentView === "plus") {
    return <VibePlusPage onBack={handleBackToDashboard} />;
  }

  return (
    <DashboardPage
      onNavigateToPlus={handleNavigateToPlus}
      onLogout={onLogout}
    />
  );
}
