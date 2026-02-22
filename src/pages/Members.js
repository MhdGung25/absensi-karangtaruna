import React, { useState, useEffect } from "react";
import db from '../firebase'; 
// logokarta dihapus karena logo tidak lagi digunakan di header rekap cetak

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
  Printer,
  MapPin,
  ChevronRight,
  Database,
  Trash2,
  ArrowRight,
  // UserCheck dihapus karena tidak digunakan
} from "lucide-react";

const Members = () => {
  const [members, setMembers] = useState([]);
  const [namaKegiatan, setNamaKegiatan] = useState("");
  const [lokasiKegiatan, setLokasiKegiatan] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [inputCount, setInputCount] = useState(0); 
  const [fetching, setFetching] = useState(true);

  const todayString = new Date().toISOString().split("T")[0];

  const formatText = (text) => {
    if (!text) return "";
    return text
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // getFullDateDisplay dihapus karena sudah diganti dengan inline .toUpperCase() di bagian cetak

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
              nama: formatText(d.nama) || "Tanpa Nama",
              jabatan: formatText(d.kategori || d.jabatan || "Anggota"),
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

  const handleHapusMember = async (id, nama) => {
    if (window.confirm(`Hapus ${nama} dari database?`)) {
      try {
        await deleteDoc(doc(db, "members", id));
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
        nama: formatText(namaKegiatan),
        lokasi: formatText(lokasiKegiatan),
        createdAt: serverTimestamp(),
        tanggalString: todayString,
      });

      const promises = members.map((m) =>
        setDoc(doc(doc(db, "kegiatan", kegiatanRef.id), "absensi", m.id), {
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-white md:ml-[260px]">
      <Loader2 className="animate-spin text-zinc-900" size={28} />
      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em] mt-4">Sinkronisasi Cloud...</p>
    </div>
  );

  return (
    <div className="bg-[#FAFAFA] min-h-screen pt-16 pb-12 px-4 md:px-8 md:ml-[260px] transition-all">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Style Khusus Cetak */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page { size: A4; margin: 1.5cm; }
            body * { visibility: hidden; }
            .print-container, .print-container * { visibility: visible; }
            .print-container { 
              position: absolute; left: 0; top: 0; width: 100%; 
              display: block !important; padding: 0; background-color: white;
            }
            .no-print { display: none !important; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; border: 2px solid #000; }
            th, td { border: 1px solid #000 !important; padding: 8px 12px; font-size: 10pt; color: black !important; }
            th { background-color: #f2f2f2 !important; font-weight: bold; text-transform: uppercase; }
          }
        `}} />

{/* --- AREA REKAP CETAK (HIGH CONTRAST & AUTO DATE) --- */}
<div className="hidden print:block print-container font-serif text-black p-0">
  
  {/* Header Laporan - Dibuat sangat kontras */}
  <div className="text-center mb-8 border-b-[3px] border-black pb-4">
    <h1 className="text-3xl font-bold uppercase tracking-tighter text-black" style={{ color: '#000' }}>
      Rekap Absensi Kegiatan
    </h1>
    <p className="text-base font-bold mt-1 text-black" style={{ color: '#000' }}>
      KARANG TARUNA RW 18 - PERUMAHAN PERMATA HIJAU
    </p>
  </div>

  {/* Informasi Agenda & Tanggal Otomatis */}
  <div className="flex justify-between items-end mb-6">
    <div className="space-y-2">
      <table className="text-sm font-bold border-none">
        <tbody>
          <tr>
            <td className="w-24 uppercase text-black" style={{ color: '#000' }}>Agenda</td>
            <td className="px-2 text-black" style={{ color: '#000' }}>:</td>
            <td className="uppercase border-b-2 border-black text-black min-w-[200px]" style={{ color: '#000' }}>
              {namaKegiatan || "____________________"}
            </td>
          </tr>
          <tr>
            <td className="uppercase text-black" style={{ color: '#000' }}>Lokasi</td>
            <td className="px-2 text-black" style={{ color: '#000' }}>:</td>
            <td className="uppercase border-b-2 border-black text-black min-w-[200px]" style={{ color: '#000' }}>
              {lokasiKegiatan || "____________________"}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    {/* Tanggal Otomatis Kalender - Font Black 900 untuk ketajaman maksimal */}
    <div className="text-right">
      <p className="text-[14px] font-[900] uppercase text-black border-2 border-black px-3 py-1" style={{ color: '#000' }}>
        {new Date().toLocaleDateString("id-ID", { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        }).toUpperCase()}
      </p>
    </div>
  </div>

  {/* Tabel Data - Border Tebal 2px agar tidak buram */}
  <table className="w-full border-collapse border-[2px] border-black">
    <thead>
      <tr className="bg-zinc-200" style={{ backgroundColor: '#e4e4e7 !important', printColorAdjust: 'exact' }}>
        <th className="border-[2px] border-black py-3 px-3 text-center w-12 text-xs font-black uppercase text-black" style={{ color: '#000' }}>No</th>
        <th className="border-[2px] border-black py-3 px-4 text-left text-xs font-black uppercase text-black" style={{ color: '#000' }}>Nama Lengkap</th>
        <th className="border-[2px] border-black py-3 px-4 text-left text-xs font-black uppercase text-black" style={{ color: '#000' }}>Jabatan</th>
        <th className="border-[2px] border-black py-3 px-4 text-center w-32 text-xs font-black uppercase text-black" style={{ color: '#000' }}>Status</th>
      </tr>
    </thead>
    <tbody>
      {members.map((m, i) => (
        <tr key={m.id}>
          <td className="border-[2px] border-black py-3 px-3 text-center text-sm font-bold text-black" style={{ color: '#000' }}>{i + 1}</td>
          <td className="border-[2px] border-black py-3 px-4 text-sm font-black uppercase text-black" style={{ color: '#000' }}>{m.nama}</td>
          <td className="border-[2px] border-black py-3 px-4 text-sm font-bold italic text-black" style={{ color: '#000' }}>{m.jabatan}</td>
          <td className="border-[2px] border-black py-3 px-4 text-center text-sm font-black uppercase text-black" style={{ color: '#000' }}>{m.status}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

        {/* --- TAMPILAN DASHBOARD (SCREEN ONLY) --- */}
        <div className="no-print space-y-6">
          
          {/* Header Dashboard */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
            <div className="flex items-center gap-4">
              <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-sm text-zinc-400">
                <Database size={22} />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Database Management</p>
                <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Data Anggota</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-white border border-zinc-200 px-4 py-2 rounded-lg text-[11px] font-bold text-zinc-600 shadow-sm flex items-center gap-2">
                <Calendar size={14} className="text-zinc-400" />
                {new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <button onClick={handlePrint} className="p-2.5 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-all">
                <Printer size={18} />
              </button>
            </div>
          </div>

          {/* Form Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
              <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-2 tracking-widest">Nama Agenda Kegiatan</label>
              <div className="flex items-center gap-3">
                <ArrowRight size={16} className="text-zinc-300" />
                <input 
                  type="text" value={namaKegiatan} 
                  onChange={(e) => setNamaKegiatan(e.target.value)} 
                  placeholder="Contoh: Rapat Kerja Bulanan" 
                  className="w-full bg-transparent outline-none font-semibold text-zinc-800 text-base" 
                />
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
              <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-2 tracking-widest">Lokasi Pelaksanaan</label>
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-zinc-300" />
                <input 
                  type="text" value={lokasiKegiatan} 
                  onChange={(e) => setLokasiKegiatan(e.target.value)} 
                  placeholder="Lokasi spesifik..." 
                  className="w-full bg-transparent outline-none font-semibold text-zinc-800 text-base" 
                />
              </div>
            </div>
          </div>

          {/* Tabel Anggota */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <h3 className="font-bold text-zinc-800 text-sm italic">Daftar Kehadiran Anggota</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-zinc-400 font-bold text-[9px] uppercase tracking-widest border-b border-zinc-100">
                    <th className="py-4 px-6 text-center w-16">No</th>
                    <th className="py-4 px-4">Profil Anggota</th>
                    <th className="py-4 px-4 text-center">Status</th>
                    <th className="py-4 px-6 text-center w-20">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {members.map((m, i) => (
                    <tr key={m.id} className="hover:bg-zinc-50/50">
                      <td className="py-4 px-6 text-center text-zinc-300 font-bold text-xs">{i + 1}</td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-zinc-800 text-sm">{m.nama}</span>
                          <span className="text-[9px] text-zinc-400 font-bold uppercase bg-zinc-100 w-fit px-1.5 py-0.5 rounded">{m.jabatan}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border
                          ${m.status === 'Hadir' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-200'}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button onClick={() => handleHapusMember(m.id, m.nama)} className="p-2 text-zinc-300 hover:text-rose-500 transition-all">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-6 px-2 border-t border-zinc-200">
            <div className="flex items-center gap-3">
              <Database size={18} className="text-zinc-400" />
              <div>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Status Sinkronisasi</p>
                <p className="text-sm font-bold text-zinc-700">{inputCount} Arsip Tersimpan</p>
              </div>
            </div>

            <button
              onClick={handleSimpanAbsensi}
              disabled={loading || !isInputLengkap}
              className={`w-full md:w-auto px-8 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all
                ${loading || !isInputLengkap ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}
            >
              {loading ? <Loader2 className="animate-spin" size={14} /> : <><span>Simpan Arsip</span><ChevronRight size={14} /></>}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Members;