import App from "app/App";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import "react-toastify/dist/ReactToastify.css";
import "./app/index.css";
import "./shared/i18n";

const rootElement = document.getElementById("root")!;

if (!rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement);

    root.render(
        <StrictMode>
            <App />
        </StrictMode>,
    );
}
