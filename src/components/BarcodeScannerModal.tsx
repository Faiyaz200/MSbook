import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  Barcode as BarcodeIcon,
  Search,
  AlertTriangle,
  CheckCircle2,
  Package,
  Plus,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Product } from '../types';
import { db } from '../services/db';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  onProductScanned: (product: Product) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  businessId,
  onProductScanned,
}) => {
  const [cameraState, setCameraState] = useState<'idle' | 'requesting' | 'active' | 'denied' | 'error'>('idle');
  const [cameraErrorMessage, setCameraErrorMessage] = useState<string | null>(null);
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [searchedBarcode, setSearchedBarcode] = useState<string | null>(null);
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [notFoundBarcode, setNotFoundBarcode] = useState<string | null>(null);
  const [availableProductsWithBarcode, setAvailableProductsWithBarcode] = useState<Product[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load catalog products with barcodes for quick testing
  useEffect(() => {
    if (isOpen) {
      const prods = db.getProducts(businessId).filter((p) => p.barcode && p.barcode.trim().length > 0);
      setAvailableProductsWithBarcode(prods);
      setBarcodeInput('');
      setSearchedBarcode(null);
      setFoundProduct(null);
      setNotFoundBarcode(null);
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, businessId]);

  const startCamera = async () => {
    setCameraState('requesting');
    setCameraErrorMessage(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState('denied');
      setCameraErrorMessage('Camera API is not supported in this browser or environment.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraState('active');
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraState('denied');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraErrorMessage('Camera permission was denied. You can manually enter or search by barcode below.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraErrorMessage('No camera device detected on this system.');
      } else {
        setCameraErrorMessage('Camera could not be started in this frame. Use manual barcode search below.');
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraState('idle');
  };

  const handleLookup = (codeToLookup?: string) => {
    const code = (codeToLookup !== undefined ? codeToLookup : barcodeInput).trim();
    if (!code) return;

    setSearchedBarcode(code);
    const prod = db.getProductByBarcode(businessId, code);

    if (prod) {
      setFoundProduct(prod);
      setNotFoundBarcode(null);
    } else {
      setFoundProduct(null);
      setNotFoundBarcode(code);
    }
  };

  const handleSelectFound = () => {
    if (foundProduct) {
      onProductScanned(foundProduct);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-[#0F4D32] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <BarcodeIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight text-white">Barcode Scanner</h3>
              <p className="text-[10px] text-emerald-200/80">Scan or lookup products in inventory</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Camera Viewport / Status */}
          <div className="relative w-full aspect-16/10 rounded-2xl bg-slate-950 overflow-hidden flex flex-col items-center justify-center border border-slate-800 shadow-inner">
            {cameraState === 'active' ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Aiming Reticle Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-28 border-2 border-emerald-400/80 rounded-xl relative shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    {/* Corner accents */}
                    <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-emerald-300" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-emerald-300" />
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-emerald-300" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-emerald-300" />

                    {/* Laser scanning animation bar */}
                    <div className="w-full h-0.5 bg-red-500 shadow-[0_0_8px_red] animate-pulse my-auto absolute top-1/2 -translate-y-1/2" />
                  </div>
                </div>
                <div className="absolute bottom-2 inset-x-0 text-center">
                  <span className="px-3 py-1 rounded-full bg-black/60 text-white text-[10px] font-medium backdrop-blur-xs">
                    Align barcode within reticle
                  </span>
                </div>
              </>
            ) : cameraState === 'requesting' ? (
              <div className="flex flex-col items-center justify-center space-y-2 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                <span className="text-xs">Requesting camera permissions...</span>
              </div>
            ) : (
              <div className="p-4 text-center max-w-xs space-y-2">
                <Camera className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs font-semibold text-slate-300">Camera Inactive</p>
                <p className="text-[11px] text-slate-400 leading-tight">
                  {cameraErrorMessage || 'Camera access is unavailable. Please use manual barcode entry below.'}
                </p>
                <button
                  onClick={startCamera}
                  className="px-3 py-1 text-[11px] font-semibold rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900 transition-colors"
                >
                  Retry Camera
                </button>
              </div>
            )}
          </div>

          {/* Manual Barcode Search & Entry */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Enter Barcode Number
            </label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <BarcodeIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleLookup();
                    }
                  }}
                  placeholder="e.g. 890123456789"
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F4D32]"
                />
              </div>
              <button
                onClick={() => handleLookup()}
                className="px-4 py-2 bg-[#0F4D32] hover:bg-[#0B3B26] text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors shadow-xs shrink-0 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </button>
            </div>
          </div>

          {/* Result: Unknown Barcode Warning Banner */}
          {notFoundBarcode && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start space-x-2.5 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold">Unknown Barcode</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Barcode <span className="font-mono font-bold">"{notFoundBarcode}"</span> not found in catalog. Please check barcode or add product in Inventory.
                </p>
              </div>
            </div>
          )}

          {/* Result: Product Found Card */}
          {foundProduct && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-slate-900 space-y-3 shadow-xs">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{foundProduct.name}</h4>
                    <p className="text-[11px] text-slate-600 font-mono">Barcode: {foundProduct.barcode}</p>
                  </div>
                </div>
                <span className="text-base font-bold text-[#0F4D32]">
                  ₹{foundProduct.sellingPrice}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-emerald-200">
                <span>Unit: <strong className="text-slate-800">{foundProduct.unit}</strong></span>
                <span>In Stock: <strong className="text-slate-800">{foundProduct.stockQuantity}</strong></span>
                <span>Purchase Cost: ₹{foundProduct.purchaseCost}</span>
              </div>

              <button
                onClick={handleSelectFound}
                className="w-full py-2.5 rounded-xl bg-[#0F4D32] hover:bg-[#0B3B26] text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product to Sales Bill</span>
              </button>
            </div>
          )}

          {/* Registered Barcodes Quick Testing List */}
          {availableProductsWithBarcode.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center">
                  <Package className="w-3.5 h-3.5 mr-1 text-[#0F4D32]" />
                  Registered Barcodes ({availableProductsWithBarcode.length})
                </span>
                <span className="text-[10px] text-slate-400">Tap to test scan</span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {availableProductsWithBarcode.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setBarcodeInput(p.barcode || '');
                      handleLookup(p.barcode || '');
                    }}
                    className="w-full text-left p-2 rounded-xl bg-[#F2F8F4] hover:bg-emerald-100 border border-[#0F4D32]/10 flex items-center justify-between text-xs transition-colors cursor-pointer"
                  >
                    <div className="truncate mr-2">
                      <span className="font-semibold text-slate-800 block truncate">{p.name}</span>
                      <span className="font-mono text-[10px] text-slate-500">{p.barcode}</span>
                    </div>
                    <span className="font-bold text-[#0F4D32] shrink-0">₹{p.sellingPrice}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center">
            <Info className="w-3.5 h-3.5 mr-1 text-slate-400" />
            Barcode lookups query Room DB directly
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
