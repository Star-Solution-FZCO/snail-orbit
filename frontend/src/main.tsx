import App from "App";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { Provider as StoreProvider } from "react-redux";
import { store } from "store";
import "./i18n";
import "./index.css";

const rootElement = document.getElementById("root")!;

if (!rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement);

    root.render(
        <StrictMode>
            <StoreProvider store={store}>
                <App />
            </StoreProvider>
        </StrictMode>,
    );
}
