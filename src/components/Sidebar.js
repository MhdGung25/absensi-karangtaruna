import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Menu,
  X,
  Archive
} from 'lucide-react';
import logoImg from '../assets/logo tarka.jpeg';

const Sidebar = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const menu = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20}/> },
    { name: 'Anggota', path: '/members', icon: <Users size={20}/> },
    { name: 'Tambah', path: '/add', icon: <UserPlus size={20}/> },
    { name: 'Arsip Absen', path: '/arsip', icon: <Archive size={20}/> },
  ];

  const isActivePath = (path) => location.pathname === path;

  return (
    <>
      {/* MOBILE TOP BAR */}
      <div className="md:hidden flex items-center justify-between bg-black text-white px-4 py-3 fixed w-full top-0 z-50 shadow">
        <h1 className="font-semibold text-sm tracking-wide">
          Rekap Absensi Karang Taruna RW 18
        </h1>
        <button onClick={() => setOpen(!open)}>
          {open ? <X size={22}/> : <Menu size={22}/>}
        </button>
      </div>

      {/* OVERLAY */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-black text-white transform transition-transform duration-300 z-50
        ${open ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0`}
      >
        <div className="flex flex-col h-full p-6 overflow-y-auto">

          {/* LOGO + TITLE */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-white">
              <img src={logoImg} alt="Logo" className="w-full h-full object-cover" />
            </div>

            <div>
              <h1 className="font-bold text-lg tracking-tight">
                Karang Taruna
              </h1>
              <p className="text-sm text-slate-300">
                RW 18
              </p>
            </div>
          </div>

          {/* MENU */}
          <nav className="flex flex-col gap-2">
            {menu.map((item) => {
              const active = isActivePath(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    active
                      ? 'bg-white text-black shadow-md'
                      : 'text-slate-400 hover:bg-white hover:text-black'
                  }`}
                >
                  {item.icon}
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* FOOTER */}
          <div className="mt-auto pt-6 border-t border-slate-800">
            <div className="text-center space-y-1">
              <p className="text-xs md:text-sm font-medium text-slate-300">
                Sistem Absensi
              </p>
              <p className="text-xs text-slate-500">
                © {new Date().getFullYear()}
              </p>
            </div>
          </div>

        </div>
      </aside>
    </>
  );
};

export default Sidebar;
