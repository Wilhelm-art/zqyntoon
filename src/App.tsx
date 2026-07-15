/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { Series } from "./pages/Series";
import { Reader } from "./pages/Reader";

function Layout() {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col font-sans text-white">
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="manga/:slug" element={<Series />} />
        </Route>
        {/* Reader is outside standard layout because it needs its own immersive nav */}
        <Route path="/manga/:slug/:chapterId" element={<Reader />} />
      </Routes>
    </BrowserRouter>
  );
}
