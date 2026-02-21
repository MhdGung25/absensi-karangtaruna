import React, { useState, useEffect } from "react";
import db from '../firebase'; 
import logoTarka from '../assets/logo tarka.jpeg'; 
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  addDoc,
  deleteDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  Loader2,
  Calendar,
  AlertCircle,
  Printer,
  UserCheck,
  MapPin,
  ChevronRight,
  Database,
  Trash2
} from "lucide-react";

const Members = () => {
  const [members, setMembers] = useState([]);
  const [namaKegiatan, setNamaKegiatan] = useState("");
  const [lokasiKegiatan, setLokasiKegiatan] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [inputCount, setInputCount] = useState(0); 
  const [fetching, setFetching] = useState(true);

  const todayString = new Date().toISOString().split("T")[0];

  // Fungsi Helper: Otomatis Kapital di Awal Kata (Title Case)
  const formatText = (text) => {
    return text
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getFullDateDisplay = () => {
    return new Date().toLocaleDateString("id-ID", { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const isInputLengkap = namaKegiatan.trim() !== "" && lokasiKegiatan.trim() !== "" && members.length > 0;

  useEffect(() => {
    if (!db) return;
    const initData = async () => {
      try {
        const q = query(collection(db, "kegiatan"), where("tanggalString", "==", todayString));
        const snap = await getDocs(q);
        setInputCount(snap.size);

        const unsub = onSnapshot(collection(db, "members"), (snapshot) => {
          const data = snapshot.docs.map((doc) => {
            const d = doc.data();
            return {
              id: doc.id,
              nama: d.nama || "Tanpa Nama",
              jabatan: d.kategori || d.jabatan || "Anggota",
              status: d.status || d.statusDefault || "Hadir",
            };
          });
          setMembers(data.sort((a, b) => a.nama.localeCompare(b.nama)));
          setFetching(false);
        });
        return () => unsub();
      } catch (err) {
        setFetching(false);
      }
    };
    initData();
  }, [todayString]);

  // FUNGSI HAPUS MEMBER
  const handleHapusMember = async (id, nama) => {
    if (window.confirm(`Hapus ${nama} dari daftar database?`)) {
      try {
        await deleteDoc(doc(db, "members", id));
        alert("Member berhasil dihapus.");
      } catch (err) {
        alert("Gagal menghapus: " + err.message);
      }
    }
  };

  const handlePrint = () => {
    if (!isInputLengkap) return alert("Lengkapi Nama Agenda dan Lokasi untuk mencetak!");
    window.print();
  };

  const handleSimpanAbsensi = async () => {
    if (!isInputLengkap) return alert("Lengkapi data agenda dan lokasi!");
    setLoading(true);
    try {
      const kegiatanRef = await addDoc(collection(db, "kegiatan"), {
        nama: formatText(namaKegiatan), // Otomatis Format
        lokasi: formatText(lokasiKegiatan), // Otomatis Format
        createdAt: serverTimestamp(),
        tanggalString: todayString,
      });

      const promises = members.map((m) =>
        setDoc(doc(db, "kegiatan", kegiatanRef.id, "absensi", m.id), {
          nama: m.nama,
          jabatan: m.jabatan,
          status: m.status,
          waktuInput: serverTimestamp(),
        })
      );
      await Promise.all(promises);
      setInputCount(prev => prev + 1);
      setNamaKegiatan("");
      setLokasiKegiatan("");
      alert("Arsip absensi berhasil disimpan!");
    } catch (err) { 
      alert("Error: " + err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  if (fetching) return (
    <div className="flex items-center justify-center min-h-screen bg-white md:ml-64">
      <Loader2 className="animate-spin text-slate-400" size={32} />
    </div>
  );

  return (
    <div className="bg-[#f8fafc] min-h-screen pt-24 pb-20 px-4 md:px-8 md:ml-64 transition-all">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page { size: A4; margin: 1.5cm; }
            body * { visibility: hidden; }
            .print-container, .print-container * { visibility: visible; }
            .print-container { position: absolute; left: 0; top: 0; width: 100%; display: block !important; padding: 20px; }
            .no-print { display: none !important; }
          }
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}} />

        {/* --- 1. AREA REKAP CETAK (FORMAL) --- */}
        <div className="hidden print:block print-container font-sans text-slate-900 bg-white">
          <div className="flex items-center justify-center gap-6 mb-4 border-b-2 border-slate-900 pb-4">
            <img src={logoTarka} alt="Logo" className="w-20 h-20 object-contain" />
            <div className="text-center"> 
              <h1 className="font-bold text-2xl uppercase tracking-tighter">Karang Taruna RW 18</h1>
              <h2 className="font-semibold text-lg text-slate-700">Perumahan Permata Hijau</h2>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Sekretariat Digital • Kab. Bandung, Jawa Barat</p>
            </div>
          </div>
          
          <div className="flex justify-between items-start mb-8 px-2 border-b border-zinc-100 pb-6">
  {/* Bagian Kiri: Judul & Detail */}
  <div className="space-y-1.5">
    <h3 className="text-lg font-bold tracking-tight text-zinc-900">Rekap Absensi</h3>
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black uppercase text-zinc-400 w-12">Agenda</span>
        <span className="text-xs font-semibold text-zinc-700">: {autoFormatText(namaKegiatan) || "-"}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black uppercase text-zinc-400 w-12">Lokasi</span>
        <span className="text-xs font-semibold text-zinc-700">: {autoFormatText(lokasiKegiatan) || "-"}</span>
      </div>
    </div>
  </div>

  {/* Bagian Kanan: Tanggal */}
  <div className="text-right">
    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Tanggal Pelaksanaan</p>
    <p className="text-sm font-bold text-zinc-900">{getFullDateDisplay()}</p>
  </div>
</div>

          <table className="w-full border-collapse border border-slate-400">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-400 p-2 text-[10px] w-10">NO</th>
                <th className="border border-slate-400 p-2 text-[10px] text-left uppercase">Nama Lengkap</th>
                <th className="border border-slate-400 p-2 text-[10px] text-center w-32 uppercase">Jabatan</th>
                <th className="border border-slate-400 p-2 text-[10px] text-center w-24 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <tr key={m.id}>
                  <td className="border border-slate-400 p-2 text-center text-[10px] font-medium">{i + 1}</td>
                  <td className="border border-slate-400 p-2 text-[10px] font-bold tracking-tight">{m.nama}</td>
                  <td className="border border-slate-400 p-2 text-center text-[9px] italic text-slate-600">{m.jabatan}</td>
                  <td className="border border-slate-400 p-2 text-center text-[10px] font-black">{m.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- 2. TAMPILAN DASHBOARD (NO PRINT) --- */}
        <div className="no-print space-y-6">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white border border-slate-200 p-2.5 rounded-2xl shadow-sm text-slate-800">
                <UserCheck size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-none">Presensi Kegiatan</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1.5"> KArta RW 18 Rekapitulasi</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-[11px] font-bold text-slate-600 shadow-sm flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" />
                  {new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
               </div>
               <button onClick={handlePrint} className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 active:scale-95 transition-all text-slate-600">
                  <Printer size={18} />
               </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm transition-all focus-within:border-slate-900">
              <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest px-1">Nama Agenda</label>
              <input 
                type="text" 
                value={namaKegiatan} 
                onChange={(e) => setNamaKegiatan(e.target.value)} 
                placeholder="Contoh: Rapat Mingguan..." 
                className="w-full bg-transparent outline-none font-bold text-slate-700 placeholder:text-slate-200" 
              />
            </div>
            <div className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm transition-all focus-within:border-slate-900">
              <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest px-1">Lokasi Tempat</label>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-slate-300" />
                <input 
                  type="text" 
                  value={lokasiKegiatan} 
                  onChange={(e) => setLokasiKegiatan(e.target.value)} 
                  placeholder="Contoh: Balai Warga..." 
                  className="w-full bg-transparent outline-none font-bold text-slate-700 placeholder:text-slate-200" 
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto hide-scrollbar">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                    <th className="py-5 px-6 text-center w-16">#</th>
                    <th className="py-5 px-2 text-left">Member</th>
                    <th className="py-5 px-6 text-center w-32">Status</th>
                    <th className="py-5 px-6 text-center w-20">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {members.map((m, i) => (
                    <tr key={m.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="py-5 px-6 text-slate-300 font-bold text-xs text-center group-hover:text-slate-900">{i + 1}</td>
                      <td className="py-5 px-2">
                        <p className="font-bold text-slate-700 text-sm leading-none group-hover:text-black">{m.nama}</p>
                        <p className="text-[9px] text-slate-400 mt-1.5 font-bold italic">{m.jabatan}</p>
                      </td>
                      <td className="py-5 px-6 text-center">
                        <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase border
                            ${m.status === 'Hadir' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                              m.status === 'Izin' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                              m.status === 'Sakit' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                              'bg-rose-50 text-rose-600 border-rose-100'}`}>
                          {m.status}
                        </div>
                      </td>
                      <td className="py-5 px-6 text-center">
                        <button 
                          onClick={() => handleHapusMember(m.id, m.nama)}
                          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4">
            <div className="flex items-center gap-3 px-2">
              <div className="bg-slate-100 p-2 rounded-lg">
                <Database size={16} className="text-slate-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Ringkasan Arsip</p>
                <p className="text-sm font-bold text-slate-600 mt-1">{inputCount} Kegiatan tersimpan hari ini</p>
              </div>
            </div>

            <button
              onClick={handleSimpanAbsensi}
              disabled={loading || !isInputLengkap}
              className={`w-full md:w-auto px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95
                ${loading || !isInputLengkap 
                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200' 
                  : 'bg-slate-900 text-white hover:bg-black shadow-lg shadow-slate-200'}`}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <>
                  <span>Simpan Absensi</span>
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <AlertCircle size={14} className="text-slate-400 shrink-0" />
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
              Gunakan ikon sampah jika ingin menghapus member secara permanen. Nama Agenda & Lokasi otomatis diperbaiki formatnya saat disimpan.
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Members;