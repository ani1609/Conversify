import { ReactComponent as DefaultAsset } from "../assets/default3.svg";
import "../index.css";
import "../styles/Default.css";
import { useTheme } from "./ThemeContext";

function Default() {
  const { dark } = useTheme();

  return (
    <div
      className={dark ? "default_parent dark_bg" : "default_parent light_bg"}
    >
      <DefaultAsset className="deafult_asset" />
    </div>
  );
}

export default Default;
