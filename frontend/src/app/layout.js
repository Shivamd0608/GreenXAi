// app/layout.js - CLEAN VERSION
import "./globals.css";
import { Web3Provider } from "../contexts/Web3Context";
import { FaucetProvider } from "../contexts/FaucetContext";
import { WrapperProvider } from "../contexts/WrapperContext";
import { AMMProvider } from "../contexts/AMMContext";
import LayoutWrapper from "../components/LayoutWrapper";
import Navigation from "../components/ui/Navigation";
import AIChatFloating from "../components/AIChatFloating";

export const metadata = {
  title: "GreenXAI - Green Credit Trading Platform",
  description: "Tokenize, wrap, and trade green credits on Mantle L2",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* NO bg class here */}
      <body className="antialiased">
        <Web3Provider>
          <FaucetProvider>
            <WrapperProvider>
              <AMMProvider>
                <LayoutWrapper>
                  <Navigation />
                  {children}
                  <AIChatFloating />
                </LayoutWrapper>
              </AMMProvider>
            </WrapperProvider>
          </FaucetProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
