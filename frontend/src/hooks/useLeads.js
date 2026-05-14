import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "../firebase";

export function useLeads(clienteId = null) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const filters = [];
    if (clienteId) filters.push(where("cliente_id", "==", clienteId));

    const q = query(collection(db, "leads"), ...filters);
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort((a, b) => (b.registrado_em?.seconds || 0) - (a.registrado_em?.seconds || 0));
      setLeads(docs);
      setLoading(false);
    });
    return unsub;
  }, [clienteId]);

  return { leads, loading };
}
