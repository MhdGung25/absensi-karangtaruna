import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc,
  getDocs
} from "firebase/firestore";
import { Trash2 } from "lucide-react";

const AttendanceArchive = () => {
  const [kegiatanList, setKegiatanList] = useState([]);
  const [absensiMap, setAbsensiMap] = useState({});
  const [selectedDelete, setSelectedDelete] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  // =========================
// FORMAT TITLE CASE OTOMATIS
// =========================
const toTitleCase = (text) => {
  if (!text) return "";

  return text
    .toString()
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};


  /* =========================
     🔹 AMBIL KEGIATAN
  ========================== */
  useEffect(() => {
    const q = query(collection(db, "kegiatan"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const kegiatan = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setKegiatanList(kegiatan);

      // Ambil absensi per kegiatan
      kegiatan.forEach((k) => {
        const absensiRef = collection(db, "kegiatan", k.id, "absensi");
        onSnapshot(absensiRef, (snap) => {
          setAbsensiMap((prev) => ({
            ...prev,
            [k.id]: snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
          }));
        });
      });
    });

    return () => unsubscribe();
  }, []);

  /* =========================
     🔹 HAPUS KEGIATAN PERMANEN
  ========================== */
  const handleDelete = async () => {
    if (!selectedDelete) return;

    try {
      setLoadingDelete(true);

      // Hapus semua absensi dulu
      const absensiRef = collection(db, "kegiatan", selectedDelete.id, "absensi");
      const absensiSnap = await getDocs(absensiRef);

      for (const docSnap of absensiSnap.docs) {
        await deleteDoc(docSnap.ref);
      }

      // Hapus kegiatan
      await deleteDoc(doc(db, "kegiatan", selectedDelete.id));
      setSelectedDelete(null);
    } catch (error) {
      console.error(error);
      alert("Gagal menghapus data!");
    } finally {
      setLoadingDelete(false);
    }
  };

  // =========================
// FORMAT TANGGAL
// =========================
const formatTanggalLengkap = (timestamp) => {
  if (!timestamp?.toDate) return "Tanpa Tanggal";
  const date = timestamp.toDate();
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};



  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-8 pt-20 md:pt-8 md:ml-64 space-y-10">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Arsip Absensi</h1>
        <p className="text-slate-500 text-sm">Riwayat absensi kegiatan</p>
      </div>

      {kegiatanList.map((kegiatan) => {
        const absensiData = absensiMap[kegiatan.id] || [];
        const totalHadir = absensiData.filter(a => a.status === "Hadir").length;
        const totalIzin = absensiData.filter(a => a.status === "Izin").length;
        const totalSakit = absensiData.filter(a => a.status === "Sakit").length;
        const totalTanpa = absensiData.filter(a => a.status === "Tanpa Keterangan").length;

        return (
          <div key={kegiatan.id} className="bg-white rounded-2xl shadow border overflow-hidden">

            {/* HEADER KEGIATAN */}
            <div className="p-6 border-b bg-slate-100 flex justify-between items-center flex-col md:flex-row md:items-center gap-4 md:gap-0">
              <div>
                <h2 className="text-lg font-bold text-slate-800">{toTitleCase(kegiatan.nama)}
</h2>
                <p className="text-sm text-slate-500">
                  {formatTanggalLengkap(kegiatan.createdAt)}
                </p>
              </div>

              <button
                onClick={() => setSelectedDelete(kegiatan)}
                className="flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition text-sm"
              >
                <Trash2 size={16} />
                Hapus
              </button>
            </div>

            {/* STATISTIK */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
              <StatCard title="Hadir" value={totalHadir} color="green" />
              <StatCard title="Izin" value={totalIzin} color="yellow" />
              <StatCard title="Sakit" value={totalSakit} color="blue" />
              <StatCard title="Tanpa Ket." value={totalTanpa} color="red" />
            </div>

            {/* TABEL ABSENSI */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                  <tr>
                    <th className="p-3 text-center">No</th>
                    <th className="p-3 text-left">Nama</th>
                    <th className="p-3 text-left">Jabatan</th>
                    <th className="p-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {absensiData.map((a, index) => (
                    <tr key={a.id} className="border-t">
                      <td className="p-3 text-center">{index + 1}</td>
                      <td className="p-3 font-medium">{toTitleCase(a.nama)}</td>
                      <td className="p-3">{toTitleCase(a.jabatan || "")}</td>
                      <td className="p-3">{toTitleCase(a.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        );
      })}

      {/* MODAL KONFIRMASI HAPUS */}
      {selectedDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-80 text-center">
            <h3 className="text-lg font-semibold mb-2">Hapus Data?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Apakah Anda yakin ingin menghapus kegiatan <span className="font-medium">{selectedDelete.nama}</span> beserta semua absensinya?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setSelectedDelete(null)}
                className="px-4 py-2 rounded-lg border"
              >
                Tidak
              </button>
              <button
                onClick={handleDelete}
                disabled={loadingDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
              >
                {loadingDelete ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

/* =========================
   🔹 COMPONENT STAT CARD
========================== */
const StatCard = ({ title, value, color }) => {
  const colors = {
    green: "bg-green-100 text-green-800",
    yellow: "bg-yellow-100 text-yellow-800",
    blue: "bg-blue-100 text-blue-800",
    red: "bg-red-100 text-red-800",
  };
  return (
    <div className={`p-3 rounded-xl text-center ${colors[color]}`}>
      <p className="text-xs">{title}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
};

export default AttendanceArchive;
