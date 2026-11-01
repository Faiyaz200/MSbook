import React, { useState } from 'react';
import {
  FileCode,
  Download,
  Copy,
  Check,
  FolderTree,
  X,
  Layers,
  Terminal,
  ExternalLink,
} from 'lucide-react';
import JSZip from 'jszip';
import { ANDROID_FILES, AndroidFile } from '../data/androidFilesData';

interface CodeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeViewerModal: React.FC<CodeViewerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedFile, setSelectedFile] = useState<AndroidFile>(ANDROID_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsExporting(true);
    try {
      const zip = new JSZip();

      // Add all files
      ANDROID_FILES.forEach((f) => {
        // Strip leading "android/" if present for neat project root
        const relativePath = f.path.startsWith('android/')
          ? f.path.replace('android/', '')
          : f.path;
        zip.file(relativePath, f.content);
      });

      // Add gradlew stub and readme
      zip.file(
        'README.md',
        `# MSbook Native Android Project (Stage 1)
Open this folder directly in Android Studio Ladybug/Koala.
Run:
./gradlew assembleDebug
`
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'MSbook-Android-Stage1.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error generating zip', e);
    } finally {
      setIsExporting(false);
    }
  };

  const categories = [
    'ALL',
    'Configuration',
    'Database & Storage',
    'Domain & Repository',
    'UI & Screens',
    'Navigation & Theme',
  ];

  const filteredFiles =
    filterCategory === 'ALL'
      ? ANDROID_FILES
      : ANDROID_FILES.filter((f) => f.category === filterCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl w-full max-w-5xl h-[88vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-[#0F4D32] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-200">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                MSbook — Native Android Project Explorer
              </h2>
              <p className="text-xs text-emerald-100">
                Kotlin • Jetpack Compose • Material 3 • Room Database • DataStore
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownloadZip}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-[#0F4D32] hover:bg-emerald-50 active:scale-95 shadow-sm transition-all flex items-center space-x-2"
              title="Download Android Studio Project as .ZIP"
            >
              {isExporting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#0F4D32] border-t-transparent rounded-full animate-spin" />
                  <span>Packaging ZIP...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Android Project (.zip)</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center space-x-2 overflow-x-auto shrink-0">
          <span className="text-xs font-semibold text-slate-500 mr-1">Filter:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterCategory === cat
                  ? 'bg-[#0F4D32] text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Content Body: Sidebar + Code Pane */}
        <div className="flex-1 flex overflow-hidden">
          {/* File Sidebar */}
          <div className="w-72 bg-slate-50/80 border-r border-slate-200 overflow-y-auto p-3 space-y-1 shrink-0">
            {filteredFiles.map((f) => {
              const isSelected = f.path === selectedFile.path;
              const fileName = f.path.split('/').pop() || f.path;
              return (
                <button
                  key={f.path}
                  onClick={() => setSelectedFile(f)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start space-x-2.5 ${
                    isSelected
                      ? 'bg-white text-[#0F4D32] shadow-xs border border-slate-200 font-semibold'
                      : 'text-slate-700 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <FileCode
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      isSelected ? 'text-[#0F4D32]' : 'text-slate-400'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-mono truncate">{fileName}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {f.category}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Code Viewer Pane */}
          <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden text-slate-100">
            {/* Code Bar */}
            <div className="px-5 py-3 bg-slate-800/90 border-b border-slate-700/60 flex items-center justify-between shrink-0">
              <div className="min-w-0 pr-4">
                <span className="font-mono text-xs text-emerald-400 font-semibold">
                  {selectedFile.path}
                </span>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {selectedFile.description}
                </p>
              </div>

              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center space-x-1.5 transition-colors border border-slate-600 shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy File</span>
                  </>
                )}
              </button>
            </div>

            {/* Code Content */}
            <div className="flex-1 overflow-auto p-5 font-mono text-xs leading-relaxed text-slate-200 select-text">
              <pre className="whitespace-pre">{selectedFile.content}</pre>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            Target: Android 8.0+ (API 26 to 35) • Room v2.6.1 • Jetpack Compose 2024.11
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-300 font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
