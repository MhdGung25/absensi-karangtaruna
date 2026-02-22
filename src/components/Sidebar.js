import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Menu,
  X,
  Archive,
  ArrowRight,
} from 'lucide-react';
import logoImg from '../assets/logo tarka.jpeg';

const Sidebar = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const menu = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={22}/> },
    { name: 'Tambah Member', path: '/add', icon: <UserPlus size={22}/> },
    { name: 'Input Absensi', path: '/members', icon: <Users size={22}/> },
    { name: 'Arsip Kegiatan', path: '/arsip', icon: <Archive size={22}/> },
  ];

  const isActivePath = (path) => location.pathname === path;

  return (
    <>
      {/* MOBILE TOP BAR */}
      <div className="md:hidden flex items-center justify-between bg-white/80 backdrop-blur-xl text-black px-6 py-5 fixed w-full top-0 z-[60] border-b border-zinc-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-inner border border-zinc-100">
            <img src={logoImg} alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="font-black text-[12px] tracking-tighter uppercase leading-tight italic">
            REKAP ABSEN <br/><span className="text-zinc-400 text-[10px]">KARTA RW 18</span>
          </h1>
        </div>
        
        {/* Burger Menu Button (Hanya muncul jika sidebar tertutup) */}
        {!open && (
          <button 
            onClick={() => setOpen(true)}
            className="p-2.5 bg-black text-white rounded-2xl active:scale-90 transition-all shadow-xl shadow-black/20"
          >
            <Menu size={20}/>
          </button>
        )}
      </div>

      {/* OVERLAY */}
      {open && (
        <div
          className="fixed inset-0 bg-zinc-900/40 backdrop-blur-md z-[70] md:hidden transition-opacity duration-500"
          onClick={() => setOpen(false)}
        />
      )}

      {/* SIDEBAR ASIDE */}
      <aside
        className={`fixed top-0 left-0 h-full w-[290px] bg-[#FDFDFD] text-zinc-500 transform transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] z-[80] border-r border-zinc-100
        ${open ? 'translate-x-0 shadow-[40px_0_80px_rgba(0,0,0,0.05)]' : '-translate-x-full'}
        md:translate-x-0`}
      >
        <div className="flex flex-col h-full p-8 overflow-y-auto relative">
          
          {/* TOMBOL X (Hanya muncul di Mobile saat sidebar Open) */}
          <button 
            onClick={() => setOpen(false)}
            className="md:hidden absolute top-7 right-7 p-2.5 bg-zinc-100 text-black rounded-xl hover:bg-black hover:text-white transition-all z-[90]"
          >
            <X size={20} />
          </button>

          {/* HEADER SECTION */}
          <div className="flex flex-col mb-12 mt-4 md:mt-2">
            <div className="flex items-center gap-4">
              <div className="shrink-0">
                <div className="w-14 h-14 rounded-[22px] overflow-hidden bg-white shadow-2xl border-4 border-white ring-1 ring-zinc-100 flex items-center justify-center">
                  <img src={logoImg} alt="Logo" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-black text-[17px] text-black tracking-tighter uppercase leading-none italic">
                  REKAP ABSEN
                </span>
                <span className="font-bold text-[13px] text-zinc-400 tracking-tight uppercase">
                  Karta RW 18
                </span>
              </div>
            </div>
          </div>

          {/* MENU NAVIGASI */}
          <nav className="flex flex-col gap-2">
            <p className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.3em] mb-4 px-2">Main Menu</p>
            {menu.map((item) => {
              const active = isActivePath(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className={`group relative flex items-center gap-4 px-6 py-4 rounded-[24px] transition-all duration-500 ${
                    active
                      ? 'bg-black text-white shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] -translate-y-1'
                      : 'text-zinc-400 hover:text-black hover:bg-zinc-50'
                  }`}
                >
                  <span className={`transition-all duration-500 ${active ? 'scale-110 text-white' : 'group-hover:translate-x-1 group-hover:text-black'}`}>
                    {item.icon}
                  </span>
                  <span className={`text-[14px] font-bold tracking-tight ${active ? 'text-white' : ''}`}>
                    {item.name}
                  </span>
                  
                  {active ? (
                    <div className="ml-auto bg-white/20 p-1.5 rounded-xl">
                      <ArrowRight size={14} className="text-white" />
                    </div>
                  ) : (
                    <ArrowRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* FOOTER */}
          <div className="mt-auto pt-8">
            <p className="text-[9px] text-zinc-300 font-bold uppercase tracking-[0.2em] leading-relaxed text-center">
              © {new Date().getFullYear()} <br/> 
              <span className="text-zinc-400">Unit Administrasi Karta 18</span>
            </p>
          </div>

        </div>
      </aside>
    </>
  );
};

export default Sidebar;