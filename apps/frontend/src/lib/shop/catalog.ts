export type ShopCategoryId =
  | "all"
  | "smartphones"
  | "tablets"
  | "smartwatches"
  | "accessories";

export type ProductVisual =
  | "phone"
  | "tablet"
  | "watch"
  | "earbuds"
  | "charger"
  | "case";

export type ShopCategory = {
  id: ShopCategoryId;
  label: string;
  shortLabel: string;
};

export type ShopProduct = {
  id: string;
  name: string;
  brand: string;
  category: ShopCategoryId;
  priceInCents: number;
  originalPriceInCents?: number;
  installmentCount: number;
  pixDiscountLabel: string;
  rating: number;
  reviewCount: number;
  badge?: string;
  description: string;
  summary: string;
  specs: string[];
  visual: ProductVisual;
  colors: [string, string];
  highlight: string;
  shipping: string;
  inventoryLabel: string;
  searchTerms: string[];
};

export type ShopProductCardContent = {
  productId: string;
  badge?: string;
  title: string;
  summary: string;
  ratingText: string;
  originalPriceText?: string;
  pixText: string;
  priceText: string;
  installmentText: string;
  shippingText: string;
  inventoryText: string;
  cardText: string;
};

export type ShopProductDetailContent = ShopProductCardContent & {
  description: string;
  specs: string[];
  detailText: string;
};

export const shopCategories: ShopCategory[] = [
  { id: "all", label: "Tudo", shortLabel: "Tudo" },
  { id: "smartphones", label: "Celulares e Smartphones", shortLabel: "Celulares" },
  { id: "tablets", label: "Tablets", shortLabel: "Tablets" },
  { id: "smartwatches", label: "Smartwatches", shortLabel: "Smartwatches" },
  { id: "accessories", label: "Acessorios", shortLabel: "Acessorios" },
];

// Catalog normalized for demo usage from current public product lines by
// Samsung, Apple, Motorola, Lenovo, Xiaomi and Anker.
export const shopProducts: ShopProduct[] = [
  {
    id: "galaxy-s24-fe-256",
    name: "Samsung Galaxy S24 FE 256GB",
    brand: "Samsung",
    category: "smartphones",
    priceInCents: 299900,
    originalPriceInCents: 359900,
    installmentCount: 10,
    pixDiscountLabel: "a vista no Pix",
    rating: 4.8,
    reviewCount: 156,
    badge: "Oferta",
    description: "Tela AMOLED de 120Hz, Galaxy AI e cameras versateis para fotos e video em qualquer hora.",
    summary: "Intermediario premium com Galaxy AI, tela fluida e autonomia para o dia inteiro.",
    specs: ["Tela 6.7\" Dynamic AMOLED 2X 120Hz", "128GB/256GB com Galaxy AI", "Camera tripla com Nightography", "Resistencia IP68"],
    visual: "phone",
    colors: ["#1f2937", "#6b7280"],
    highlight: "Galaxy AI e Nightography",
    shipping: "Entrega em 24h",
    inventoryLabel: "Pronta entrega",
    searchTerms: ["samsung", "galaxy", "s24", "fe", "ia", "celular"],
  },
  {
    id: "iphone-15-pro-max-256",
    name: "Apple iPhone 15 Pro Max 256GB",
    brand: "Apple",
    category: "smartphones",
    priceInCents: 854905,
    originalPriceInCents: 899900,
    installmentCount: 12,
    pixDiscountLabel: "a vista no Pix",
    rating: 4.9,
    reviewCount: 342,
    badge: "Premium",
    description: "Estrutura em titanio, chip A17 Pro e cameras avancadas com zoom para foto, video e criacao.",
    summary: "Flagship Apple com acabamento premium, desempenho de ponta e cameras profissionais.",
    specs: ["Estrutura em titanio", "Chip A17 Pro", "Sistema Pro de cameras", "USB-C e botao de acao"],
    visual: "phone",
    colors: ["#111827", "#9ca3af"],
    highlight: "Titanio natural e A17 Pro",
    shipping: "Frete expresso",
    inventoryLabel: "Ultimas unidades",
    searchTerms: ["apple", "iphone", "15", "pro", "max", "ios"],
  },
  {
    id: "moto-edge-50-neo-256",
    name: "Motorola Edge 50 Neo 256GB",
    brand: "Motorola",
    category: "smartphones",
    priceInCents: 229900,
    originalPriceInCents: 269900,
    installmentCount: 10,
    pixDiscountLabel: "a vista no Pix",
    rating: 4.7,
    reviewCount: 89,
    badge: "Escolha do dia",
    description: "Leve, resistente e pronto para fotos com sensor Sony, tela pOLED e carregamento turbo.",
    summary: "Smartphone equilibrado com bom custo-beneficio, resistencia e design compacto.",
    specs: ["Tela pOLED 120Hz", "Camera Sony com OIS", "Carregamento TurboPower", "IP68 e MIL-STD-810H"],
    visual: "phone",
    colors: ["#312e81", "#8b5cf6"],
    highlight: "Compacto, resistente e rapido",
    shipping: "Retire hoje",
    inventoryLabel: "Estoque alto",
    searchTerms: ["motorola", "edge", "50", "neo", "android", "smartphone"],
  },
  {
    id: "xiaomi-14t-512",
    name: "Xiaomi 14T 512GB",
    brand: "Xiaomi",
    category: "smartphones",
    priceInCents: 389900,
    originalPriceInCents: 419900,
    installmentCount: 12,
    pixDiscountLabel: "a vista no Pix",
    rating: 4.8,
    reviewCount: 118,
    badge: "Lider em camera",
    description: "Linha premium com desempenho forte, camera Leica e tela AMOLED para criadores e gamers.",
    summary: "Modelo premium Android com camera refinada, muita memoria e visual moderno.",
    specs: ["Camera com parceria Leica", "Tela AMOLED 144Hz", "512GB de armazenamento", "Carregamento rapido"],
    visual: "phone",
    colors: ["#7c2d12", "#f97316"],
    highlight: "Acabamento premium e muita memoria",
    shipping: "Entrega em 48h",
    inventoryLabel: "Em destaque",
    searchTerms: ["xiaomi", "14t", "camera", "leica", "5g"],
  },
  {
    id: "galaxy-s25-256",
    name: "Samsung Galaxy S25 256GB",
    brand: "Samsung",
    category: "smartphones",
    priceInCents: 519900,
    originalPriceInCents: 569900,
    installmentCount: 12,
    pixDiscountLabel: "a vista no Pix",
    rating: 4.9,
    reviewCount: 74,
    badge: "Lancamento",
    description: "Topo de linha compacto com tela de alta definicao, IA embarcada e desempenho flagship.",
    summary: "Flagship atual da linha Galaxy para quem quer potencia em formato compacto.",
    specs: ["Snapdragon Elite", "Tela AMOLED 120Hz", "Galaxy AI e traducoes", "Camera tripla premium"],
    visual: "phone",
    colors: ["#0f172a", "#475569"],
    highlight: "Nova geracao Galaxy",
    shipping: "Envio prioritario",
    inventoryLabel: "Lancamento",
    searchTerms: ["samsung", "galaxy", "s25", "novo", "flagship"],
  },
  {
    id: "lenovo-tab-plus-128",
    name: "Lenovo Tab Plus 128GB",
    brand: "Lenovo",
    category: "tablets",
    priceInCents: 249900,
    originalPriceInCents: 349900,
    installmentCount: 10,
    pixDiscountLabel: "a vista no Pix",
    rating: 4.5,
    reviewCount: 45,
    badge: "Som imersivo",
    description: "Tablet com 11.5\" 2K, oito alto-falantes JBL e suporte integrado para entretenimento.",
    summary: "Tablet Android focado em video e musica com audio JBL e tela 2K.",
    specs: ["11.5\" 2K 90Hz", "8 alto-falantes JBL com Dolby Atmos", "MediaTek Helio G99", "Kickstand integrado"],
    visual: "tablet",
    colors: ["#111827", "#6366f1"],
    highlight: "8 JBL speakers e Dolby Atmos",
    shipping: "Frete gratis",
    inventoryLabel: "Pronta entrega",
    searchTerms: ["lenovo", "tab", "plus", "tablet", "jbl", "2k"],
  },
  {
    id: "galaxy-tab-s9-fe-256",
    name: "Samsung Galaxy Tab S9 FE 256GB",
    brand: "Samsung",
    category: "tablets",
    priceInCents: 319900,
    originalPriceInCents: 349900,
    installmentCount: 10,
    pixDiscountLabel: "a vista no Pix",
    rating: 4.7,
    reviewCount: 229,
    badge: "Mais vendido",
    description: "Tablet com S Pen na caixa, tela imersiva, IP68 e experiencia forte para estudo e criacao.",
    summary: "Tablet versatil para estudo, anotacoes e consumo com S Pen inclusa.",
    specs: ["Tela 10.9\"", "S Pen inclusa", "Resistencia IP68", "Tela fluida e baixa luz azul"],
    visual: "tablet",
    colors: ["#1e293b", "#a855f7"],
    highlight: "S Pen inclusa e IP68",
    shipping: "Entrega em 24h",
    inventoryLabel: "Estoque alto",
    searchTerms: ["samsung", "tab", "s9", "fe", "tablet", "s pen"],
  },
  {
    id: "ipad-mini-a17-128",
    name: "Apple iPad mini 128GB",
    brand: "Apple",
    category: "tablets",
    priceInCents: 479900,
    originalPriceInCents: 519900,
    installmentCount: 12,
    pixDiscountLabel: "a vista no Pix",
    rating: 4.9,
    reviewCount: 111,
    badge: "Portatil",
    description: "Tablet compacto e poderoso para leitura, desenho, notas e produtividade em qualquer lugar.",
    summary: "iPad compacto premium para mobilidade, estudo e criacao com Apple Pencil.",
    specs: ["Tela Liquid Retina", "Chip atual da linha mini", "Compatibilidade com Apple Pencil", "Formato ultracompacto"],
    visual: "tablet",
    colors: ["#312e81", "#ec4899"],
    highlight: "Tamanho compacto, desempenho premium",
    shipping: "Frete expresso",
    inventoryLabel: "Sob demanda",
    searchTerms: ["apple", "ipad", "mini", "tablet", "ios", "pencil"],
  },
  {
    id: "lenovo-idea-tab-plus-128",
    name: "Lenovo Idea Tab Plus 128GB",
    brand: "Lenovo",
    category: "tablets",
    priceInCents: 229900,
    originalPriceInCents: 279900,
    installmentCount: 10,
    pixDiscountLabel: "a vista no Pix",
    rating: 4.6,
    reviewCount: 190,
    badge: "Campus pick",
    description: "Modelo fino com tela 12.1\" 2.5K, Android 15 e foco em estudo, leitura e notas.",
    summary: "Tablet fino e claro para leitura, estudo e produtividade leve no dia a dia.",
    specs: ["Tela 12.1\" 2.5K 90Hz", "Android 15", "MediaTek Dimensity 6400", "Design fino de 6.29 mm"],
    visual: "tablet",
    colors: ["#374151", "#c084fc"],
    highlight: "Tela grande e corpo fino",
    shipping: "Retire hoje",
    inventoryLabel: "Novo no catalogo",
    searchTerms: ["lenovo", "idea", "tab", "plus", "android 15", "tablet"],
  },
  {
    id: "galaxy-watch7-40mm",
    name: "Samsung Galaxy Watch7 40mm",
    brand: "Samsung",
    category: "smartwatches",
    priceInCents: 189900,
    originalPriceInCents: 239000,
    installmentCount: 10,
    pixDiscountLabel: "a vista no Pix",
    rating: 4.7,
    reviewCount: 734,
    badge: "Saude AI",
    description: "Smartwatch com processador 3nm, GPS duplo, BioActive Sensor e insights de bem-estar.",
    summary: "Relogio inteligente com foco em saude, exercicios e recursos de IA no ecossistema Galaxy.",
    specs: ["Processador 3nm", "Dual-Frequency GPS", "BioActive Sensor", "Energy Score com Galaxy AI"],
    visual: "watch",
    colors: ["#18181b", "#eab308"],
    highlight: "GPS duplo e sensores de saude",
    shipping: "Frete gratis",
    inventoryLabel: "Pronta entrega",
    searchTerms: ["samsung", "watch7", "smartwatch", "gps", "saude"],
  },
  {
    id: "apple-watch-series-10-42",
    name: "Apple Watch Series 10 42mm",
    brand: "Apple",
    category: "smartwatches",
    priceInCents: 329900,
    originalPriceInCents: 359900,
    installmentCount: 12,
    pixDiscountLabel: "a vista no Pix",
    rating: 4.8,
    reviewCount: 210,
    badge: "Ecossistema Apple",
    description: "Relogio premium com notificacoes, treino, saude e integracao profunda com iPhone.",
    summary: "Apple Watch para rotina, treino e notificacoes com tela sempre ativa e carga rapida.",
    specs: ["Tela sempre ativa", "Monitoramento de treino e saude", "Integracao com iPhone", "Carga rapida magnetica"],
    visual: "watch",
    colors: ["#111827", "#f59e0b"],
    highlight: "Treino, saude e notificacoes",
    shipping: "Envio prioritario",
    inventoryLabel: "Estoque moderado",
    searchTerms: ["apple", "watch", "series 10", "relogio", "ios"],
  },
  {
    id: "moto-watch-fit",
    name: "Moto Watch Fit",
    brand: "Motorola",
    category: "smartwatches",
    priceInCents: 119900,
    originalPriceInCents: 149900,
    installmentCount: 8,
    pixDiscountLabel: "a vista no Pix",
    rating: 4.4,
    reviewCount: 66,
    badge: "Esporte",
    description: "Relogio leve com foco em treino, monitoramento diario e bateria de longa duracao.",
    summary: "Smartwatch de entrada com visual esportivo e recursos para rotina ativa.",
    specs: ["Treinos e monitoramento diario", "Visual esportivo", "Bateria prolongada", "Pulseira confortavel"],
    visual: "watch",
    colors: ["#0f172a", "#22c55e"],
    highlight: "Leve e pronto para treino",
    shipping: "Entrega em 48h",
    inventoryLabel: "Bom custo-beneficio",
    searchTerms: ["motorola", "moto", "watch", "fit", "treino", "relogio"],
  },
  {
    id: "airpods-4-anc",
    name: "AirPods 4 com ANC",
    brand: "Apple",
    category: "accessories",
    priceInCents: 139900,
    originalPriceInCents: 179900,
    installmentCount: 10,
    pixDiscountLabel: "a vista no Pix",
    rating: 4.8,
    reviewCount: 412,
    badge: "Audio premium",
    description: "Fones com H2, cancelamento de ruido, audio espacial e ate 30h com o estojo.",
    summary: "Earbuds premium com ANC, USB-C e integracao nativa ao ecossistema Apple.",
    specs: ["Chip H2", "ANC e Audio Espacial", "USB-C e ate 30h com estojo", "Bluetooth 5.3"],
    visual: "earbuds",
    colors: ["#d1d5db", "#ffffff"],
    highlight: "ANC e audio espacial",
    shipping: "Frete gratis",
    inventoryLabel: "Disponivel",
    searchTerms: ["apple", "airpods", "anc", "fone", "bluetooth"],
  },
  {
    id: "anker-nano-45w",
    name: "Anker Nano Charger 45W",
    brand: "Anker",
    category: "accessories",
    priceInCents: 19900,
    originalPriceInCents: 25900,
    installmentCount: 4,
    pixDiscountLabel: "a vista no Pix",
    rating: 4.8,
    reviewCount: 435,
    badge: "Compacto",
    description: "Carregador USB-C GaN com 45W, PPS e corpo compacto para mochila, mesa ou viagem.",
    summary: "Carregador compacto com 45W e compatibilidade ampla para celular e tablet.",
    specs: ["45W max", "GaN compacto", "USB-C com PPS", "Universal para celular e tablet"],
    visual: "charger",
    colors: ["#111827", "#ef4444"],
    highlight: "GaN rapido e compacto",
    shipping: "Entrega em 24h",
    inventoryLabel: "Pronta entrega",
    searchTerms: ["anker", "nano", "45w", "charger", "usb-c", "gan"],
  },
  {
    id: "apple-magsafe-1m",
    name: "Apple MagSafe Charger 1m",
    brand: "Apple",
    category: "accessories",
    priceInCents: 39900,
    originalPriceInCents: 55000,
    installmentCount: 5,
    pixDiscountLabel: "a vista no Pix",
    rating: 4.6,
    reviewCount: 98,
    badge: "Qi2",
    description: "Base MagSafe com alinhamento magnetico e carga sem fio para iPhone e AirPods compativeis.",
    summary: "Carregador sem fio MagSafe para quem quer praticidade na mesa ou no criado-mudo.",
    specs: ["Qi2 ate 25W", "Magnetico para iPhone compativel", "Cabo integrado de 1m", "Compativel com AirPods"],
    visual: "charger",
    colors: ["#f8fafc", "#cbd5e1"],
    highlight: "Magnetico, limpo e pratico",
    shipping: "Entrega em 24h",
    inventoryLabel: "Estoque moderado",
    searchTerms: ["apple", "magsafe", "charger", "qi2", "airpods"],
  },
  {
    id: "samsung-45w-usbc-adapter",
    name: "Samsung Power Adapter USB-C 45W",
    brand: "Samsung",
    category: "accessories",
    priceInCents: 24900,
    originalPriceInCents: 32900,
    installmentCount: 5,
    pixDiscountLabel: "a vista no Pix",
    rating: 4.5,
    reviewCount: 127,
    badge: "Super Fast Charge",
    description: "Carregador oficial USB-C para Super Fast Charging em smartphones e tablets Galaxy.",
    summary: "Fonte oficial Samsung para carga rapida em celulares e tablets compativeis.",
    specs: ["45W USB-C", "Super Fast Charging", "Ideal para Galaxy S e Tab", "Compacto para viagem"],
    visual: "charger",
    colors: ["#111827", "#0ea5e9"],
    highlight: "Carregamento oficial Samsung",
    shipping: "Retire hoje",
    inventoryLabel: "Disponivel",
    searchTerms: ["samsung", "45w", "adapter", "usb-c", "charger", "fast"],
  },
  {
    id: "galaxy-smarttag2",
    name: "Samsung Galaxy SmartTag2",
    brand: "Samsung",
    category: "accessories",
    priceInCents: 17900,
    originalPriceInCents: 22900,
    installmentCount: 4,
    pixDiscountLabel: "a vista no Pix",
    rating: 4.6,
    reviewCount: 140,
    badge: "Casa conectada",
    description: "Tag inteligente para rastrear mochila, chaves e itens do dia a dia com app Galaxy.",
    summary: "Acessorio conectado para localizar itens essenciais com poucos toques.",
    specs: ["Bluetooth LE", "Modo perdido", "Duracao prolongada", "Anel reforcado"],
    visual: "case",
    colors: ["#1e293b", "#14b8a6"],
    highlight: "Rastreamento simples e util",
    shipping: "Frete gratis",
    inventoryLabel: "Em estoque",
    searchTerms: ["samsung", "smarttag", "rastreador", "chave", "acessorio"],
  },
];

export const shopBrands = Array.from(new Set(shopProducts.map((product) => product.brand)));

export const sortOptions = [
  { value: "featured", label: "Mais Relevantes" },
  { value: "price-asc", label: "Menor Preco" },
  { value: "price-desc", label: "Maior Preco" },
  { value: "rating", label: "Melhor Avaliados" },
  { value: "newest", label: "Novidades" },
] as const;

export type SortOptionValue = (typeof sortOptions)[number]["value"];

export function formatBRL(valueInCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(valueInCents / 100);
}

export function getInstallmentValue(priceInCents: number, installmentCount: number) {
  return Math.round(priceInCents / installmentCount);
}

export function buildProductSearchText(product: ShopProduct) {
  return [
    product.name,
    product.brand,
    product.description,
    product.summary,
    product.category,
    ...product.searchTerms,
    ...product.specs,
  ]
    .join(" ")
    .toLowerCase();
}

function getCategoryLabel(categoryId: ShopCategoryId) {
  return shopCategories.find((category) => category.id === categoryId)?.label ?? categoryId;
}

export function getProductCardContent(product: ShopProduct): ShopProductCardContent {
  const originalPriceText = product.originalPriceInCents ? formatBRL(product.originalPriceInCents) : undefined;
  const priceText = formatBRL(product.priceInCents);
  const installmentText = `ou ${product.installmentCount}x de ${formatBRL(
    getInstallmentValue(product.priceInCents, product.installmentCount),
  )}`;
  const ratingText = `${product.rating.toFixed(1)} de 5 (${product.reviewCount} avaliacoes)`;
  const shippingText = product.shipping;
  const inventoryText = product.inventoryLabel;
  const cardLines = [
    product.badge ? `Badge: ${product.badge}` : null,
    `Titulo: ${product.name}`,
    `Resumo: ${product.summary}`,
    `Avaliacao: ${ratingText}`,
    originalPriceText ? `Preco anterior: ${originalPriceText}` : null,
    `Condicao Pix: ${product.pixDiscountLabel}`,
    `Preco atual: ${priceText}`,
    `Parcelamento: ${installmentText}`,
    `Entrega: ${shippingText}`,
    `Estoque: ${inventoryText}`,
  ].filter(Boolean);

  return {
    productId: product.id,
    badge: product.badge,
    title: product.name,
    summary: product.summary,
    ratingText,
    originalPriceText,
    pixText: product.pixDiscountLabel,
    priceText,
    installmentText,
    shippingText,
    inventoryText,
    cardText: cardLines.join(" | "),
  };
}

export function getProductDetailContent(product: ShopProduct): ShopProductDetailContent {
  const card = getProductCardContent(product);
  const detailLines = [
    `Categoria: ${getCategoryLabel(product.category)}`,
    `Marca: ${product.brand}`,
    `Descricao completa: ${product.description}`,
    `Destaque visual: ${product.highlight}`,
    `Especificacoes: ${product.specs.join(" | ")}`,
    `Detalhes do card: ${card.cardText}`,
  ];

  return {
    ...card,
    description: product.description,
    specs: product.specs,
    detailText: detailLines.join(" || "),
  };
}
