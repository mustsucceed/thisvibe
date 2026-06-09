import DashboardPage from "./DashboardPage";
import "./DashboardPage.css";

export default function CallPage({ onNavigateToPlus }) {
  return (
    <div>
      <DashboardPage onNavigateToPlus={onNavigateToPlus} />
    </div>
  );
}
