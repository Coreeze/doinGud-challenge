import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { MoralisProvider } from "react-moralis";

import "./styles/index.css";

require("dotenv").config();

const { MORALIS_SERVER_URL, APP_ID } = process.env;

ReactDOM.render(
  <React.StrictMode>
    <MoralisProvider
      serverUrl="https://c76movz00vcz.usemoralis.com:2053/server"
      appId="Su5msyzoLMESzSbgODX3FqpKUMCifryZvKQ7oeCe"
    >
      <App />
    </MoralisProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
