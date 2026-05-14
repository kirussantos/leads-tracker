import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Cliente from "./pages/Cliente";
import Links from "./pages/Links";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-base">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 pt-20 pb-12">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cliente/:id" element={<Cliente />} />
            <Route path="/links" element={<Links />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
