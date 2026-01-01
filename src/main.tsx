import { createRoot } from "react-dom/client";
import { LogtoProvider, LogtoConfig } from '@logto/react';
import App from "./App.tsx";
import { AuthProvider } from "./contexts/AuthContext";
import "./index.css";

const logtoConfig: LogtoConfig = {
  endpoint: 'https://auth.nodumstudio.com',
  appId: '43g1cpc5ic3m6fes6t8yt',
};

createRoot(document.getElementById("root")!).render(
  <LogtoProvider config={logtoConfig}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </LogtoProvider>
);