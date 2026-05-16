"use client";

import { Space_Grotesk } from "next/font/google";
import { GoogleGenAI, Modality, type FunctionCall, type LiveServerMessage } from "@google/genai";
import * as import_react from "react";
const { FormEvent, useRef, useState } = import_react;
import { CopilotChatConfigurationProvider } from "@copilotkit/react-core/v2";
import { Toaster, toast } from "sonner";
import Link from "next/link";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const LIVE_MODEL = "gemini-3.1-flash-live-preview";

type ChatMessage = {
  role: "user" | "model" | "system";
  text: string;
};

type LiveSession = {
  sendClientContent: (input: { turns?: string; turnComplete?: boolean }) => void;
  sendToolResponse: (input: { functionResponses: Array<{ id?: string; name?: string; response?: Record<string, unknown> }> }) => void;
  sendRealtimeInput: (chunks: Array<{ mimeType: string; data: string }>) => void;
  close: () => void;
};

// Dados do Catálogo da Loja
const categories = [
  { id: "todos", label: "Tudo" },
  { id: "celulares", label: "Celulares" },
  { id: "acessorios", label: "Acessórios" },
  { id: "audio", label: "Áudio" },
  { id: "smart", label: "Casa Smart" },
  { id: "ofertas", label: "Ofertas" },
];

type Product = {
  id: string;
  name: string;
  category: string;
  price: string;
  priceNote: string;
  tag?: string;
  description: string;
  tone: "lime" | "sun" | "sky" | "grape";
  specs?: string[];
};

const products: Product[] = [
  { id: "p-01", name: "Nebula One 5G", category: "celulares", price: "R$ 2.799", priceNote: "ou 12x de R$ 233,25", tag: "Mais vendido", description: "Tela 120Hz, camera tripla e bateria 5.000mAh.", tone: "sun", specs: ["Tela OLED 6.7\" 120Hz", "Processador Octa-Core 3.2GHz", "Câmera Tripla 108MP + 12MP + 8MP", "Bateria 5.000mAh com Carga 65W"] },
  { id: "p-02", name: "Aura Pro Max", category: "celulares", price: "R$ 4.599", priceNote: "ou 12x de R$ 383,25", tag: "Premium", description: "Chip topo de linha e acabamento em vidro fosco.", tone: "grape", specs: ["Tela AMOLED 6.9\" LTPO", "Chip A-Series Ultra Fast", "Construção em Titânio e Vidro", "Câmera Periscópio Zoom 10x"] },
  { id: "p-03", name: "Pulse Buds", category: "audio", price: "R$ 499", priceNote: "ou 6x de R$ 83,17", tag: "Novo", description: "Cancelamento de ruido e 28h de bateria.", tone: "sky", specs: ["Cancelamento Ativo de Ruído (ANC)", "Bluetooth 5.3 Baixa Latência", "28 horas de bateria com estojo", "Resistência à água IPX4"] },
  { id: "p-04", name: "Halo Watch", category: "smart", price: "R$ 899", priceNote: "ou 10x de R$ 89,90", description: "Saude, treinos e notificacoes em tempo real.", tone: "lime", specs: ["Tela Retina Always-On", "Monitoramento de ECG e Oxigênio", "GPS Integrado", "Até 14 dias de bateria"] },
  { id: "p-05", name: "Vibe Speaker", category: "audio", price: "R$ 699", priceNote: "ou 10x de R$ 69,90", tag: "Som 360", description: "Potencia de 40W e resistencia a agua.", tone: "sun", specs: ["Som estéreo 360º de 40W", "Graves profundos com radiador", "Certificação IP67 (Água/Poeira)", "Bateria para 20 horas de festa"] },
  { id: "p-06", name: "Pixel Grip Case", category: "acessorios", price: "R$ 129", priceNote: "ou 3x de R$ 43,00", description: "Case fosca com borda anti-impacto.", tone: "sky", specs: ["Material de Silicone Premium", "Bordas elevadas para câmera", "Proteção militar contra quedas", "Suporte a carregamento magnético"] },
  { id: "p-07", name: "Sonic Charger 65W", category: "acessorios", price: "R$ 189", priceNote: "ou 4x de R$ 47,25", tag: "Carga turbo", description: "Carregamento rapido com 2 portas USB-C.", tone: "lime", specs: ["Tecnologia GaN (Nitrito de Gálio)", "Duas portas USB-C PD 3.0", "Carrega notebook e celular juntos", "Proteção térmica avançada"] },
  { id: "p-08", name: "Lumen Bar", category: "smart", price: "R$ 349", priceNote: "ou 6x de R$ 58,17", tag: "Ambiente", description: "Luz inteligente com 16M de cores.", tone: "sun", specs: ["RGB com 16 Milhões de Cores", "Sincronização com música/TV", "Compatível com Alexa e Google", "Fácil instalação na parede"] },
  { id: "p-09", name: "Nova X Lite", category: "ofertas", price: "R$ 1.699", priceNote: "ou 12x de R$ 141,58", tag: "Oferta", description: "Versao leve com desempenho equilibrado.", tone: "grape", specs: ["Tela IPS LCD 90Hz", "Processador eficiente 6nm", "Câmera principal 50MP", "Bateria de longa duração"] },
  { id: "p-10", name: "Echo Dock", category: "ofertas", price: "R$ 219", priceNote: "ou 5x de R$ 43,80", tag: "Combo", description: "Base 3-em-1 para recarga e som.", tone: "sky", specs: ["Carrega celular, relógio e fones", "Caixa de som Bluetooth embutida", "Design em alumínio escovado", "Luz noturna ajustável"] },
];

const toneStyles: Record<Product["tone"], { halo: string; chip: string }> = {
  lime: { halo: "bg-lime-200/80", chip: "border-lime-200 text-lime-800" },
  sun: { halo: "bg-amber-200/80", chip: "border-amber-200 text-amber-800" },
  sky: { halo: "bg-sky-200/80", chip: "border-sky-200 text-sky-800" },
  grape: { halo: "bg-fuchsia-200/80", chip: "border-fuchsia-200 text-fuchsia-800" },
};

const getCategoryLabel = (id: string) => categories.find((c) => c.id === id)?.label ?? "Tudo";

async function createEphemeralToken() {
  const response = await fetch("/api/live-token", { method: "POST" });
  if (!response.ok) throw new Error("Falha ao criar token efêmero.");
  const payload = await response.json();
  return { token: payload.token, model: payload.model ?? LIVE_MODEL };
}

const searchProductsTool = {
  name: "searchProducts",
  description: "Pesquisa no catálogo da Loja Isaac Sales. O usuário não vê o que vc pesquisa, apenas o resultado na tela. Pesquise por categoria ou nome.",
  parameters: {
    type: "OBJECT",
    properties: {
      query: {
        type: "STRING",
        description: "Termo de busca curto, ex: 'celulares', 'audio', 'ofertas', ou 'Aura Pro Max'.",
      },
    },
    required: ["query"],
  },
};

const showProductDetailsTool = {
  name: "showProductDetails",
  description: "Abre o modal de detalhes (pop-up) de um produto específico para o usuário ver mais informações. Use quando o usuário pedir detalhes, preço, especificações ou quiser comprar/ver um produto específico.",
  parameters: {
    type: "OBJECT",
    properties: {
      productId: {
        type: "STRING",
        description: "O ID do produto (ex: 'p-01', 'p-02'). Este ID é retornado pela função searchProducts.",
      },
    },
    required: ["productId"],
  },
};

const closeProductDetailsTool = {
  name: "closeProductDetails",
  description: "Fecha o modal de detalhes do produto, voltando para a lista principal. Use quando o usuário pedir para voltar, fechar, cancelar ou sair do produto atual.",
};

const addToCartTool = {
  name: "addToCart",
  description: "Adiciona um produto diretamente ao carrinho de compras. Use esta ferramenta IMEDIATAMENTE quando o usuário disser que quer comprar, levar ou adicionar um produto ao carrinho.",
  parameters: {
    type: "OBJECT",
    properties: {
      productId: {
        type: "STRING",
        description: "O ID do produto (ex: 'p-01', 'p-02').",
      },
    },
    required: ["productId"],
  },
};

const viewCartTool = {
  name: "viewCart",
  description: "Abre e visualiza o carrinho de compras do usuário. Use esta ferramenta quando o usuário pedir para ver o carrinho, perguntar o que tem no carrinho ou quiser ir para o checkout/finalizar compra.",
};

function ShopPageInner() {
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [highlightBanana, setHighlightBanana] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "system", text: "Assistente de Loja pronto. Clique em Conectar para iniciar o Gemini Live." },
  ]);
  const [streamingText, setStreamingText] = useState("");
  const [currentInput, setCurrentInput] = useState("");
  
  // Estado da Loja
  const [selectedCategory, setSelectedCategory] = useState<string>("todos");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchStreaming, setSearchStreaming] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Carrinho
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const cartRef = useRef(cart);
  
  // Sincroniza o ref do carrinho para ser lido no callback do websocket
  import_react.useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  const sessionRef = useRef<LiveSession | null>(null);
  const chunkBufferRef = useRef("");
  const pendingSendRef = useRef<string | null>(null);
  const isConnectedRef = useRef(false);
  const manualCloseRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextAudioTimeRef = useRef(0);
  const searchStreamTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Microfone (Speech Recognition)
  const recognitionRef = useRef<any>(null);
  const [interimText, setInterimText] = useState("");
  const [isMicMuted, setIsMicMuted] = useState(true);

  const appendMessage = (message: ChatMessage) => setMessages((prev) => [...prev, message]);

  const closeSession = () => {
    manualCloseRef.current = true;
    isConnectedRef.current = false;
    sessionRef.current?.close();
    sessionRef.current = null;
    chunkBufferRef.current = "";
    setStreamingText("");
    setStatus("idle");
    stopMicrophone();
    if (searchStreamTimerRef.current) {
      clearInterval(searchStreamTimerRef.current);
      searchStreamTimerRef.current = null;
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
    setSelectedProduct(null);
    toast.success(`${product.name} adicionado ao carrinho!`);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const cartTotal = cart.reduce((acc, item) => {
    const priceStr = item.product.price.replace(/[^\d]/g, '');
    return acc + (parseInt(priceStr, 10) * item.quantity);
  }, 0);

  const formatPrice = (value: number) => `R$ ${value.toLocaleString('pt-BR')}`;

  const startSearchStreaming = (value: string) => {
    if (searchStreamTimerRef.current) {
      clearInterval(searchStreamTimerRef.current);
    }
    setSearchQuery("");
    setSearchStreaming(true);

    let index = 0;
    searchStreamTimerRef.current = setInterval(() => {
      if (index <= value.length) {
        setSearchQuery(value.slice(0, index));
        index++;
      } else {
        if (searchStreamTimerRef.current) clearInterval(searchStreamTimerRef.current);
        setSearchStreaming(false);
      }
    }, 50); // 50ms per character
  };

  const runSearchProductsTool = (query: string) => {
    const normalized = query.trim().toLowerCase();
    const isAll = normalized === "tudo" || normalized === "todos" || normalized === "todos os produtos" || normalized === "geral";
    
    // Busca flexível de categoria (singular/plural e label)
    const matchedCategory = categories.find(c => {
      const id = c.id;
      const label = c.label.toLowerCase();
      return id === normalized || 
             normalized.includes(id) || 
             (normalized.length >= 4 && id.includes(normalized)) ||
             label === normalized || 
             normalized.includes(label) ||
             (normalized.length >= 4 && label.includes(normalized));
    });
    
    let matchedProducts = [];
    
    if (isAll || (matchedCategory && matchedCategory.id === "todos")) {
      return `Exibindo todos os ${products.length} produtos disponíveis do catálogo. Produtos: ${products.map(p => `${p.name} (ID: ${p.id})`).join(', ')}`;
    }
    
    if (matchedCategory) {
      matchedProducts = products.filter(p => p.category === matchedCategory.id);
      return `Exibindo ${matchedProducts.length} produtos da categoria ${matchedCategory.label}. ${matchedProducts.length === 0 ? "Avise que não tem nenhum disponível." : `Produtos disponíveis na tela: ${matchedProducts.map(p => `${p.name} (ID: ${p.id})`).join(', ')}`}`;
    }

    matchedProducts = products.filter((p) => 
      p.name.toLowerCase().includes(normalized) || p.description.toLowerCase().includes(normalized)
    );
    
    return `Exibindo ${matchedProducts.length} resultados para '${normalized}'. ${matchedProducts.length === 0 ? "Avise que não encontrou nada com esse termo." : `Produtos disponíveis na tela: ${matchedProducts.map(p => `${p.name} (ID: ${p.id})`).join(', ')}`}`;
  };

  const handleToolCalls = (functionCalls: FunctionCall[]) => {
    const responses = functionCalls.flatMap((call) => {
      if (call.name === "showProductDetails") {
        const pId = String(call.args?.productId ?? "");
        const prod = products.find(p => p.id === pId);
        if (prod) {
          setSelectedProduct(prod);
          toast.success(`Abrindo detalhes de: ${prod.name}`);
          return [{ id: call.id, name: call.name, response: { result: `Modal aberto para o produto ${prod.name}. Descreva-o brevemente e pergunte se quer comprar.` } }];
        }
        return [{ id: call.id, name: call.name, response: { result: "Erro: Produto não encontrado ou você usou um ID inválido. Se não sabe o ID, faça um searchProducts antes." } }];
      } else if (call.name === "closeProductDetails") {
        setSelectedProduct(null);
        return [{ id: call.id, name: call.name, response: { result: "Modal fechado. O usuário agora vê a lista de produtos." } }];
      } else if (call.name === "addToCart") {
        const pId = String(call.args?.productId ?? "");
        const prod = products.find(p => p.id === pId);
        if (prod) {
          addToCart(prod);
          return [{ id: call.id, name: call.name, response: { result: `Produto ${prod.name} adicionado ao carrinho com sucesso! Diga que foi adicionado e pergunte se quer ver mais alguma coisa ou finalizar a compra.` } }];
        }
        return [{ id: call.id, name: call.name, response: { result: "Erro: Produto não encontrado para adicionar ao carrinho." } }];
      } else if (call.name === "viewCart") {
        const currentCart = cartRef.current;
        if (currentCart.length === 0) {
          return [{ id: call.id, name: call.name, response: { result: "O carrinho está vazio no momento. Avise o usuário que não tem nada no carrinho." } }];
        }
        setIsCartOpen(true);
        const itemsInfo = currentCart.map(item => `${item.quantity}x ${item.product.name}`).join(", ");
        return [{ id: call.id, name: call.name, response: { result: `O carrinho foi aberto. Itens no carrinho: ${itemsInfo}. Total de itens diferentes: ${currentCart.length}. Avise o usuário o que tem no carrinho.` } }];
      }
      
      if (call.name !== "searchProducts") return [];
      
      // Fecha o popup se o usuário fizer uma nova busca
      setSelectedProduct(null);
      
      const query = String(call.args?.query ?? "");
      const normalized = query.trim().toLowerCase();
      const isAll = normalized === "tudo" || normalized === "todos" || normalized === "todos os produtos" || normalized === "geral";
      
      const matchedCategory = categories.find(c => {
        const id = c.id;
        const label = c.label.toLowerCase();
        return id === normalized || 
               normalized.includes(id) || 
               (normalized.length >= 4 && id.includes(normalized)) ||
               label === normalized || 
               normalized.includes(label) ||
               (normalized.length >= 4 && label.includes(normalized));
      });
      
      if (isAll || (matchedCategory && matchedCategory.id === "todos")) {
        toast.success("Exibindo todos os produtos");
        setSelectedCategory("todos");
        setSearchQuery("");
        if (searchStreamTimerRef.current) clearInterval(searchStreamTimerRef.current);
        setSearchStreaming(false);
      } else if (matchedCategory) {
        toast.success(`Categoria aberta: ${matchedCategory.label}`);
        setSelectedCategory(matchedCategory.id);
        setSearchQuery("");
        if (searchStreamTimerRef.current) clearInterval(searchStreamTimerRef.current);
        setSearchStreaming(false);
      } else {
        toast.success(`Gemini buscou por: ${query}`);
        startSearchStreaming(query);
        setSelectedCategory("todos");
      }

      const output = runSearchProductsTool(query);
      return [
        {
          id: call.id,
          name: call.name,
          response: { result: output },
        },
      ];
    });

    if (!responses.length) return;
    sessionRef.current?.sendToolResponse({ functionResponses: responses });
  };

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
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  };

  const startMicrophone = () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        toast.error("Reconhecimento de voz não suportado neste navegador.");
        return;
      }
      
      const recognition = new SpeechRecognition();
      recognition.lang = "pt-BR";
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onstart = () => {
        setIsMicMuted(false);
        console.log("[Microfone] Reconhecimento iniciado.");
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        let currentInterim = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }

        // Wake Word Logic
        const wakeWords = ["isaac", "isac", "isaque", "izaac", "isack", "isacc"];
        const checkWakeWord = (text: string) => {
          const clean = text.toLowerCase();
          return wakeWords.some(w => clean.includes(w));
        };

        if (currentInterim.trim()) {
          if (checkWakeWord(currentInterim)) {
            setInterimText(currentInterim);
          } else {
            setInterimText("");
          }
        } else {
          setInterimText("");
        }

        if (finalTranscript.trim()) {
           if (checkWakeWord(finalTranscript)) {
             appendMessage({ role: "user", text: finalTranscript.trim() });
             if (sessionRef.current && isConnectedRef.current) {
               sessionRef.current.sendClientContent({ turns: finalTranscript.trim(), turnComplete: true });
             }
           } else {
             console.log("[Wake Word] Ignorado (não falou o nome):", finalTranscript);
           }
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === "no-speech" || event.error === "aborted") {
          return;
        }
        console.error("Erro no reconhecimento de voz:", event.error);
        if (event.error === "not-allowed" || event.error === "audio-capture") {
          toast.error("Permissão negada. Acesse via localhost para evitar bloqueios do navegador.");
          stopMicrophone();
        }
      };

      recognition.onend = () => {
        if (isConnectedRef.current && !manualCloseRef.current) {
          try {
            recognition.start();
          } catch (e) {}
        } else {
          setIsMicMuted(true);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();

    } catch (err) {
      toast.error("Erro ao iniciar o microfone.");
      console.error(err);
    }
  };

  const stopMicrophone = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsMicMuted(true);
    setInterimText("");
  };

  const parseSampleRate = (mimeType: string | undefined, fallback = 24000) => {
    if (!mimeType) return fallback;
    const match = /rate=(\d+)/i.exec(mimeType);
    return match ? Number(match[1]) : fallback;
  };

  const schedulePcmAudio = (base64: string, mimeType?: string) => {
    const audioContext = ensureAudioContext();
    const bytes = decodeBase64ToBytes(base64);
    const sampleRate = parseSampleRate(mimeType, audioContext.sampleRate);
    const sampleCount = Math.floor(bytes.length / 2);
    if (!sampleCount) return;

    const buffer = audioContext.createBuffer(1, sampleCount, sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i += 1) {
      const low = bytes[i * 2];
      const high = bytes[i * 2 + 1];
      let sample = (high << 8) | low;
      if (sample >= 0x8000) sample -= 0x10000;
      channel[i] = sample / 32768;
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

  const connect = async () => {
    if (status === "connecting" || status === "connected") return;

    setStatus("connecting");
    setStreamingText("");
    chunkBufferRef.current = "";
    manualCloseRef.current = false;
    isConnectedRef.current = false;
    ensureAudioContext();

    try {
      const { token, model } = await createEphemeralToken();
      const ai = new GoogleGenAI({ apiKey: token, httpOptions: { apiVersion: "v1alpha" } });

      const session = await ai.live.connect({
        model,
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          systemInstruction: {
            role: "system",
            parts: [
              {
                text: "Você é um simpático assistente de vendas da Loja Isaac Sales. REGRAS CRÍTICAS: 1. NUNCA invente produtos, nomes, preços ou especificações. 2. Fale APENAS sobre o que a função searchProducts retornar. Se o usuário perguntar sobre algo que não está no retorno da tool, diga claramente que a loja não possui. 3. Ao perceber intenção de busca, use searchProducts. 4. Se o usuário quiser detalhes de um produto listado, use showProductDetails. 5. Para voltar ou sair, use closeProductDetails. 6. Se o usuário quiser comprar ou adicionar ao carrinho, use addToCart passando o productId. 7. Se o usuário pedir para ver o carrinho, use viewCart.",
              },
            ],
          },
          tools: [{ functionDeclarations: [searchProductsTool as any, showProductDetailsTool as any, closeProductDetailsTool as any, addToCartTool as any, viewCartTool as any] }],
        },
        callbacks: {
          onopen: () => {
            isConnectedRef.current = true;
            setStatus("connected");
            appendMessage({ role: "system", text: "Conectado ao Gemini Live. Pode falar!" });
            startMicrophone();
            if (pendingSendRef.current) {
              sessionRef.current?.sendClientContent({ turns: pendingSendRef.current, turnComplete: true });
              pendingSendRef.current = null;
            }
          },
          onmessage: (message: LiveServerMessage) => {
            if (message.toolCall?.functionCalls?.length) handleToolCalls(message.toolCall.functionCalls);

            const parts = message?.serverContent?.modelTurn?.parts ?? message?.candidates?.[0]?.content?.parts ?? [];
            const text = parts.map((part) => ("text" in part ? part.text : "")).filter(Boolean).join("");
            const audioParts = parts.map((part) => ("inlineData" in part ? part.inlineData : null)).filter((part): part is { data: string; mimeType?: string } => Boolean(part?.data));
            const transcript = message?.serverContent?.outputTranscription?.text ?? "";
            const transcriptFinished = message?.serverContent?.outputTranscription?.finished ?? false;

            const combinedText = `${text} ${transcript}`.toLowerCase();
            if (combinedText.includes("banana")) setHighlightBanana(true);

            audioParts.forEach((audioPart) => {
              if (audioPart.mimeType?.includes("audio/wav")) void scheduleWavAudio(audioPart.data);
              else if (audioPart.mimeType?.includes("audio")) schedulePcmAudio(audioPart.data, audioPart.mimeType);
            });

            if (text) { chunkBufferRef.current += text; setStreamingText(chunkBufferRef.current); }
            else if (transcript) { chunkBufferRef.current = transcript; setStreamingText(transcript); }

            if (message?.serverContent?.turnComplete || transcriptFinished) {
              if (chunkBufferRef.current.trim()) appendMessage({ role: "model", text: chunkBufferRef.current.trim() });
              chunkBufferRef.current = "";
              setStreamingText("");
            }
          },
          onerror: (error) => {
            isConnectedRef.current = false;
            setStatus("error");
            stopMicrophone();
            toast.error(error instanceof Error ? error.message : "Falha na conexão.");
          },
          onclose: () => {
            sessionRef.current = null;
            isConnectedRef.current = false;
            stopMicrophone();
            if (manualCloseRef.current) { manualCloseRef.current = false; setStatus("idle"); return; }
            setStatus("error");
            toast.error("Conexão encerrada pelo servidor.");
          },
        },
      });

      sessionRef.current = session as LiveSession;
    } catch (error) {
      isConnectedRef.current = false;
      setStatus("error");
      toast.error(error instanceof Error ? error.message : "Falha ao conectar.");
    }
  };

  const sendText = (event: FormEvent) => {
    event.preventDefault();
    const text = currentInput.trim();
    if (!text) return;
    appendMessage({ role: "user", text });
    setCurrentInput("");
    setStreamingText("");
    chunkBufferRef.current = "";
    ensureAudioContext();
    if (!sessionRef.current) { pendingSendRef.current = text; connect(); return; }
    sessionRef.current.sendClientContent({ turns: text, turnComplete: true });
  };

  // Filtragem local
  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== "todos" && p.category !== selectedCategory) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery) && !p.description.toLowerCase().includes(searchQuery)) return false;
    return true;
  });

  return (
    <div className={`flex h-screen w-full transition-colors duration-1000 ${highlightBanana ? "bg-[#fff1a8]" : "bg-[#f7f7f5]"} ${spaceGrotesk.className} overflow-hidden`}>
      
      {/* Área Principal (UI da Loja) */}
      <main className="flex-1 overflow-y-auto px-4 pb-12 pt-6 text-slate-900 md:px-8">
        <div className="mx-auto w-full max-w-5xl">
          <header className="rounded-[28px] border border-slate-200 bg-white px-6 py-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] relative">
            <div className="absolute -top-3 -left-3">
              <Link href="/leads" className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                ← Voltar para CRM
              </Link>
            </div>
            
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between mt-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-400 text-lg font-semibold text-slate-900 shadow-sm">
                  IS
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">Loja Isaac Sales</h1>
                  <p className="text-sm text-slate-500 mt-1">Tecnologia com entrega rápida e pagamento flexível</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsCartOpen(true)}
                  className="relative rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-800 transition hover:bg-slate-50 shadow-sm"
                >
                  Carrinho
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow-sm">
                      {cart.reduce((acc, item) => acc + item.quantity, 0)}
                    </span>
                  )}
                </button>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 hidden sm:block">
                  {getCategoryLabel(selectedCategory)}
                </div>
                {status !== "connected" && status !== "connecting" && (
                  <button onClick={connect} className="rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-slate-800 transition shadow-md">
                    Conectar Voz
                  </button>
                )}
                {status === "connected" && (
                   <button onClick={closeSession} className="rounded-full border border-red-200 bg-red-50 text-red-600 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-red-100 transition shadow-sm">
                     Desconectar
                   </button>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex-1">
                <input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedCategory("todos");
                  }}
                  placeholder="Busque por produtos ou diga algo como 'Quero ver celulares'"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm text-slate-800 outline-none ring-slate-200 transition-all focus:border-slate-400 focus:ring-4 disabled:opacity-70 disabled:bg-slate-50 shadow-sm"
                  disabled={searchStreaming}
                />
              </div>
              <div className="flex gap-2">
                <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500 shadow-sm">Frete em 24h</div>
                <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500 shadow-sm">Pix com 5% off</div>
              </div>
            </div>
          </header>

          <section className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Categorias</h2>
              <span className="text-xs font-medium text-slate-500 bg-slate-200/50 px-2.5 py-1 rounded-full">{filteredProducts.length} itens</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const isActive = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => { setSelectedCategory(category.id); setSearchQuery(""); }}
                    className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-slate-900 text-white shadow-md scale-105"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900"
                    }`}
                  >
                    {category.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-12">
            {filteredProducts.map((product) => {
              const tones = toneStyles[product.tone];
              return (
                <article key={product.id} className="group rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
                  <div className="relative overflow-hidden rounded-[18px] border border-slate-100 bg-slate-50 p-4">
                    <div className={`absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl transition-opacity group-hover:opacity-100 opacity-70 ${tones.halo}`} />
                    <div className={`absolute -left-12 bottom-0 h-24 w-24 rounded-full blur-2xl transition-opacity group-hover:opacity-100 opacity-70 ${tones.halo}`} />
                    <div className="relative flex h-32 items-center justify-center text-sm font-semibold text-slate-500">
                      Preview
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between">
                    <h3 className="text-lg font-semibold tracking-tight text-slate-900">{product.name}</h3>
                    {product.tag ? (
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap ${tones.chip}`}>
                        {product.tag}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed line-clamp-2 min-h-[2.5rem]">{product.description}</p>
                  <div className="mt-5">
                    <div className="text-xl font-bold tracking-tight text-slate-900">{product.price}</div>
                    <div className="text-xs font-medium text-slate-400 mt-0.5">{product.priceNote}</div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setSelectedProduct(product)}
                    className="mt-6 w-full rounded-full bg-slate-900 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-slate-800 transition shadow-md"
                  >
                    Comprar
                  </button>
                </article>
              );
            })}
            
            {filteredProducts.length === 0 && (
               <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-[28px] bg-slate-50/50">
                  <p className="text-slate-500 font-medium">Nenhum produto encontrado para "{searchQuery}".</p>
               </div>
            )}
          </section>
        </div>
      </main>

      {/* Modal do Produto Expandido */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop (Fundo Borrado) */}
          <div 
            className="absolute inset-0 bg-white/40 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
            onClick={() => setSelectedProduct(null)}
          />
          
          {/* Card Expandido */}
          <div className="relative w-full max-w-md bg-white rounded-[32px] p-8 shadow-[0_40px_80px_rgba(15,23,42,0.15)] animate-in zoom-in-95 fade-in duration-300">
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-6 right-6 flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition"
            >
              ✕
            </button>
            
            <div className="relative overflow-hidden rounded-[24px] border border-slate-100 bg-slate-50 p-6 mb-8 flex items-center justify-center h-48">
              <div className={`absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl opacity-80 ${toneStyles[selectedProduct.tone].halo}`} />
              <div className={`absolute -left-12 bottom-0 h-32 w-32 rounded-full blur-3xl opacity-80 ${toneStyles[selectedProduct.tone].halo}`} />
              <div className="relative text-lg font-bold text-slate-500 tracking-widest uppercase">
                {selectedProduct.name}
              </div>
            </div>
            
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">{selectedProduct.name}</h2>
                <p className="text-sm font-medium text-slate-400 mt-1 uppercase tracking-widest">{categories.find(c => c.id === selectedProduct.category)?.label}</p>
              </div>
              {selectedProduct.tag && (
                <span className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap ${toneStyles[selectedProduct.tone].chip}`}>
                  {selectedProduct.tag}
                </span>
              )}
            </div>
            
            <p className="mt-5 text-slate-600 leading-relaxed text-sm">
              {selectedProduct.description}
            </p>
            
            {selectedProduct.specs && (
              <div className="mt-5 bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Especificações Técnicas</h3>
                <ul className="space-y-2">
                  {selectedProduct.specs.map((spec, i) => (
                    <li key={i} className="flex items-center text-sm text-slate-600">
                      <span className="mr-2 text-emerald-500">•</span>
                      {spec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold tracking-tight text-slate-900">{selectedProduct.price}</div>
                <div className="text-xs font-medium text-slate-400 mt-1">{selectedProduct.priceNote}</div>
              </div>
              <button 
                onClick={() => addToCart(selectedProduct)}
                className="rounded-full bg-slate-900 px-8 py-3.5 text-sm font-bold uppercase tracking-[0.2em] text-white hover:bg-slate-800 transition shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              >
                Finalizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer do Carrinho */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Seu Carrinho</h2>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
                  <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">🛒</div>
                  <p>Seu carrinho está vazio.</p>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="mt-6 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    Continuar comprando
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                      <div className={`size-16 rounded-xl flex items-center justify-center overflow-hidden relative shrink-0`}>
                        <div className={`absolute inset-0 opacity-20 ${toneStyles[item.product.tone].halo}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 truncate">{item.product.name}</h3>
                        <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">{item.product.price}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-xs font-medium text-slate-400">QTD: {item.quantity}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-slate-400 hover:text-red-500 transition self-start p-1"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-slate-100 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-slate-500">Total</span>
                  <span className="text-2xl font-bold text-slate-900">{formatPrice(cartTotal)}</span>
                </div>
                <button 
                  onClick={() => {
                    toast.success("Compra finalizada com sucesso!");
                    setCart([]);
                    setIsCartOpen(false);
                  }}
                  className="w-full rounded-full bg-emerald-600 px-4 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white hover:bg-emerald-700 transition shadow-lg hover:shadow-xl"
                >
                  Confirmar Compra
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Barra Lateral do Chat (Transcrição) */}
      <aside className="w-[360px] h-full border-l border-slate-200 bg-white flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.03)] z-20">
        <div className="p-5 border-b border-slate-100 bg-white flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900 text-sm uppercase tracking-widest">Live Chat</h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[11px] text-slate-500 font-medium tracking-wide">{status}</p>
              {!isMicMuted && status === "connected" && (
                <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Ouvindo</span>
                </div>
              )}
            </div>
          </div>
          {status === "connecting" && <div className="size-2 rounded-full bg-amber-400 animate-pulse" />}
          {status === "connected" && <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />}
          {status === "error" && <div className="size-2 rounded-full bg-red-500" />}
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50">
          {messages.map((m, i) => (
             <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1">{m.role}</span>
               <div className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed max-w-[85%] shadow-sm ${
                 m.role === 'user' 
                   ? 'bg-slate-900 text-white rounded-br-sm' 
                   : m.role === 'model'
                     ? 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm'
                     : 'bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-bl-sm font-medium'
               }`}>
                 {m.text}
               </div>
             </div>
          ))}

          {interimText && (
             <div className="flex flex-col items-end">
               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 mr-1">você (falando...)</span>
               <div className="px-4 py-3 rounded-2xl text-[13px] leading-relaxed max-w-[85%] bg-slate-100 border border-slate-200 text-slate-500 rounded-br-sm shadow-sm italic animate-pulse">
                 {interimText}
               </div>
             </div>
          )}

          {streamingText && (
             <div className="flex flex-col items-start">
               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1">model (digitando...)</span>
               <div className="px-4 py-3 rounded-2xl text-[13px] leading-relaxed max-w-[85%] bg-white/70 border border-slate-200 text-slate-700 rounded-bl-sm shadow-sm animate-pulse">
                 {streamingText}
               </div>
             </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-slate-100">
          <form onSubmit={sendText} className="flex gap-2">
            <input
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 px-4 py-2.5 rounded-full border border-slate-200 bg-slate-50 text-sm font-medium outline-none focus:border-slate-400 focus:bg-white focus:shadow-sm transition-all text-slate-800"
              disabled={status === "connecting"}
            />
            <button
              type="submit"
              disabled={!currentInput.trim()}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-full p-2 w-11 h-11 flex items-center justify-center transition shadow-md disabled:opacity-50"
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.20308 1.04312C1.00481 0.954998 0.772341 1.0048 0.627577 1.16641C0.482813 1.32802 0.458794 1.56455 0.568117 1.75196L3.92115 7.50002L0.568117 13.2481C0.458794 13.4355 0.482813 13.672 0.627577 13.8336C0.772341 13.9952 1.00481 14.045 1.20308 13.9569L14.5364 8.02358C14.7176 7.94301 14.8333 7.73243 14.8333 7.50002C14.8333 7.26761 14.7176 7.05703 14.5364 6.97646L1.20308 1.04312ZM4.8465 7.00002L2.57013 3.10091L12.5674 7.50002L2.57013 11.8991L4.8465 8.00002H9.00002C9.27616 8.00002 9.50002 7.77616 9.50002 7.50002C9.50002 7.22388 9.27616 7.00002 9.00002 7.00002H4.8465Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
            </button>
          </form>
        </div>
      </aside>

      <Toaster position="bottom-right" />
    </div>
  );
}

export default function ShopPage() {
  return (
    <CopilotChatConfigurationProvider agentId="mock-agent-for-shop">
      <ShopPageInner />
    </CopilotChatConfigurationProvider>
  );
}
