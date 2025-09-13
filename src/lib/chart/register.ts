// Central Chart.js registration for react-chartjs-2
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

let registered = false;
export function ensureChartJSRegistered() {
  if (registered) return;
  ChartJS.register(LineElement, PointElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);
  registered = true;
}

// Register on import for convenience
ensureChartJSRegistered();

