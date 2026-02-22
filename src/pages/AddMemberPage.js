import React, { useState } from "react";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  UserPlus,
  Loader2,
  ChevronRight,
  ShieldCheck,
  Briefcase,
  User,
  Info
} from "lucide-react";

const AddMembers = () => {
  const navigate = useNavigate(); // Inisialisasi navigasi
  
  // --- STATE MANAGEMENT ---
  const [nama, setNama] = useState("");
  const [jabatan, setJabatan] = useState("");
  const [peran, setPeran] = useState("Anggota");
  const [statusAwal, setStatusAwal] = useState("Hadir");
  const [loading, setLoading] = useState(false);

  const toTitleCase = (text) => {
    if (!text) return "";
    return text
      .toString()
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const namaClean = nama.trim();
    
    if (!namaClean) return alert("Nama wajib diisi!");

    setLoading(true);
    try {
      const namaFix = toTitleCase(namaClean);
      const namaLower = namaFix.toLowerCase();

      const qNama = query(
        collection(db, "members"), 
        where("namaLower", "==", namaLower)
      );
      const snapNama = await getDocs(qNama);
      
      if (!snapNama.empty) {
        alert(`Gagal: Nama "${namaFix}" sudah terdaftar sebelumnya.`);
        setLoading(false);
        return;
      }

      const newMemberRef = doc(collection(db, "members"));
      await setDoc(newMemberRef, {
        nama: namaFix,
        namaLower: namaLower,
        kategori: peran === "Pengurus" ? toTitleCase(jabatan) : "Anggota",
        peran: peran,
        status: statusAwal, 
        createdAt: serverTimestamp(),
      });

      alert("Berhasil: Member baru telah ditambahkan.");
      
      // Berpindah halaman setelah alert ditutup
      setTimeout(() => {
        navigate("/members"); // Sesuaikan dengan route halaman members Anda
      }, 500);

    } catch (err) {
      console.error("Error saving member:", err);
      alert("Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FDFDFD] min-h-screen pt-24 pb-10 px-4 md:px-8 md:ml-[290px] transition-all text-black">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* --- HEADER (JUDUL DIGANTI) --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-6">
          <div className="flex items-center gap-4">
            <div className="bg-black p-3 rounded-xl text-white shadow-lg shadow-black/10">
              <UserPlus size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Manajemen  Rekap Absen Karta 18
              </p>
              <h1 className="text-2xl font-bold text-black tracking-tight uppercase">
                Pendataan Absen
              </h1>
            </div>
          </div>
          <div className="bg-white border border-zinc-200 px-4 py-2 rounded-xl text-[11px] font-bold text-zinc-500 shadow-sm flex items-center gap-2 w-fit">
            <Info size={14} className="text-zinc-400" />
             Rekap Absen Karta RW 18
          </div>
        </div>

        {/* --- ALERT BOX --- */}
        <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-2xl flex gap-3 items-center">
          <div className="bg-white p-2 rounded-lg border border-zinc-200 shadow-sm text-emerald-500">
            <ShieldCheck size={16} />
          </div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase leading-relaxed tracking-tight">
            Sistem Validasi Aktif: Pencegahan duplikasi data dilakukan secara otomatis.
          </p>
        </div>

        {/* --- FORM CARD --- */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-zinc-100 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-8">
            
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] ml-1">
                <User size={12} /> Nama Lengkap Member
              </label>
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Muhammad Agung Pamungkas"
                className="w-full px-6 py-4 bg-zinc-50/50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-black focus:bg-white outline-none transition-all font-bold text-black placeholder:text-zinc-300"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] ml-1 block text-black">Tipe Keanggotaan</label>
                <div className="relative text-black">
                  <select
                    value={peran}
                    onChange={(e) => setPeran(e.target.value)}
                    className="w-full px-6 py-4 bg-zinc-50/50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-black outline-none font-bold text-black transition-all cursor-pointer appearance-none"
                  >
                    <option value="Anggota">Anggota Biasa</option>
                    <option value="Pengurus">Pengurus Inti</option>
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                    <ChevronRight size={14} className="rotate-90" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] ml-1 block text-black">Status Awal</label>
                <div className="relative text-black">
                  <select
                    value={statusAwal}
                    onChange={(e) => setStatusAwal(e.target.value)}
                    className="w-full px-6 py-4 bg-zinc-50/50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-black outline-none font-bold text-black transition-all cursor-pointer appearance-none"
                  >
                    <option value="Hadir">Hadir</option>
                    <option value="Izin">Izin</option>
                    <option value="Sakit">Sakit</option>
                    <option value="Alfa">Alfa</option>
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                    <ChevronRight size={14} className="rotate-90" />
                  </div>
                </div>
              </div>
            </div>

            {peran === "Pengurus" && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] ml-1">
                  <Briefcase size={12} /> Jabatan Struktural
                </label>
                <input
                  type="text"
                  required={peran === "Pengurus"}
                  value={jabatan}
                  onChange={(e) => setJabatan(e.target.value)}
                  placeholder="Sekretaris / Bendahara / Ketua"
                  className="w-full px-6 py-4 bg-zinc-50/50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-black outline-none font-bold text-black transition-all"
                />
              </div>
            )}

            {/* BUTTON SUBMIT (TEKS DIGANTI REKAP ABSEN) */}
            <button
              type="submit"
              disabled={loading || !nama.trim()}
              className={`w-full py-5 rounded-2xl font-bold text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all mt-4
                ${loading || !nama.trim()
                  ? 'bg-zinc-100 text-zinc-300 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-zinc-800 active:scale-[0.98] shadow-xl shadow-black/5'}`}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <span>Rekap Absen</span>
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* --- FOOTER --- */}
        <div className="flex flex-col items-center gap-2 pt-8">
          <div className="h-[1px] w-8 bg-zinc-200"></div>
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.25em]">
            Sistem Absensi Karang Taruna Digital
          </p>
          <p className="text-[8px] text-zinc-300 font-medium">
            Copyright © 2026 • RW 18 Official Database
          </p>
        </div>
      </div>
    </div>
  );
}; 

export default AddMembers;