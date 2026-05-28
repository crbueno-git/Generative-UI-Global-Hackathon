"use client";

import { GoogleGenAI, Modality, type FunctionCall, type LiveServerMessage } from "@google/genai";
import Link from "next/link";
import { Space_Grotesk } from "next/font/google";
import {
  ChevronRight,
  Heart,
  Mic,
  MicOff,
  Minus,
  PackageCheck,
  Plus,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Toaster, toast } from "sonner";
import {
  buildProductSearchText,
  formatBRL,
  getProductCardContent,
  getProductDetailContent,
  getInstallmentValue,
  shopBrands,
  shopCategories,
  shopProducts,
  sortOptions,
  type ShopCategoryId,
  type ShopProduct,
  type SortOptionValue,
} from "@/lib/shop/catalog";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const DEFAULT_WAKE_WORDS = ["isaac", "isac", "isaque", "izaac", "isack", "isacc"];
const DEFAULT_VOICE_CONFIG = {
  liveModel: "gemini-3.1-flash-live-preview",
  voiceName: "Puck",
  languageCode: "pt-BR",
  wakeWords: DEFAULT_WAKE_WORDS,
};

type ShopVoiceConfig = {
  liveModel: string;
  voiceName: string;
  languageCode: string;
  wakeWords: string[];
};

function reportVoiceDebug(hypothesisId: string, msg: string, data: Record<string, unknown>) {
  // #region debug-point A:client-report
  fetch("http://127.0.0.1:7777/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "voice-greeting-wakeword",
      runId: "pre-fix",
      hypothesisId,
      location: "apps/frontend/src/app/shop/page.tsx",
      msg: `[DEBUG] ${msg}`,
      data,
      ts: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

const searchProductsTool = {
  name: "searchProducts",
  description:
    "Pesquisa no catalogo da Isaac Shop por categoria, marca ou nome do produto. Use para abrir listas como celulares, tablets, smartwatches, acessorios ou marcas como Samsung e Apple.",
  parameters: {
    type: "OBJECT",
    properties: {
      query: {
        type: "STRING",
        description: "Busca curta como 'celulares samsung', 'tablets', 'acessorios Apple' ou 'Galaxy S24 FE'.",
      },
    },
    required: ["query"],
  },
};

const showProductDetailsTool = {
  name: "showProductDetails",
  description: "Abre os detalhes completos de um produto especifico pelo productId e retorna o texto integral do card e da modal.",
  parameters: {
    type: "OBJECT",
    properties: {
      productId: {
        type: "STRING",
        description: "ID do produto retornado pela busca, por exemplo 'galaxy-s24-fe-256'.",
      },
    },
    required: ["productId"],
  },
};

const getProductCardContentTool = {
  name: "getProductCardContent",
  description:
    "Retorna o conteudo textual exato do card de um produto, incluindo titulo, resumo, preco, parcelamento, entrega, estoque e texto consolidado do card.",
  parameters: {
    type: "OBJECT",
    properties: {
      productId: {
        type: "STRING",
        description: "ID do produto retornado pela busca, por exemplo 'iphone-15-pro-max-256'.",
      },
    },
    required: ["productId"],
  },
};

const closeProductDetailsTool = {
  name: "closeProductDetails",
  description: "Fecha a modal de detalhes do produto atual.",
};

const addToCartTool = {
  name: "addToCart",
  description: "Adiciona um produto ao carrinho imediatamente quando houver intencao de compra.",
  parameters: {
    type: "OBJECT",
    properties: {
      productId: {
        type: "STRING",
        description: "ID do produto que sera adicionado ao carrinho.",
      },
    },
    required: ["productId"],
  },
};

const viewCartTool = {
  name: "viewCart",
  description: "Abre o drawer de carrinho para revisao e checkout.",
};

type ChatMessage = {
  role: "user" | "model" | "system";
  text: string;
};

type CartItem = {
  product: ShopProduct;
  quantity: number;
};

type LiveSession = {
  sendClientContent: (input: { turns?: string; turnComplete?: boolean }) => void;
  sendToolResponse: (input: { functionResponses: Array<{ id?: string; name?: string; response?: Record<string, unknown> }> }) => void;
  sendRealtimeInput: (chunks: Array<{ mimeType: string; data: string }>) => void;
  close: () => void;
};

type ToolResponseItem = {
  id?: string;
  name?: string;
  response?: Record<string, unknown>;
};

type LegacyLiveServerMessage = LiveServerMessage & {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string; inlineData?: { data: string; mimeType?: string } }>;
    };
  }>;
};

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const filled = index < Math.round(rating);
        return (
          <Star
            key={index}
            className={filled ? "size-3.5 fill-[#ffcb45] text-[#ffcb45]" : "size-3.5 text-slate-300"}
          />
        );
      })}
    </div>
  );
}

function ProductVisual({ product, compact = false }: { product: ShopProduct; compact?: boolean }) {
  const heightClass = compact ? "h-16" : "h-44";
  const framePadding = compact ? "p-2" : "p-4";
  const [fromColor, toColor] = product.colors;

  return (
    <div className={`relative overflow-hidden rounded-[22px] border border-slate-200 bg-white ${heightClass} ${framePadding}`}>
      <div
        className="absolute inset-0 opacity-90"
        style={{ background: `linear-gradient(135deg, ${fromColor}, ${toColor})` }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.4),transparent_38%)]" />
      <div className="absolute left-4 top-4 rounded-full border border-white/40 bg-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80">
        {product.brand}
      </div>

      {product.visual === "phone" && (
        <>
          <div className="absolute left-1/2 top-1/2 h-[70%] w-[34%] -translate-x-[55%] -translate-y-[48%] rounded-[28px] border border-white/30 bg-black/80 shadow-2xl" />
          <div className="absolute left-1/2 top-1/2 h-[68%] w-[30%] -translate-x-[53%] -translate-y-[46%] rounded-[22px] bg-[linear-gradient(180deg,rgba(255,255,255,0.3),rgba(255,255,255,0.05))]" />
          <div className="absolute left-[58%] top-[52%] h-[62%] w-[30%] -translate-y-[45%] rotate-12 rounded-[28px] border border-white/25 bg-black/35" />
        </>
      )}

      {product.visual === "tablet" && (
        <>
          <div className="absolute left-1/2 top-1/2 h-[58%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-[26px] border border-white/25 bg-black/80 shadow-xl" />
          <div className="absolute left-1/2 top-1/2 h-[52%] w-[64%] -translate-x-1/2 -translate-y-1/2 rounded-[18px] bg-[linear-gradient(135deg,rgba(255,255,255,0.28),rgba(255,255,255,0.06))]" />
          <div className="absolute bottom-[22%] right-[18%] h-1 w-14 rotate-[335deg] rounded-full bg-slate-100/80" />
        </>
      )}

      {product.visual === "watch" && (
        <>
          <div className="absolute left-1/2 top-[14%] h-[72%] w-12 -translate-x-1/2 rounded-full bg-black/60" />
          <div className="absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-[32px] border border-white/25 bg-black/85 shadow-xl" />
          <div className="absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-[24px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.35),rgba(255,255,255,0.04))]" />
        </>
      )}

      {product.visual === "earbuds" && (
        <>
          <div className="absolute bottom-[18%] left-1/2 h-16 w-24 -translate-x-1/2 rounded-[28px] bg-white/90 shadow-xl" />
          <div className="absolute left-[34%] top-[24%] h-14 w-5 rotate-[8deg] rounded-full bg-white/95 shadow-lg" />
          <div className="absolute left-[58%] top-[24%] h-14 w-5 -rotate-[8deg] rounded-full bg-white/95 shadow-lg" />
        </>
      )}

      {product.visual === "charger" && (
        <>
          <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-[28px] bg-white/95 shadow-xl" />
          <div className="absolute left-[52%] top-[20%] h-7 w-1 rounded-full bg-slate-100" />
          <div className="absolute left-[58%] top-[20%] h-7 w-1 rounded-full bg-slate-100" />
        </>
      )}

      {product.visual === "case" && (
        <>
          <div className="absolute left-1/2 top-1/2 h-[58%] w-[52%] -translate-x-1/2 -translate-y-1/2 rounded-[30px] border border-white/25 bg-black/70 shadow-2xl" />
          <div className="absolute left-[58%] top-[34%] size-5 rounded-full border border-white/40 bg-white/10" />
          <div className="absolute left-1/2 top-[26%] size-6 -translate-x-1/2 rounded-full border-2 border-white/70" />
        </>
      )}

      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs font-semibold text-white/80">
        <span>{product.highlight}</span>
        <span>{product.inventoryLabel}</span>
      </div>
    </div>
  );
}

function VoiceOrb({
  status,
  isAssistantResponding,
  onClick,
}: {
  status: "idle" | "connecting" | "connected" | "error";
  isAssistantResponding: boolean;
  onClick: () => void;
}) {
  const isConnected = status === "connected";
  const ringClass =
    status === "error"
      ? "border-red-300 bg-red-50"
      : isConnected
        ? "border-emerald-200 bg-emerald-50"
        : "border-[#ffd7d7] bg-white";

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex flex-col items-center gap-2 text-center"
      aria-label="Alternar voz"
    >
      <span className={`relative flex size-[78px] items-center justify-center rounded-full border shadow-[0_10px_35px_rgba(248,113,113,0.18)] ${ringClass}`}>
        {(isAssistantResponding || status === "connecting") && (
          <>
            <span className="absolute inset-0 rounded-full border border-[#ff7b7b]/60 animate-ping" />
            <span className="absolute inset-[-8px] rounded-full border border-[#ffc0c0]/70 animate-pulse" />
          </>
        )}
        <span className="flex size-[58px] items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,#fff5f5,#ffd6d6_60%,#ffbcbc)] text-[#b91c1c] shadow-inner">
          {isAssistantResponding ? <Sparkles className="size-6" /> : isConnected ? <Mic className="size-6" /> : <MicOff className="size-6" />}
        </span>
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
        {isConnected ? "Voz ativa" : status === "connecting" ? "Conectando" : "Ativar voz"}
      </span>
    </button>
  );
}

async function createEphemeralToken() {
  const response = await fetch("/api/live-token", { method: "POST" });
  if (!response.ok) {
    throw new Error("Falha ao criar token efemero.");
  }
  const payload = await response.json();
  return { token: payload.token as string, model: (payload.model as string | undefined) ?? DEFAULT_VOICE_CONFIG.liveModel };
}

function ShopPageInner() {
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "system", text: "Assistente da loja pronto. Clique no orb para ativar a voz." },
  ]);
  const [streamingText, setStreamingText] = useState("");
  const [currentInput, setCurrentInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ShopCategoryId>("all");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOptionValue>("featured");
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [isAssistantResponding, setIsAssistantResponding] = useState(false);
  const [voiceConfig, setVoiceConfig] = useState<ShopVoiceConfig>(DEFAULT_VOICE_CONFIG);

  const sessionRef = useRef<LiveSession | null>(null);
  const chunkBufferRef = useRef("");
  const pendingSendRef = useRef<string | null>(null);
  const isConnectedRef = useRef(false);
  const manualCloseRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextAudioTimeRef = useRef(0);
  const recognitionRef = useRef<any>(null);
  const cartRef = useRef<CartItem[]>([]);
  const initialTurnSentRef = useRef(false);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  useEffect(() => {
    void fetch("/api/shop-voice-config")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Falha ao carregar configuracao de voz.");
        }
        const payload = (await response.json()) as Partial<ShopVoiceConfig>;
        const nextConfig: ShopVoiceConfig = {
          liveModel: payload.liveModel?.trim() || DEFAULT_VOICE_CONFIG.liveModel,
          voiceName: payload.voiceName?.trim() || DEFAULT_VOICE_CONFIG.voiceName,
          languageCode: payload.languageCode?.trim() || DEFAULT_VOICE_CONFIG.languageCode,
          wakeWords: payload.wakeWords?.length ? payload.wakeWords : DEFAULT_VOICE_CONFIG.wakeWords,
        };
        setVoiceConfig(nextConfig);
        reportVoiceDebug("A", "Loaded shop voice config from API", nextConfig);
      })
      .catch((error) => {
        reportVoiceDebug("A", "Falling back to default shop voice config", {
          error: error instanceof Error ? error.message : String(error),
          fallbackConfig: DEFAULT_VOICE_CONFIG,
        });
      });

    // #region debug-point A:bundle-values
    // #region debug-point A:bundle-values
    reportVoiceDebug("A", "Shop voice bundle initialized", {
      defaultVoiceConfig: DEFAULT_VOICE_CONFIG,
    });
    // #endregion
  }, []);

  const appendMessage = (message: ChatMessage) => {
    setMessages((previous) => [...previous, message]);
  };

  const buildSearchToolResponse = (products: ShopProduct[], query: string, scopeLabel: string) => ({
    query,
    scope: scopeLabel,
    totalResults: products.length,
    visibleCards: products.slice(0, 8).map((product) => ({
      brand: product.brand,
      category: product.category,
      ...getProductCardContent(product),
    })),
    result:
      products.length > 0
        ? `Mostrando ${products.length} produtos para ${scopeLabel}. Consulte visibleCards e use productId para pedir card completo, abrir detalhes ou adicionar ao carrinho.`
        : `Nenhum produto encontrado para ${scopeLabel}.`,
  });

  const toggleFavorite = (productId: string) => {
    setFavoriteIds((previous) => {
      const next = new Set(previous);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const flushInitialVoiceTurn = (session: LiveSession | null) => {
    if (!session || initialTurnSentRef.current) {
      return;
    }

    if (pendingSendRef.current) {
      const pendingTurn = pendingSendRef.current;
      pendingSendRef.current = null;
      initialTurnSentRef.current = true;
      session.sendClientContent({ turns: pendingTurn, turnComplete: true });
      return;
    }

    initialTurnSentRef.current = true;
    session.sendClientContent({
      turns:
        "Cumprimente o cliente com uma frase curta, amigavel e em portugues do Brasil, como 'Ola, em que posso ajudar?'. Nao liste produtos nessa primeira saudacao.",
      turnComplete: true,
    });
  };

  const addToCart = (product: ShopProduct) => {
    setCart((previous) => {
      const existingItem = previous.find((item) => item.product.id === product.id);
      if (existingItem) {
        return previous.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...previous, { product, quantity: 1 }];
    });
    toast.success(`${product.name} adicionado ao carrinho.`);
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart((previous) =>
      previous
        .map((item) =>
          item.product.id === productId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((previous) => previous.filter((item) => item.product.id !== productId));
  };

  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + item.product.priceInCents * item.quantity, 0);

  const categoryCounts = useMemo(() => {
    const counts = new Map<ShopCategoryId, number>();
    for (const category of shopCategories) {
      counts.set(category.id, 0);
    }

    for (const product of shopProducts) {
      const matchesBrands = selectedBrands.length === 0 || selectedBrands.includes(product.brand);
      const matchesSearch = searchQuery.trim().length === 0 || buildProductSearchText(product).includes(searchQuery.trim().toLowerCase());
      if (!matchesBrands || !matchesSearch) {
        continue;
      }
      counts.set("all", (counts.get("all") ?? 0) + 1);
      counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
    }

    return counts;
  }, [searchQuery, selectedBrands]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const nextProducts = shopProducts.filter((product) => {
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(product.brand);
      const matchesSearch = normalizedSearch.length === 0 || buildProductSearchText(product).includes(normalizedSearch);
      return matchesCategory && matchesBrand && matchesSearch;
    });

    switch (sortBy) {
      case "price-asc":
        return [...nextProducts].sort((left, right) => left.priceInCents - right.priceInCents);
      case "price-desc":
        return [...nextProducts].sort((left, right) => right.priceInCents - left.priceInCents);
      case "rating":
        return [...nextProducts].sort((left, right) => right.rating - left.rating || right.reviewCount - left.reviewCount);
      case "newest":
        return [...nextProducts].sort((left, right) => Number(Boolean(right.badge?.includes("Lanc"))) - Number(Boolean(left.badge?.includes("Lanc"))));
      default:
        return nextProducts;
    }
  }, [searchQuery, selectedBrands, selectedCategory, sortBy]);

  const ensureAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      nextAudioTimeRef.current = audioContextRef.current.currentTime;
    }
    if (audioContextRef.current.state === "suspended") {
      void audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  const decodeBase64ToBytes = (base64: string) => {
    const binary = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  };

  const parseSampleRate = (mimeType: string | undefined, fallback = 24000) => {
    if (!mimeType) {
      return fallback;
    }
    const match = /rate=(\d+)/i.exec(mimeType);
    return match ? Number(match[1]) : fallback;
  };

  const schedulePcmAudio = (base64: string, mimeType?: string) => {
    const audioContext = ensureAudioContext();
    const bytes = decodeBase64ToBytes(base64);
    const sampleRate = parseSampleRate(mimeType, audioContext.sampleRate);
    const sampleCount = Math.floor(bytes.length / 2);
    if (!sampleCount) {
      return;
    }

    const buffer = audioContext.createBuffer(1, sampleCount, sampleRate);
    const channel = buffer.getChannelData(0);
    for (let index = 0; index < sampleCount; index += 1) {
      const low = bytes[index * 2];
      const high = bytes[index * 2 + 1];
      let sample = (high << 8) | low;
      if (sample >= 0x8000) {
        sample -= 0x10000;
      }
      channel[index] = sample / 32768;
    }

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    const startTime = Math.max(audioContext.currentTime, nextAudioTimeRef.current);
    source.start(startTime);
    nextAudioTimeRef.current = startTime + buffer.duration;
  };

  const scheduleWavAudio = async (base64: string) => {
    const audioContext = ensureAudioContext();
    const bytes = decodeBase64ToBytes(base64);
    const buffer = await audioContext.decodeAudioData(bytes.buffer);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    const startTime = Math.max(audioContext.currentTime, nextAudioTimeRef.current);
    source.start(startTime);
    nextAudioTimeRef.current = startTime + buffer.duration;
  };

  const stopMicrophone = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setInterimText("");
  };

  const startMicrophone = () => {
    try {
      const speechRecognitionConstructor =
        (window as Window & { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any }).SpeechRecognition ||
        (window as Window & { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any }).webkitSpeechRecognition;

      if (!speechRecognitionConstructor) {
        toast.error("Reconhecimento de voz nao suportado neste navegador.");
        return;
      }

      const recognition = new speechRecognitionConstructor();
      recognition.lang = "pt-BR";
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        let currentInterim = "";

        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          if (event.results[index].isFinal) {
            finalTranscript += event.results[index][0].transcript;
          } else {
            currentInterim += event.results[index][0].transcript;
          }
        }

        const containsWakeWord = (value: string) =>
          voiceConfig.wakeWords.some((wakeWord) => value.toLowerCase().includes(wakeWord));

        // #region debug-point B:wakeword-match
        if (finalTranscript.trim() || currentInterim.trim()) {
          reportVoiceDebug("B", "Speech recognition result processed", {
            finalTranscript: finalTranscript.trim(),
            currentInterim: currentInterim.trim(),
            wakeWords: voiceConfig.wakeWords,
            finalMatched: finalTranscript.trim() ? containsWakeWord(finalTranscript) : false,
            interimMatched: currentInterim.trim() ? containsWakeWord(currentInterim) : false,
          });
        }
        // #endregion

        setInterimText(currentInterim.trim() && containsWakeWord(currentInterim) ? currentInterim.trim() : "");

        if (finalTranscript.trim() && containsWakeWord(finalTranscript)) {
          appendMessage({ role: "user", text: finalTranscript.trim() });
          if (sessionRef.current && isConnectedRef.current) {
            sessionRef.current.sendClientContent({ turns: finalTranscript.trim(), turnComplete: true });
          }
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === "no-speech" || event.error === "aborted") {
          return;
        }
        if (event.error === "not-allowed" || event.error === "audio-capture") {
          toast.error("Permissao negada. Acesse via localhost para evitar bloqueios do navegador.");
          stopMicrophone();
        }
      };

      recognition.onend = () => {
        if (isConnectedRef.current && !manualCloseRef.current) {
          try {
            recognition.start();
          } catch {}
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      toast.error("Erro ao iniciar o microfone.");
    }
  };

  const closeSession = () => {
    manualCloseRef.current = true;
    isConnectedRef.current = false;
    sessionRef.current?.close();
    sessionRef.current = null;
    chunkBufferRef.current = "";
    setStreamingText("");
    setStatus("idle");
    setIsAssistantResponding(false);
    stopMicrophone();
  };

  const applyVoiceSearch = (query: string) => {
    const normalized = query.trim().toLowerCase();
    const categoryMatch = shopCategories.find((category) => {
      if (category.id === "all") {
        return normalized === "tudo" || normalized === "todos" || normalized === "catalogo" || normalized === "geral";
      }
      return [category.id, category.label, category.shortLabel].some((value) => {
        const normalizedValue = value.toLowerCase();
        return normalized === normalizedValue || normalized.includes(normalizedValue) || normalizedValue.includes(normalized);
      });
    });

    const brandMatch = shopBrands.find((brand) => normalized.includes(brand.toLowerCase()));

    if (normalized === "tudo" || normalized === "todos" || normalized === "catalogo" || normalized === "geral") {
      setSelectedCategory("all");
      setSelectedBrands([]);
      setSearchQuery("");
      return buildSearchToolResponse(shopProducts, query, "catalogo completo");
    }

    if (categoryMatch || brandMatch) {
      const nextCategory = categoryMatch?.id ?? "all";
      const nextBrands = brandMatch ? [brandMatch] : [];
      setSelectedCategory(nextCategory);
      setSelectedBrands(nextBrands);
      setSearchQuery("");
      const scopedProducts = shopProducts.filter((product) => {
        const matchesCategory = nextCategory === "all" || product.category === nextCategory;
        const matchesBrand = nextBrands.length === 0 || nextBrands.includes(product.brand);
        return matchesCategory && matchesBrand;
      });

      const scopeLabel = [categoryMatch?.label, brandMatch].filter(Boolean).join(" / ");
      return buildSearchToolResponse(scopedProducts, query, scopeLabel || query);
    }

    setSelectedCategory("all");
    setSelectedBrands([]);
    setSearchQuery(query);
    const matches = shopProducts.filter((product) => buildProductSearchText(product).includes(normalized));
    return buildSearchToolResponse(matches, query, `busca textual: ${query}`);
  };

  const handleToolCalls = (functionCalls: FunctionCall[]) => {
    const responses: ToolResponseItem[] = [];

    for (const call of functionCalls) {
      if (call.name === "showProductDetails") {
        const productId = String(call.args?.productId ?? "");
        const product = shopProducts.find((item) => item.id === productId);
        if (!product) {
          responses.push({ id: call.id, name: call.name, response: { result: "Produto nao encontrado. Use searchProducts antes de tentar abrir detalhes." } });
          continue;
        }
        setSelectedProduct(product);
        responses.push({
          id: call.id,
          name: call.name,
          response: {
            productId: product.id,
            modalOpened: true,
            content: getProductDetailContent(product),
            result: `Modal aberta para ${product.name}. Use apenas os campos de content para responder ao usuario.`,
          },
        });
        continue;
      }

      if (call.name === "getProductCardContent") {
        const productId = String(call.args?.productId ?? "");
        const product = shopProducts.find((item) => item.id === productId);
        if (!product) {
          responses.push({
            id: call.id,
            name: call.name,
            response: { result: "Produto nao encontrado. Use um productId valido retornado por searchProducts." },
          });
          continue;
        }
        responses.push({
          id: call.id,
          name: call.name,
          response: {
            productId: product.id,
            content: getProductCardContent(product),
            result: `Conteudo textual do card de ${product.name} retornado com sucesso.`,
          },
        });
        continue;
      }

      if (call.name === "closeProductDetails") {
        setSelectedProduct(null);
        responses.push({ id: call.id, name: call.name, response: { result: "Modal de produto fechada. O usuario voltou para a vitrine." } });
        continue;
      }

      if (call.name === "addToCart") {
        const productId = String(call.args?.productId ?? "");
        const product = shopProducts.find((item) => item.id === productId);
        if (!product) {
          responses.push({ id: call.id, name: call.name, response: { result: "Nao encontrei o produto para adicionar ao carrinho." } });
          continue;
        }
        addToCart(product);
        setIsCartOpen(true);
        responses.push({
          id: call.id,
          name: call.name,
          response: {
            productId: product.id,
            cartOpened: true,
            content: getProductCardContent(product),
            result: `${product.name} foi adicionado ao carrinho. O carrinho foi aberto para o usuario revisar.`,
          },
        });
        continue;
      }

      if (call.name === "viewCart") {
        if (cartRef.current.length === 0) {
          responses.push({ id: call.id, name: call.name, response: { result: "O carrinho esta vazio no momento." } });
          continue;
        }
        setIsCartOpen(true);
        responses.push({
          id: call.id,
          name: call.name,
          response: {
            cartOpened: true,
            totalItems: cartRef.current.reduce((total, item) => total + item.quantity, 0),
            totalPriceText: formatBRL(
              cartRef.current.reduce((total, item) => total + item.product.priceInCents * item.quantity, 0),
            ),
            items: cartRef.current.map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
              card: getProductCardContent(item.product),
            })),
            result: `Carrinho aberto com ${cartRef.current.length} itens diferentes.`,
          },
        });
        continue;
      }

      if (call.name === "searchProducts") {
        const query = String(call.args?.query ?? "");
        responses.push({ id: call.id, name: call.name, response: { result: applyVoiceSearch(query) } });
      }
    }

    if (responses.length > 0) {
      sessionRef.current?.sendToolResponse({ functionResponses: responses });
    }
  };

  const connect = async () => {
    if (status === "connecting" || status === "connected") {
      return;
    }

    setStatus("connecting");
    setStreamingText("");
    setInterimText("");
    setIsAssistantResponding(false);
    chunkBufferRef.current = "";
    manualCloseRef.current = false;
    isConnectedRef.current = false;
    initialTurnSentRef.current = false;
    ensureAudioContext();

    try {
      const { token, model } = await createEphemeralToken();
      // #region debug-point C:connect-config
      reportVoiceDebug("C", "Connecting Gemini Live session", {
        responseModel: model,
        liveVoiceName: voiceConfig.voiceName,
        liveLanguageCode: voiceConfig.languageCode,
        pendingSend: pendingSendRef.current,
      });
      // #endregion
      const ai = new GoogleGenAI({ apiKey: token, httpOptions: { apiVersion: "v1alpha" } });

      const session = await ai.live.connect({
        model,
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          speechConfig: {
            languageCode: voiceConfig.languageCode,
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voiceConfig.voiceName,
              },
            },
          },
          systemInstruction: {
            role: "system",
            parts: [
              {
                text:
                  "Voce e o assistente de vendas da Isaac Shop. Nunca invente produto, preco, descricao, parcelamento, entrega ou especificacao. Antes de responder com qualquer dado factual do catalogo, consulte uma tool. Use searchProducts para listar resultados, getProductCardContent para ler o texto exato do card e showProductDetails para ler a descricao completa e a modal. Se a informacao nao vier de uma tool, diga que nao encontrou. Se quiser comprar, use addToCart. Para ver o carrinho, use viewCart. Seja curto, comercial e fiel ao conteudo retornado pelas tools.",
              },
            ],
          },
          tools: [
            {
              functionDeclarations: [
                searchProductsTool as any,
                getProductCardContentTool as any,
                showProductDetailsTool as any,
                closeProductDetailsTool as any,
                addToCartTool as any,
                viewCartTool as any,
              ],
            },
          ],
        },
        callbacks: {
          onopen: () => {
            isConnectedRef.current = true;
            setStatus("connected");
            appendMessage({ role: "system", text: "Orb conectado. Pode falar com a loja." });
            startMicrophone();
            // #region debug-point D:onopen
            reportVoiceDebug("D", "Gemini Live session opened", {
              pendingSend: pendingSendRef.current,
              wakeWords: voiceConfig.wakeWords,
            });
            // #endregion
          },
          onmessage: (message: LiveServerMessage) => {
            if (message.toolCall?.functionCalls?.length) {
              handleToolCalls(message.toolCall.functionCalls);
            }

            const legacyCandidates = (message as LegacyLiveServerMessage).candidates;
            const parts = message.serverContent?.modelTurn?.parts ?? legacyCandidates?.[0]?.content?.parts ?? [];
            const text = parts.map((part) => ("text" in part ? part.text : "")).filter(Boolean).join("");
            const audioParts = parts
              .map((part) => ("inlineData" in part ? part.inlineData : null))
              .filter((part): part is { data: string; mimeType?: string } => Boolean(part?.data));
            const transcript = message.serverContent?.outputTranscription?.text ?? "";
            const transcriptFinished = message.serverContent?.outputTranscription?.finished ?? false;

            // #region debug-point E:first-response
            if (text || transcript || audioParts.length > 0 || message.serverContent?.turnComplete) {
              reportVoiceDebug("E", "Received Gemini Live server message", {
                textLength: text.length,
                transcript,
                transcriptFinished,
                audioPartsCount: audioParts.length,
                turnComplete: message.serverContent?.turnComplete ?? false,
              });
            }
            // #endregion

            if (text || transcript || audioParts.length > 0) {
              setIsAssistantResponding(true);
            }

            audioParts.forEach((audioPart) => {
              if (audioPart.mimeType?.includes("audio/wav")) {
                void scheduleWavAudio(audioPart.data);
              } else if (audioPart.mimeType?.includes("audio")) {
                schedulePcmAudio(audioPart.data, audioPart.mimeType);
              }
            });

            if (text) {
              chunkBufferRef.current += text;
              setStreamingText(chunkBufferRef.current);
            } else if (transcript) {
              chunkBufferRef.current = transcript;
              setStreamingText(transcript);
            }

            if (message.serverContent?.turnComplete || transcriptFinished) {
              if (chunkBufferRef.current.trim()) {
                appendMessage({ role: "model", text: chunkBufferRef.current.trim() });
              }
              chunkBufferRef.current = "";
              setStreamingText("");
              setIsAssistantResponding(false);
            }
          },
          onerror: (error) => {
            isConnectedRef.current = false;
            setStatus("error");
            setIsAssistantResponding(false);
            stopMicrophone();
            toast.error(error instanceof Error ? error.message : "Falha na conexao com a voz.");
          },
          onclose: () => {
            sessionRef.current = null;
            isConnectedRef.current = false;
            stopMicrophone();
            setIsAssistantResponding(false);
            if (manualCloseRef.current) {
              manualCloseRef.current = false;
              setStatus("idle");
              return;
            }
            setStatus("error");
            toast.error("Conexao de voz encerrada pelo servidor.");
          },
        },
      });

      sessionRef.current = session as LiveSession;
      // #region debug-point D:post-connect-flush
      reportVoiceDebug("D", "Flushing initial turn after session assignment", {
        hasPendingSend: Boolean(pendingSendRef.current),
        wakeWords: voiceConfig.wakeWords,
      });
      // #endregion
      flushInitialVoiceTurn(sessionRef.current);
    } catch (error) {
      isConnectedRef.current = false;
      setStatus("error");
      setIsAssistantResponding(false);
      toast.error(error instanceof Error ? error.message : "Falha ao conectar o orb.");
    }
  };

  const toggleVoice = () => {
    if (status === "connected" || status === "connecting") {
      closeSession();
      return;
    }
    void connect();
  };

  const sendText = (event: FormEvent) => {
    event.preventDefault();
    const text = currentInput.trim();
    if (!text) {
      return;
    }

    appendMessage({ role: "user", text });
    setCurrentInput("");
    setStreamingText("");
    chunkBufferRef.current = "";
    ensureAudioContext();

    if (!sessionRef.current) {
      pendingSendRef.current = text;
      void connect();
      return;
    }

    sessionRef.current.sendClientContent({ turns: text, turnComplete: true });
  };

  const selectedCategoryLabel = shopCategories.find((category) => category.id === selectedCategory)?.shortLabel ?? "Tudo";
  const favoritesCount = favoriteIds.size;
  const topBrandsLabel = selectedBrands.length > 0 ? selectedBrands.join(", ") : "Todas as marcas";

  return (
    <div className={`${spaceGrotesk.className} min-h-screen bg-[#f4f5f7] text-slate-900`}>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1180px] items-center gap-4 px-4 py-4 lg:gap-6">
          <Link href="/" className="flex min-w-[120px] items-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-[#ffd6d6] bg-[radial-gradient(circle_at_top,#fff8f8,#ffe9e9_60%,#fff)] text-[#c11a1a] shadow-[0_12px_28px_rgba(248,113,113,0.16)]">
              <Sparkles className="size-6" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight text-[#c11a1a]">Isaac Shop</div>
              <div className="text-[10px] font-medium uppercase tracking-[0.24em] text-slate-400">Smart devices</div>
            </div>
          </Link>

          <label className="hidden flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm md:flex">
            <Search className="size-4 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setSelectedCategory("all");
              }}
              placeholder="O que voce esta procurando?"
              className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
            />
          </label>

          <div className="hidden shrink-0 items-center gap-3 lg:flex">
            <VoiceOrb status={status} isAssistantResponding={isAssistantResponding} onClick={toggleVoice} />
            <button
              type="button"
              onClick={() => setIsDebugModalOpen(true)}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
            >
              Troubleshoot
            </button>
          </div>

          <div className="ml-auto flex items-center gap-2 lg:gap-3">
            <button
              type="button"
              onClick={() => toast.message("Area de conta em construcao.")}
              className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 md:flex"
            >
              <UserRound className="size-4" />
              Minha Conta
            </button>
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <ShoppingCart className="size-4" />
              Carrinho
              {cartItemsCount > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-[#ff2b2b] text-[10px] font-bold text-white">
                  {cartItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="border-t border-slate-100 bg-white px-4 py-3 md:hidden">
          <div className="mx-auto flex max-w-[1180px] items-center gap-3">
            <label className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
              <Search className="size-4 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setSelectedCategory("all");
                }}
                placeholder="O que voce esta procurando?"
                className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>
            <VoiceOrb status={status} isAssistantResponding={isAssistantResponding} onClick={toggleVoice} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-4 py-8">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
          <Link href="/" className="transition hover:text-slate-700">
            Home
          </Link>
          <ChevronRight className="size-4" />
          <span className="text-slate-700">{selectedCategoryLabel}</span>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="space-y-4 self-start lg:sticky lg:top-28">
            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold tracking-tight">Categorias</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                {shopCategories.map((category) => {
                  const isActive = selectedCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition ${
                        isActive ? "bg-[#fff1f1] font-semibold text-[#d31212]" : "hover:bg-slate-50"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`size-2 rounded-full ${isActive ? "bg-[#ff2b2b]" : "bg-slate-300"}`} />
                        {category.label}
                      </span>
                      <span className="text-xs text-slate-400">{categoryCounts.get(category.id) ?? 0}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold tracking-tight">Marcas</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                {shopBrands.map((brand) => {
                  const checked = selectedBrands.includes(brand);
                  return (
                    <label key={brand} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setSelectedBrands((previous) =>
                            previous.includes(brand) ? previous.filter((item) => item !== brand) : [...previous, brand],
                          );
                        }}
                        className="size-4 rounded border-slate-300 text-[#ff2b2b] focus:ring-[#ffb2b2]"
                      />
                      <span className="flex-1">{brand}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold tracking-tight">Compra segura</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
                  <Truck className="mt-0.5 size-4 text-[#ff2b2b]" />
                  <div>
                    <div className="font-semibold text-slate-800">Frete rapido</div>
                    <div>Entrega expressa e retirada em loja para itens selecionados.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
                  <ShieldCheck className="mt-0.5 size-4 text-[#ff2b2b]" />
                  <div>
                    <div className="font-semibold text-slate-800">Compra protegida</div>
                    <div>Pagamento seguro, garantia oficial e nota fiscal.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
                  <PackageCheck className="mt-0.5 size-4 text-[#ff2b2b]" />
                  <div>
                    <div className="font-semibold text-slate-800">Top filtros atuais</div>
                    <div>{topBrandsLabel}</div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <section>
            <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-lg font-semibold text-slate-800">{filteredProducts.length} produtos encontrados</div>
                  <div className="mt-1 text-sm text-slate-500">Layout inspirado na vitrine da referencia, com filtros, grade densa e foco em conversao.</div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-full bg-[#fff1f1] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#d31212]">
                    Pix com desconto
                  </div>
                  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-500">
                    <span>Ordenar por:</span>
                    <select
                      value={sortBy}
                      onChange={(event) => setSortBy(event.target.value as SortOptionValue)}
                      className="bg-transparent font-semibold text-slate-700 outline-none"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {filteredProducts.map((product) => {
                const cardContent = getProductCardContent(product);
                const isFavorite = favoriteIds.has(product.id);
                return (
                  <article
                    key={product.id}
                    className="group rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(15,23,42,0.10)]"
                  >
                    <div className="relative">
                      {product.badge && (
                        <span className="absolute left-3 top-3 z-10 rounded-lg bg-[#ff2b2b] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white shadow">
                          {product.badge}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleFavorite(product.id)}
                        className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-slate-400 shadow-sm transition hover:text-[#ff2b2b]"
                        aria-label="Favoritar produto"
                      >
                        <Heart className={isFavorite ? "size-4 fill-[#ff2b2b] text-[#ff2b2b]" : "size-4"} />
                      </button>
                      <ProductVisual product={product} />
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                      <RatingStars rating={product.rating} />
                      <span>({product.reviewCount})</span>
                    </div>

                    <div className="mt-3 min-h-[72px]">
                      <h3 className="line-clamp-2 text-[17px] font-semibold leading-6 tracking-tight text-slate-900">{product.name}</h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-500">{product.summary}</p>
                    </div>

                    <div className="mt-4 space-y-1.5">
                      {cardContent.originalPriceText && (
                        <div className="text-sm text-slate-400 line-through">{cardContent.originalPriceText}</div>
                      )}
                      <div className="text-[15px] font-medium text-slate-500">{cardContent.pixText}</div>
                      <div className="text-[clamp(1.9rem,2.2vw,2.35rem)] font-bold leading-none tracking-[-0.04em] text-[#0ea84d]">
                        {cardContent.priceText}
                      </div>
                      <div className="text-sm text-slate-500">{cardContent.installmentText}</div>
                    </div>

                    <div className="mt-4 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{cardContent.shippingText}</span>
                      <span className="mx-2 text-slate-300">|</span>
                      {cardContent.inventoryText}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedProduct(product)}
                        className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        Ver detalhes
                      </button>
                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        className="flex-1 rounded-2xl bg-[#ff2b2b] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(255,43,43,0.25)] transition hover:bg-[#eb1c1c]"
                      >
                        Comprar
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {filteredProducts.length === 0 && (
              <div className="mt-4 rounded-[28px] border-2 border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
                <div className="text-lg font-semibold text-slate-800">Nenhum produto encontrado</div>
                <p className="mt-2 text-sm text-slate-500">Tente remover filtros, trocar a marca selecionada ou fazer uma busca diferente.</p>
              </div>
            )}
          </section>
        </div>
      </main>

      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.2)] md:p-8">
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="absolute right-5 top-5 rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-slate-900"
            >
              <X className="size-4" />
            </button>

            <div className="grid gap-6 md:grid-cols-[1.1fr_minmax(0,1fr)]">
              <div>
                <ProductVisual product={selectedProduct} />
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">
                    <div className="font-semibold text-slate-800">Marca</div>
                    <div className="mt-1">{selectedProduct.brand}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">
                    <div className="font-semibold text-slate-800">Entrega</div>
                    <div className="mt-1">{selectedProduct.shipping}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">
                    <div className="font-semibold text-slate-800">Estoque</div>
                    <div className="mt-1">{selectedProduct.inventoryLabel}</div>
                  </div>
                </div>
              </div>

              <div>
                {selectedProduct.badge && (
                  <span className="inline-flex rounded-lg bg-[#ff2b2b] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                    {selectedProduct.badge}
                  </span>
                )}
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{selectedProduct.name}</h2>
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                  <RatingStars rating={selectedProduct.rating} />
                  <span>{selectedProduct.rating.toFixed(1)} de 5</span>
                  <span className="text-slate-300">|</span>
                  <span>{selectedProduct.reviewCount} avaliacoes</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">{selectedProduct.description}</p>

                <div className="mt-5 rounded-[24px] bg-slate-50 p-4">
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Destaques</div>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    {selectedProduct.specs.map((specification) => (
                      <li key={specification} className="flex items-start gap-2">
                        <span className="mt-1.5 size-1.5 rounded-full bg-[#ff2b2b]" />
                        <span>{specification}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 border-t border-slate-200 pt-6">
                  {selectedProduct.originalPriceInCents && (
                    <div className="text-sm text-slate-400 line-through">{formatBRL(selectedProduct.originalPriceInCents)}</div>
                  )}
                  <div className="text-[42px] font-bold leading-none tracking-tight text-[#0ea84d]">{formatBRL(selectedProduct.priceInCents)}</div>
                  <div className="mt-2 text-sm text-slate-500">
                    ou {selectedProduct.installmentCount}x de {formatBRL(getInstallmentValue(selectedProduct.priceInCents, selectedProduct.installmentCount))}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      addToCart(selectedProduct);
                      setIsCartOpen(true);
                    }}
                    className="rounded-2xl bg-[#ff2b2b] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(255,43,43,0.25)] transition hover:bg-[#eb1c1c]"
                  >
                    Adicionar ao carrinho
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(selectedProduct.id)}
                    className="rounded-2xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    {favoriteIds.has(selectedProduct.id) ? "Remover dos favoritos" : "Salvar nos favoritos"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/25 backdrop-blur-sm">
          <div className="relative flex h-full w-full max-w-[420px] flex-col border-l border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <div className="text-xl font-semibold tracking-tight text-slate-900">Seu carrinho</div>
                <div className="mt-1 text-sm text-slate-500">{cartItemsCount} itens adicionados</div>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:text-slate-900"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/70 px-6 py-5">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white px-6 text-center">
                  <ShoppingCart className="size-10 text-slate-300" />
                  <div className="mt-4 text-lg font-semibold text-slate-800">Carrinho vazio</div>
                  <p className="mt-2 text-sm text-slate-500">Adicione produtos da vitrine para continuar.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex gap-3">
                      <div className="w-24 shrink-0">
                        <ProductVisual product={item.product} compact />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-slate-900">{item.product.name}</div>
                        <div className="mt-1 text-xs text-slate-500">{item.product.brand}</div>
                        <div className="mt-3 text-sm font-semibold text-[#0ea84d]">{formatBRL(item.product.priceInCents)}</div>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2 rounded-full border border-slate-200 px-2 py-1">
                            <button type="button" onClick={() => updateCartQuantity(item.product.id, -1)} className="rounded-full p-1 text-slate-500 hover:bg-slate-100">
                              <Minus className="size-3.5" />
                            </button>
                            <span className="min-w-6 text-center text-sm font-semibold text-slate-700">{item.quantity}</span>
                            <button type="button" onClick={() => updateCartQuantity(item.product.id, 1)} className="rounded-full p-1 text-slate-500 hover:bg-slate-100">
                              <Plus className="size-3.5" />
                            </button>
                          </div>
                          <button type="button" onClick={() => removeFromCart(item.product.id)} className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d31212]">
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-slate-200 bg-white px-6 py-5">
              <div className="rounded-[24px] bg-slate-50 p-4">
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Subtotal</span>
                  <span>{formatBRL(cartTotal)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-slate-500">
                  <span>Frete</span>
                  <span className="font-semibold text-emerald-600">Gratis</span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 text-lg font-semibold text-slate-900">
                  <span>Total</span>
                  <span>{formatBRL(cartTotal)}</span>
                </div>
              </div>
              <button
                type="button"
                disabled={cart.length === 0}
                onClick={() => {
                  toast.success("Checkout iniciado. Fluxo de pagamento em demonstracao.");
                }}
                className="mt-4 w-full rounded-2xl bg-[#ff2b2b] px-4 py-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(255,43,43,0.25)] transition hover:bg-[#eb1c1c] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Finalizar compra
              </button>
            </div>
          </div>
        </div>
      )}

      {isDebugModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/30 p-4 pt-24 backdrop-blur-sm">
          <div className="w-full max-w-[420px] rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Troubleshoot</div>
                <div className="mt-1 text-lg font-semibold tracking-tight text-slate-900">Console de voz</div>
              </div>
              <button
                type="button"
                onClick={() => setIsDebugModalOpen(false)}
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:text-slate-900"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="px-5 py-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <span className="rounded-full bg-slate-100 px-3 py-1">status: {status}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1">orb: {isAssistantResponding ? "respondendo" : "pronto"}</span>
              </div>

              <div className="mt-4 max-h-[360px] space-y-3 overflow-y-auto rounded-[24px] bg-slate-50 p-4">
                {messages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}>
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{message.role}</span>
                    <div
                      className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-6 shadow-sm ${
                        message.role === "user"
                          ? "rounded-br-sm bg-slate-900 text-white"
                          : message.role === "model"
                            ? "rounded-bl-sm border border-slate-200 bg-white text-slate-700"
                            : "rounded-bl-sm border border-emerald-100 bg-emerald-50 text-emerald-800"
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}

                {interimText && (
                  <div className="flex flex-col items-end">
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">voce</span>
                    <div className="max-w-[88%] rounded-2xl rounded-br-sm border border-slate-200 bg-white px-3 py-2 text-sm italic text-slate-500">
                      {interimText}
                    </div>
                  </div>
                )}

                {streamingText && (
                  <div className="flex flex-col items-start">
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">modelo</span>
                    <div className="max-w-[88%] rounded-2xl rounded-bl-sm border border-[#ffdada] bg-[#fff5f5] px-3 py-2 text-sm text-slate-700">
                      {streamingText}
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={sendText} className="mt-4 flex gap-2">
                <input
                  value={currentInput}
                  onChange={(event) => setCurrentInput(event.target.value)}
                  placeholder="Enviar texto para debug..."
                  className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-300"
                />
                <button
                  type="submit"
                  className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Enviar
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <Toaster position="bottom-right" />
    </div>
  );
}

export default function ShopPage() {
  return <ShopPageInner />;
}
