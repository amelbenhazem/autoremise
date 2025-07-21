'use client';

import { useState } from "react";
import { parseExcel } from "@/utils/parseExcel";
import { validateHeader, validateRow } from "@/utils/validators";

export default function HomePage() {
  const [bank, setBank] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!bank || !type) {
      if (!bank && !type) {
        setStatus("Veuillez choisir une banque et un type de remise.");
      } else if (!bank) {
        setStatus("Veuillez choisir une banque.");
      } else if (!type) {
        setStatus("Veuillez choisir un type de remise.");
      }
      return;
    }

    try {
      const rows = await parseExcel(file);
      if (rows.length === 0) {
        setStatus("Fichier vide.");
        return;
      }

      const headerErrors = validateHeader(rows[0], bank, type);
      if (headerErrors.length > 0) {
        setErrors(headerErrors);
        setStatus("Colonnes manquantes.");
        return;
      }

      const rowErrors: string[] = [];
      rows.forEach((row, index) => {
        const errs = validateRow(row);
        if (errs.length > 0) {
          rowErrors.push(`Ligne ${index + 2} : ${errs.join(", ")}`);
        }
      });

      if (rowErrors.length > 0) {
        setErrors(rowErrors);
        setStatus("Erreurs détectées.");
      } else {
        setErrors([]);
        setStatus("Données valides.");
      }
    } catch (err) {
      setStatus("Erreur de lecture du fichier.");
    }
  };

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">AutoRemise</h1>

      <div className="mb-4">
        <label className="block">Banque :</label>
        <select
          onChange={(e) => setBank(e.target.value)}
          value={bank}
          className="border p-2 w-full"
        >
          <option value="">-- Choisir une banque --</option>
          <option value="ALBARAKA">ALBARAKA</option>
          <option value="BIAT">BIAT</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block">Type de remise :</label>
        <select
          onChange={(e) => setType(e.target.value)}
          value={type}
          className="border p-2 w-full"
        >
          <option value="">-- Choisir un type --</option>
          <option value="chèque">Chèque</option>
          <option value="effet">Effet</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block">Importer fichier Excel :</label>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFile}
          disabled={!bank || !type}
          className={`transition duration-300 ${
            !bank || !type ? "opacity-50 cursor-not-allowed" : "opacity-100"
          }`}
        />
      </div>

      {status && <div className="mt-2 font-semibold">{status}</div>}

      {errors.length > 0 && (
        <div className="mt-2 text-red-600">
          <ul className="list-disc ml-6">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <a href="/template-editor" style={{
        display: 'inline-block',
        margin: '24px 0',
        padding: '12px 24px',
        background: '#0070f3',
        color: '#fff',
        borderRadius: 8,
        textDecoration: 'none',
        fontWeight: 600,
      }}>
     l'éditeur de template
      </a>
    </main>
  );
}
