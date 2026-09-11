"use client";

import React, { useState, useEffect } from "react";
import { X, KeyRound, ExternalLink, Check, Trash2, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: (key: string) => void;
  currentKey: string;
}

export function ApiKeyModal({
  isOpen,
  onClose,
  onKeySaved,
  currentKey,
}: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState<string>("");
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(currentKey);
      setSavedSuccess(false);
    }
  }, [isOpen, currentKey]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = apiKey.trim();
    if (typeof window !== "undefined") {
      if (trimmed) {
        localStorage.setItem("nutritrack_custom_gemini_key", trimmed);
      } else {
        localStorage.removeItem("nutritrack_custom_gemini_key");
      }
    }
    onKeySaved(trimmed);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleRemoveKey = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("nutritrack_custom_gemini_key");
    }
    setApiKey("");
    onKeySaved("");
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-key-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
    >
      <div
        className="w-full max-w-md rounded-3xl bg-surface-container-lowest border border-surface-container shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-surface-container flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary-soft text-primary flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 id="api-key-modal-title" className="text-base font-bold text-app-text-main">
                Gemini API Anahtarı
              </h2>
              <p className="text-xs text-app-text-muted">Canlı Yapay Zekâ Görsel Tanıma</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-app-text-muted hover:text-app-text-main hover:bg-surface-container transition-colors"
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="gemini-api-key-input"
              className="block text-xs font-bold text-app-text-main"
            >
              Google AI Studio API Key
            </label>
            <input
              id="gemini-api-key-input"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full h-11 px-3.5 rounded-2xl bg-surface-container-low border border-surface-container text-xs font-mono text-app-text-main placeholder:text-app-text-muted/50 focus:outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <p className="text-[11px] text-app-text-muted">
              Anahtarınız yalnızca cihazınızın yerel hafızasında saklanır, üçüncü şahıslarla paylaşılmaz.
            </p>
          </div>

          {/* Quick Guide Card */}
          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-container/80 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-app-text-main flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Ücretsiz Anahtar Nasıl Alınır?
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
              >
                <span>Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-[11px] text-app-text-muted leading-relaxed">
              Google hesabınızla giriş yapıp <strong>&quot;Get API key&quot;</strong> butonuna tıklayarak
              100% ücretsiz ve anında kendi API anahtarınızı oluşturabilirsiniz.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            {currentKey && (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleRemoveKey}
                leftIcon={<Trash2 className="w-4 h-4 text-app-error" />}
                className="text-app-error border-red-200 hover:bg-red-50"
              >
                Kaldır
              </Button>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="flex-1 shadow-sm shadow-primary/20"
              leftIcon={savedSuccess ? <Check className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            >
              {savedSuccess ? "Kaydedildi!" : "Anahtarı Kaydet"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ApiKeyModal;
