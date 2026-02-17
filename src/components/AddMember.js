import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { UserPlus } from 'lucide-react';

const AddMember = () => {
  const [nama, setNama] = useState('');
  const [jabatan, setJabatan] = useState('Anggota');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nama.trim()) return;
    await addDoc(collection(db, "absensi"), {
      nama, jabatan, hadir: false, timestamp: new Date()
    });
    setNama('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Nama Lengkap</label>
        <input 
          type="text" value={nama} onChange={(e) => setNama(e.target.value)}
          placeholder="Ex: Muhammad Agung"
          className="w-full p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-blue-100 outline-none text-sm"
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Jabatan</label>
        <select 
          value={jabatan} onChange={(e) => setJabatan(e.target.value)}
          className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none text-sm"
        >
          <option>Pengurus</option>
          <option>Anggota</option>
        </select>
      </div>
      <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-100 flex items-center justify-center gap-2 hover:bg-blue-700 transition-all">
        <UserPlus size={18} /> Tambah Ke Daftar
      </button>
    </form>
  );
};

export default AddMember;