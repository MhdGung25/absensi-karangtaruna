import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit
} from "firebase/firestore";
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Activity
} from "lucide-react";

const Dashboard = () => {
  const [absensi, setAbsensi] = useState([]);
  const [namaKegiatan, setNamaKegiatan] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qKegiatan = query(
      collection(db, "kegiatan"),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const unsubscribeKegiatan = onSnapshot(qKegiatan, (snapshot) => {
      if (!snapshot.empty) {
        const kegiatanDoc = snapshot.docs[0];
        const kegiatanData = kegiatanDoc.data();
        setNamaKegiatan(kegiatanData.nama);

        const absensiRef = collection(
          db,
          "kegiatan",
          kegiatanDoc.id,
          "absensi"
        );

        const unsubscribeAbsensi = onSnapshot(absensiRef, (absenSnap) => {
          const dataAbsensi = absenSnap.docs.map((doc) => {
            const d = doc.data();
            return {
              id: doc.id,
              nama: d.nama,
              status: d.status || "Hadir",
              // ✅ Pastikan jabatan kosong menjadi "Anggota"
              jabatan: d.jabatan && d.jabatan.trim() !== "" ? d.jabatan : "Anggota",
            };
          });
          setAbsensi(dataAbsensi);
          setLoading(false);
        });

        return () => unsubscribeAbsensi();
      } else {
        setNamaKegiatan("");
        setAbsensi([]);
        setLoading(false);
      }
    });

    return () => unsubscribeKegiatan();
  }, []);

  const count = (status) =>
    absensi.filter((a) => a.status === status).length;

  const total = absensi.length;

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-8 pt-24 md:pt-8 md:ml-64 space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-800">
          Dashboard Absensi
        </h1>
        <p className="text-sm text-slate-500">
          Karang Taruna RW 18
        </p>
      </div>

      {/* KEGIATAN TERAKHIR */}
      {namaKegiatan && (
        <div className="bg-white p-4 rounded-xl shadow border">
          <p className="text-xs text-slate-400 uppercase">
            Kegiatan Terakhir
          </p>
          <p className="font-semibold text-slate-700 mt-1">
            {namaKegiatan}
          </p>
        </div>
      )}

      {/* LOADING */}
      {loading ? (
        <div className="text-center py-10 text-slate-400 text-sm">
          Memuat data...
        </div>
      ) : absensi.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border text-center text-slate-500">
          Belum ada data absensi.
        </div>
      ) : (
        <>
          {/* STATISTIK */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard title="Total" value={total} icon={<Users size={16} />} />
            <StatCard title="Hadir" value={count("Hadir")} icon={<CheckCircle2 size={16} />} />
            <StatCard title="Izin" value={count("Izin")} icon={<Clock size={16} />} />
            <StatCard title="Sakit" value={count("Sakit")} icon={<Activity size={16} />} />
            <StatCard title="Alpha" value={count("Tanpa Keterangan")} icon={<AlertCircle size={16} />} />
          </div>

          {/* DAFTAR ANGGOTA */}
          <div className="bg-white rounded-xl shadow border overflow-hidden mt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 text-slate-600 text-xs uppercase">
                  <tr>
                    <th className="p-3 text-center">No</th>
                    <th className="p-3 text-left">Nama</th>
                    <th className="p-3 text-left">Jabatan</th>
                    <th className="p-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {absensi.map((item, index) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-3 text-center">{index + 1}</td>
                      <td className="p-3 font-medium">{item.nama}</td>
                      <td className="p-3 font-semibold">
                        {item.jabatan} {/* Semua kosong otomatis jadi "Anggota" */}
                      </td>
                      <td className={`p-3 font-semibold ${
                        item.status === "Hadir"
                          ? "text-emerald-600"
                          : item.status === "Izin"
                          ? "text-amber-600"
                          : item.status === "Sakit"
                          ? "text-blue-600"
                          : "text-rose-600"
                      }`}>
                        {item.status === "Tanpa Keterangan"
                          ? "Alpha"
                          : item.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/* STAT CARD CLEAN VERSION */
const StatCard = ({ title, value, icon }) => (
  <div className="bg-white rounded-xl shadow border p-4 flex items-center justify-between">
    <div>
      <p className="text-xs text-slate-400 uppercase">
        {title}
      </p>
      <h2 className="text-lg font-bold text-slate-800 mt-1">
        {value}
      </h2>
    </div>
    <div className="text-slate-500">
      {icon}
    </div>
  </div>
);

export default Dashboard;
