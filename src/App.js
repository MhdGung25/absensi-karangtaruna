import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Sidebar from './components/Sidebar';

import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import AddMemberPage from './pages/AddMemberPage';
import AttendanceArchive from './pages/AttendanceArchive'; // ✅ TAMBAHAN

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-[#F0F2F5] overflow-hidden font-sans text-slate-700">
        
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 md:p-10">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/members" element={<Members />} />
              <Route path="/add" element={<AddMemberPage />} />
              <Route path="/arsip" element={<AttendanceArchive />} />

            </Routes>
          </main>
        </div>

      </div>
    </Router>
  );
}

export default App;
