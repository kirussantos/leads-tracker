import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";

export function useCampanhas(clienteId = null, nivel = null) {
  const [campanhas, setCampanhas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const filters = [];
    if (clienteId) filters.push(where("cliente_id", "==", clienteId));
    if (nivel) filters.push(where("nivel", "==", nivel));

    const q = query(collection(db, "campanhas"), ...filters);
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort((a, b) => (b.cliques_whatsapp || 0) - (a.cliques_whatsapp || 0));
      setCampanhas(docs);
      setLoading(false);
    });
    return unsub;
  }, [clienteId, nivel]);

  return { campanhas, loading };
}
