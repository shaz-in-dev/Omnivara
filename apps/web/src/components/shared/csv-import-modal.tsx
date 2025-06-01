'use client';
import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Download, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface ImportResult {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; reason: string }>;
}

interface CsvImportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (result: ImportResult) => void;
  /** API path to POST the file to, e.g. '/crm/leads/import' */
  importUrl: string;
  /** API path to GET the template CSV from */
  templateUrl: string;
  entity: string; // "leads" | "contacts" etc.
}

export function CsvImportModal({ open, onClose, onSuccess, importUrl, templateUrl, entity }: CsvImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = (f: File) => {
    if (!f.name.match(/\.(csv|txt)$/i)) {
      setError('Please upload a CSV file (.csv)');
      return;
    }
    setFile(f);
    setError(null);
    setResult(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post<ImportResult>(importUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      onSuccess(res.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Import failed. Please check your file and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get(templateUrl, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data as BlobPart], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entity}-template.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: just trigger a direct download link
      window.open(`${process.env.NEXT_PUBLIC_API_URL ?? ''}${templateUrl}`, '_blank');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Import {entity.charAt(0).toUpperCase() + entity.slice(1)}
          </h2>
          <button onClick={handleClose} className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {/* Result state */}
          {result ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-green-50 px-4 py-3 dark:bg-green-900/20">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                    Import complete
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-400">
                    {result.imported} imported · {result.skipped} skipped
                    {result.errors.length > 0 && ` · ${result.errors.length} errors`}
                  </p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                  <p className="mb-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
                    Row errors ({result.errors.length})
                  </p>
                  <ul className="max-h-32 space-y-1 overflow-y-auto">
                    {result.errors.map((e, i) => (
                      <li key={i} className="text-xs text-amber-700 dark:text-amber-400">
                        Row {e.row}: {e.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={handleClose}
                className="w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Template download */}
              <div className="flex items-center justify-between rounded-xl border border-dashed border-gray-200 px-4 py-3 dark:border-gray-700">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">CSV Template</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Download the template with required columns</p>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
              </div>

              {/* Drop zone */}
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors ${
                  dragging
                    ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/10'
                    : file
                    ? 'border-green-300 bg-green-50 dark:bg-green-900/10'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
                {file ? (
                  <>
                    <FileText className="mb-2 h-8 w-8 text-green-500" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(file.size / 1024).toFixed(1)} KB · Click to change
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="mb-2 h-8 w-8 text-gray-400" />
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Drop your CSV here, or <span className="text-brand-500">browse</span>
                    </p>
                    <p className="mt-1 text-xs text-gray-400">CSV files up to 10 MB · max 5,000 rows</p>
                  </>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 dark:bg-red-900/20">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleClose}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={!file || loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Importing…</>
                  ) : (
                    'Import'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
