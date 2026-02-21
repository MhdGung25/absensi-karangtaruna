import React, { useState } from "react";
import db from "../firebase"; 
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
  ShieldCheck
} from "lucide-react";

const AddMembers = () => {
  // --- STATE MANAGEMENT ---
  const [nama, setNama] = useState("");
  const [jabatan, setJabatan] = useState("");
  const [peran, setPeran] = useState("Anggota");
  const [statusAwal, setStatusAwal] = useState("Hadir"); // Default status
  const [loading, setLoading] = useState(false);

  // Fungsi Helper: Mengubah "andi wijaya" menjadi "Andi Wijaya"
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

      // --- 1. VALIDASI DUPLIKAT GLOBAL ---
      // Mengecek ke seluruh koleksi members apakah namaLower sudah ada
      const qNama = query(
        collection(db, "members"), 
        where("namaLower", "==", namaLower)
      );
      const snapNama = await getDocs(qNama);
      
      if (!snapNama.empty) {
        alert(`Gagal: Nama "${namaFix}" sudah terdaftar sebelumnya sebagai ${snapNama.docs[0].data().peran}.`);
        setLoading(false);
        return;
      }

      // --- 2. SIMPAN KE FIRESTORE ---
      const newMemberRef = doc(collection(db, "members"));
      await setDoc(newMemberRef, {
        nama: namaFix,
        namaLower: namaLower,
        // Jika Pengurus pakai input jabatan, jika Anggota otomatis "Anggota"
        kategori: peran === "Pengurus" ? toTitleCase(jabatan) : "Anggota",
        peran: peran,
        status: statusAwal, 
        createdAt: serverTimestamp(),
      });

      alert("Berhasil: Member baru telah ditambahkan ke database.");
      
      // --- 3. RESET FORM ---
      setNama("");
      setJabatan("");
      setPeran("Anggota");
      setStatusAwal("Hadir");

    } catch (err) {
      console.error("Error saving member:", err);
      alert("Terjadi kesalahan sistem saat menyimpan data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen pt-24 pb-10 px-4 md:px-8 md:ml-64 transition-all">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm text-slate-800">
              <UserPlus size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-none">Pendaftaran Member</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">
                Rekap Absen Karta RW 18 • Tanpa Batas Input
              </p>
            </div>
          </div>
        </div>

        {/* --- INFO VALIDASI --- */}
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3 items-start text-blue-600">
          <ShieldCheck size={18} className="shrink-0 mt-0.5" />
          <p className="text-[10px] font-bold uppercase leading-relaxed tracking-tight">
            Sistem Keamanan Aktif: Nama yang sudah terdaftar tidak dapat diinput kembali untuk menjaga integritas data absensi.
          </p>
        </div>

        {/* --- FORM CARD --- */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden transition-all">
          <div className="p-6 md:p-10 space-y-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* INPUT NAMA */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Nama Lengkap Member</label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Masukkan nama lengkap..."
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* PILIH KATEGORI */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Tipe Keanggotaan</label>
                  <select
                    value={peran}
                    onChange={(e) => setPeran(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none font-bold text-slate-700 transition-all cursor-pointer appearance-none"
                  >
                    <option value="Anggota">Anggota Biasa</option>
                    <option value="Pengurus">Pengurus Inti</option>
                  </select>
                </div>
                
                {/* STATUS AWAL (TERMASUK OPSI ALFA) */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Status Absensi Default</label>
                  <select
                    value={statusAwal}
                    onChange={(e) => setStatusAwal(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none font-bold text-slate-700 transition-all cursor-pointer appearance-none"
                  >
                    <option value="Hadir">Hadir</option>
                    <option value="Izin">Izin</option>
                    <option value="Sakit">Sakit</option>
                    <option value="Alfa">Alfa</option>
                  </select>
                </div>
              </div>

              {/* JABATAN SPESIFIK (HANYA JIKA PENGURUS) */}
              {peran === "Pengurus" && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Jabatan Struktural</label>
                  <input
                    type="text"
                    required={peran === "Pengurus"}
                    value={jabatan}
                    onChange={(e) => setJabatan(e.target.value)}
                    placeholder="Contoh: Sekretaris / Bendahara"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none font-bold text-slate-700 transition-all"
                  />
                </div>
              )}

              {/* BUTTON SUBMIT */}
              <button
                type="submit"
                disabled={loading || !nama.trim()}
                className={`w-full py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.25em] flex items-center justify-center gap-3 transition-all mt-4
                  ${loading || !nama.trim()
                    ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                    : 'bg-slate-900 text-white hover:bg-black active:scale-[0.98] shadow-xl shadow-slate-200'}`}
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <span>Daftarkan Member</span>
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

       {/* --- FOOTER FORMAL --- */}
<div className="flex flex-col items-center gap-2 pt-8 pb-4">
  <div className="h-[1px] w-12 bg-slate-200 mb-2"></div>
  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
    Rekap Member Karta RW 18
  </p>
  <p className="text-[9px] text-slate-300 font-medium">
    Sistem Manajemen Database Internal
  </p>
</div>
      </div>
    </div>
  );
};

export default AddMembers;