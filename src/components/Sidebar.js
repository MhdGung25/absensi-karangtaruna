import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Menu,
  X,
  Archive,
  ChevronRight
} from 'lucide-react';
import logoImg from '../assets/logo tarka.jpeg';

const Sidebar = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const menu = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20}/> },
    { name: 'Tambah Member', path: '/add', icon: <UserPlus size={20}/> },
    { name: 'Input Absensi', path: '/members', icon: <Users size={20}/> },
    { name: 'Arsip Kegiatan', path: '/arsip', icon: <Archive size={20}/> },
  ];

  const isActivePath = (path) => location.pathname === path;

  return (
    <>
      {/* MOBILE TOP BAR */}
      <div className="md:hidden flex items-center justify-between bg-black text-white px-5 py-4 fixed w-full top-0 z-[60] border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
          <h1 className="font-bold text-xs uppercase tracking-wider">
            REKAP ABSEN KARTA RW 18
          </h1>
        </div>
        <button 
          onClick={() => setOpen(!open)}
          className="p-1 hover:bg-zinc-800 rounded-md transition-colors"
        >
          {open ? <X size={24}/> : <Menu size={24}/>}
        </button>
      </div>

      {/* OVERLAY */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] md:hidden transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* SIDEBAR ASIDE */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-black text-white transform transition-transform duration-300 ease-in-out z-[80] border-r border-white/5
        ${open ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0`}
      >
        <div className="flex flex-col h-full p-6 overflow-y-auto">
          
          {/* HEADER SIDEBAR DENGAN TOMBOL CLOSE UNTUK HP */}
          <div className="flex items-center justify-between mb-10 px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/20 bg-zinc-900 shrink-0">
                <img src={logoImg} alt="Logo" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <h1 className="font-bold text-sm leading-tight text-white tracking-tight">
                  KARANG TARUNA
                </h1>
                <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">
                 RW 18
                </p>
              </div>
            </div>

            {/* TOMBOL X (CLOSE) KHUSUS MOBILE DI DALAM SIDEBAR */}
            <button 
              onClick={() => setOpen(false)}
              className="md:hidden p-1 text-zinc-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* MENU NAVIGASI */}
          <nav className="flex flex-col gap-2">
            {menu.map((item) => {
              const active = isActivePath(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 border ${
                    active
                      ? 'bg-white text-black border-white shadow-lg'
                      : 'text-zinc-400 border-transparent hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={active ? 'text-black' : 'text-zinc-500'}>
                      {item.icon}
                    </span>
                    <span className="text-sm font-semibold tracking-tight">{item.name}</span>
                  </div>
                  {active && <ChevronRight size={14} className="text-black" />}
                </Link>
              );
            })}
          </nav>

          {/* FOOTER SIDEBAR */}
          <div className="mt-auto pt-6 border-t border-zinc-900">
            <div className="flex flex-col gap-1 px-2">
              <p className="text-[11px] font-bold text-zinc-400">
                Sistem Rekap Absensi
              </p>
              <p className="text-[10px] text-zinc-600">
                Karang Taruna RW 18
              </p>
              <p className="text-[9px] text-zinc-700 mt-4 uppercase tracking-widest font-bold">
                © {new Date().getFullYear()} All Rights Reserved
              </p>
            </div>
          </div>

        </div>
      </aside>
    </>
  );
};

export default Sidebar;