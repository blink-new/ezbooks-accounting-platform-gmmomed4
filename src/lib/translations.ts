import { Language } from '../hooks/useLanguage'

export interface Translations {
  // Navigation
  dashboard: string
  transactions: string
  invoices: string
  customers: string
  purchaseOrders: string
  accountsReceivable: string
  accountsPayable: string
  reports: string
  settings: string
  buckAI: string
  
  // Common actions
  save: string
  cancel: string
  delete: string
  edit: string
  create: string
  search: string
  filter: string
  export: string
  
  // Dashboard
  welcomeBack: string
  totalRevenue: string
  totalExpenses: string
  netProfit: string
  outstandingInvoices: string
  addTransaction: string
  newInvoice: string
  viewReports: string
  
  // AI Assistant
  chatWithBuck: string
  buckAISubtitle: string
  askBuckAnything: string
  voiceInput: string
  sendMessage: string
  
  // Quick Actions
  hiBuck: string
  howsMyBusiness: string
  whatShouldIFocusOn: string
  amIMakingMoney: string
  explainMyFinances: string
  isMyBusinessHealthy: string
  shouldIHireSomeone: string
  taxHelpSimple: string
  simplifyAnything: string
  moneyMakingIdeas: string
  
  // Greetings and responses
  greeting1: string
  greeting2: string
  greeting3: string
  greeting4: string
  greeting5: string
  
  // Status messages
  analyzing: string
  gotIt: string
  loading: string
  error: string
  success: string
  
  // Pricing
  everythingFree: string
  launchSpecial: string
  allTiersFree: string
  noLimitsNoCatch: string
  getStartedFree: string
  
  // Forms
  customerName: string
  email: string
  phone: string
  address: string
  amount: string
  description: string
  date: string
  category: string
  
  // Languages
  language: string
  selectLanguage: string
}

export const translations: Record<Language, Translations> = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    transactions: 'Transactions',
    invoices: 'Invoices',
    customers: 'Customers',
    purchaseOrders: 'Purchase Orders',
    accountsReceivable: 'Accounts Receivable',
    accountsPayable: 'Accounts Payable',
    reports: 'Reports',
    settings: 'Settings',
    buckAI: 'B.U.C.K. AI',
    
    // Common actions
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    
    // Dashboard
    welcomeBack: 'Welcome back',
    totalRevenue: 'Total Revenue',
    totalExpenses: 'Total Expenses',
    netProfit: 'Net Profit',
    outstandingInvoices: 'Outstanding Invoices',
    addTransaction: 'Add Transaction',
    newInvoice: 'New Invoice',
    viewReports: 'View Reports',
    
    // AI Assistant
    chatWithBuck: 'Chat with B.U.C.K. AI',
    buckAISubtitle: 'Your AI Chief Financial Officer',
    askBuckAnything: 'Ask B.U.C.K. anything about your business finances...',
    voiceInput: 'Voice Input',
    sendMessage: 'Send Message',
    
    // Quick Actions
    hiBuck: 'Hi Buck! 👋',
    howsMyBusiness: "How's My Business?",
    whatShouldIFocusOn: 'What Should I Focus On?',
    amIMakingMoney: 'Am I Making Money?',
    explainMyFinances: 'Explain My Finances',
    isMyBusinessHealthy: 'Is My Business Healthy?',
    shouldIHireSomeone: 'Should I Hire Someone?',
    taxHelpSimple: 'Tax Help (Simple)',
    simplifyAnything: 'Simplify Anything',
    moneyMakingIdeas: 'Money-Making Ideas',
    
    // Greetings and responses
    greeting1: "Hey there! 👋 I'm Buck, your AI Chief Financial Officer! I'm excited to help you understand your finances and grow your business. What would you like to know?",
    greeting2: "Hello! 🌟 Buck here, ready to make your accounting simple and profitable! I can analyze your numbers, answer questions, and give you actionable insights. How can I help?",
    greeting3: "Hi! 💼 I'm Buck, your personal CFO assistant! I'm here to help you make smart financial decisions and understand your business better. What's on your mind?",
    greeting4: "Greetings! 🚀 Buck at your service! I love helping business owners like you succeed financially. Whether it's analyzing trends or answering questions, I'm here for you!",
    greeting5: "Welcome! 😊 I'm Buck, and I'm absolutely thrilled to meet you! I'm here to make accounting fun and help your business thrive. What can I help you with today?",
    
    // Status messages
    analyzing: 'B.U.C.K. AI is analyzing...',
    gotIt: 'Got it! 🤔 Let me analyze...',
    loading: 'Loading...',
    error: 'Oops! Something went wrong',
    success: 'Success!',
    
    // Pricing
    everythingFree: 'Everything FREE',
    launchSpecial: 'Launch Special',
    allTiersFree: '✨ All Tiers FREE',
    noLimitsNoCatch: 'No Limits, No Catch',
    getStartedFree: 'Get Started FREE',
    
    // Forms
    customerName: 'Customer Name',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    amount: 'Amount',
    description: 'Description',
    date: 'Date',
    category: 'Category',
    
    // Languages
    language: 'Language',
    selectLanguage: 'Select Language'
  },
  
  es: {
    // Navigation
    dashboard: 'Panel de Control',
    transactions: 'Transacciones',
    invoices: 'Facturas',
    customers: 'Clientes',
    purchaseOrders: 'Órdenes de Compra',
    accountsReceivable: 'Cuentas por Cobrar',
    accountsPayable: 'Cuentas por Pagar',
    reports: 'Reportes',
    settings: 'Configuración',
    buckAI: 'B.U.C.K. AI',
    
    // Common actions
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    create: 'Crear',
    search: 'Buscar',
    filter: 'Filtrar',
    export: 'Exportar',
    
    // Dashboard
    welcomeBack: 'Bienvenido de vuelta',
    totalRevenue: 'Ingresos Totales',
    totalExpenses: 'Gastos Totales',
    netProfit: 'Ganancia Neta',
    outstandingInvoices: 'Facturas Pendientes',
    addTransaction: 'Agregar Transacción',
    newInvoice: 'Nueva Factura',
    viewReports: 'Ver Reportes',
    
    // AI Assistant
    chatWithBuck: 'Chatear con B.U.C.K. AI',
    buckAISubtitle: 'Tu Director Financiero con IA',
    askBuckAnything: 'Pregúntale a B.U.C.K. cualquier cosa sobre las finanzas de tu negocio...',
    voiceInput: 'Entrada de Voz',
    sendMessage: 'Enviar Mensaje',
    
    // Quick Actions
    hiBuck: '¡Hola Buck! 👋',
    howsMyBusiness: '¿Cómo está mi Negocio?',
    whatShouldIFocusOn: '¿En qué debo Enfocarme?',
    amIMakingMoney: '¿Estoy Ganando Dinero?',
    explainMyFinances: 'Explica mis Finanzas',
    isMyBusinessHealthy: '¿Mi Negocio está Saludable?',
    shouldIHireSomeone: '¿Debería Contratar a Alguien?',
    taxHelpSimple: 'Ayuda con Impuestos (Simple)',
    simplifyAnything: 'Simplificar Cualquier Cosa',
    moneyMakingIdeas: 'Ideas para Ganar Dinero',
    
    // Greetings and responses
    greeting1: "¡Hola! 👋 Soy Buck, tu Director Financiero con IA. Estoy emocionado de ayudarte a entender tus finanzas y hacer crecer tu negocio. ¿Qué te gustaría saber?",
    greeting2: "¡Hola! 🌟 Buck aquí, listo para hacer tu contabilidad simple y rentable. Puedo analizar tus números, responder preguntas y darte ideas accionables. ¿Cómo puedo ayudarte?",
    greeting3: "¡Hola! 💼 Soy Buck, tu asistente CFO personal. Estoy aquí para ayudarte a tomar decisiones financieras inteligentes y entender mejor tu negocio. ¿Qué tienes en mente?",
    greeting4: "¡Saludos! 🚀 ¡Buck a tu servicio! Me encanta ayudar a dueños de negocios como tú a tener éxito financiero. Ya sea analizando tendencias o respondiendo preguntas, ¡estoy aquí para ti!",
    greeting5: "¡Bienvenido! 😊 Soy Buck, ¡y estoy absolutamente emocionado de conocerte! Estoy aquí para hacer la contabilidad divertida y ayudar a que tu negocio prospere. ¿En qué puedo ayudarte hoy?",
    
    // Status messages
    analyzing: 'B.U.C.K. AI está analizando...',
    gotIt: '¡Entendido! 🤔 Déjame analizar...',
    loading: 'Cargando...',
    error: '¡Ups! Algo salió mal',
    success: '¡Éxito!',
    
    // Pricing
    everythingFree: 'Todo GRATIS',
    launchSpecial: 'Especial de Lanzamiento',
    allTiersFree: '✨ Todos los Niveles GRATIS',
    noLimitsNoCatch: 'Sin Límites, Sin Trampa',
    getStartedFree: 'Comenzar GRATIS',
    
    // Forms
    customerName: 'Nombre del Cliente',
    email: 'Correo Electrónico',
    phone: 'Teléfono',
    address: 'Dirección',
    amount: 'Cantidad',
    description: 'Descripción',
    date: 'Fecha',
    category: 'Categoría',
    
    // Languages
    language: 'Idioma',
    selectLanguage: 'Seleccionar Idioma'
  },
  
  fr: {
    // Navigation
    dashboard: 'Tableau de Bord',
    transactions: 'Transactions',
    invoices: 'Factures',
    customers: 'Clients',
    purchaseOrders: 'Bons de Commande',
    accountsReceivable: 'Comptes Clients',
    accountsPayable: 'Comptes Fournisseurs',
    reports: 'Rapports',
    settings: 'Paramètres',
    buckAI: 'B.U.C.K. AI',
    
    // Common actions
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    create: 'Créer',
    search: 'Rechercher',
    filter: 'Filtrer',
    export: 'Exporter',
    
    // Dashboard
    welcomeBack: 'Bon retour',
    totalRevenue: 'Revenus Totaux',
    totalExpenses: 'Dépenses Totales',
    netProfit: 'Bénéfice Net',
    outstandingInvoices: 'Factures Impayées',
    addTransaction: 'Ajouter Transaction',
    newInvoice: 'Nouvelle Facture',
    viewReports: 'Voir Rapports',
    
    // AI Assistant
    chatWithBuck: 'Chatter avec B.U.C.K. AI',
    buckAISubtitle: 'Votre Directeur Financier IA',
    askBuckAnything: 'Demandez à B.U.C.K. tout sur les finances de votre entreprise...',
    voiceInput: 'Entrée Vocale',
    sendMessage: 'Envoyer Message',
    
    // Quick Actions
    hiBuck: 'Salut Buck! 👋',
    howsMyBusiness: 'Comment va mon Entreprise?',
    whatShouldIFocusOn: 'Sur quoi dois-je me Concentrer?',
    amIMakingMoney: 'Est-ce que je Gagne de l\'Argent?',
    explainMyFinances: 'Expliquer mes Finances',
    isMyBusinessHealthy: 'Mon Entreprise est-elle en Bonne Santé?',
    shouldIHireSomeone: 'Devrais-je Embaucher Quelqu\'un?',
    taxHelpSimple: 'Aide Fiscale (Simple)',
    simplifyAnything: 'Simplifier N\'importe Quoi',
    moneyMakingIdeas: 'Idées pour Gagner de l\'Argent',
    
    // Greetings and responses
    greeting1: "Salut! 👋 Je suis Buck, votre Directeur Financier IA! Je suis ravi de vous aider à comprendre vos finances et développer votre entreprise. Que voulez-vous savoir?",
    greeting2: "Bonjour! 🌟 Buck ici, prêt à rendre votre comptabilité simple et rentable! Je peux analyser vos chiffres, répondre aux questions et vous donner des insights actionnables. Comment puis-je aider?",
    greeting3: "Salut! 💼 Je suis Buck, votre assistant CFO personnel! Je suis là pour vous aider à prendre des décisions financières intelligentes et mieux comprendre votre entreprise. À quoi pensez-vous?",
    greeting4: "Salutations! 🚀 Buck à votre service! J'adore aider les propriétaires d'entreprise comme vous à réussir financièrement. Que ce soit analyser les tendances ou répondre aux questions, je suis là pour vous!",
    greeting5: "Bienvenue! 😊 Je suis Buck, et je suis absolument ravi de vous rencontrer! Je suis là pour rendre la comptabilité amusante et aider votre entreprise à prospérer. Comment puis-je vous aider aujourd'hui?",
    
    // Status messages
    analyzing: 'B.U.C.K. AI analyse...',
    gotIt: 'Compris! 🤔 Laissez-moi analyser...',
    loading: 'Chargement...',
    error: 'Oups! Quelque chose s\'est mal passé',
    success: 'Succès!',
    
    // Pricing
    everythingFree: 'Tout GRATUIT',
    launchSpecial: 'Spécial Lancement',
    allTiersFree: '✨ Tous Niveaux GRATUITS',
    noLimitsNoCatch: 'Sans Limites, Sans Piège',
    getStartedFree: 'Commencer GRATUITEMENT',
    
    // Forms
    customerName: 'Nom du Client',
    email: 'Email',
    phone: 'Téléphone',
    address: 'Adresse',
    amount: 'Montant',
    description: 'Description',
    date: 'Date',
    category: 'Catégorie',
    
    // Languages
    language: 'Langue',
    selectLanguage: 'Sélectionner Langue'
  },
  
  pt: {
    // Navigation
    dashboard: 'Painel',
    transactions: 'Transações',
    invoices: 'Faturas',
    customers: 'Clientes',
    purchaseOrders: 'Ordens de Compra',
    accountsReceivable: 'Contas a Receber',
    accountsPayable: 'Contas a Pagar',
    reports: 'Relatórios',
    settings: 'Configurações',
    buckAI: 'B.U.C.K. AI',
    
    // Common actions
    save: 'Salvar',
    cancel: 'Cancelar',
    delete: 'Excluir',
    edit: 'Editar',
    create: 'Criar',
    search: 'Pesquisar',
    filter: 'Filtrar',
    export: 'Exportar',
    
    // Dashboard
    welcomeBack: 'Bem-vindo de volta',
    totalRevenue: 'Receita Total',
    totalExpenses: 'Despesas Totais',
    netProfit: 'Lucro Líquido',
    outstandingInvoices: 'Faturas Pendentes',
    addTransaction: 'Adicionar Transação',
    newInvoice: 'Nova Fatura',
    viewReports: 'Ver Relatórios',
    
    // AI Assistant
    chatWithBuck: 'Conversar com B.U.C.K. AI',
    buckAISubtitle: 'Seu Diretor Financeiro com IA',
    askBuckAnything: 'Pergunte ao B.U.C.K. qualquer coisa sobre as finanças do seu negócio...',
    voiceInput: 'Entrada de Voz',
    sendMessage: 'Enviar Mensagem',
    
    // Quick Actions
    hiBuck: 'Oi Buck! 👋',
    howsMyBusiness: 'Como está meu Negócio?',
    whatShouldIFocusOn: 'No que devo me Focar?',
    amIMakingMoney: 'Estou Ganhando Dinheiro?',
    explainMyFinances: 'Explicar minhas Finanças',
    isMyBusinessHealthy: 'Meu Negócio está Saudável?',
    shouldIHireSomeone: 'Devo Contratar Alguém?',
    taxHelpSimple: 'Ajuda com Impostos (Simples)',
    simplifyAnything: 'Simplificar Qualquer Coisa',
    moneyMakingIdeas: 'Ideias para Ganhar Dinheiro',
    
    // Greetings and responses
    greeting1: "Oi! 👋 Eu sou o Buck, seu Diretor Financeiro com IA! Estou animado para ajudá-lo a entender suas finanças e fazer seu negócio crescer. O que gostaria de saber?",
    greeting2: "Olá! 🌟 Buck aqui, pronto para tornar sua contabilidade simples e lucrativa! Posso analisar seus números, responder perguntas e dar insights acionáveis. Como posso ajudar?",
    greeting3: "Oi! 💼 Eu sou o Buck, seu assistente CFO pessoal! Estou aqui para ajudá-lo a tomar decisões financeiras inteligentes e entender melhor seu negócio. O que tem em mente?",
    greeting4: "Saudações! 🚀 Buck ao seu serviço! Adoro ajudar proprietários de negócios como você a ter sucesso financeiro. Seja analisando tendências ou respondendo perguntas, estou aqui para você!",
    greeting5: "Bem-vindo! 😊 Eu sou o Buck, e estou absolutamente empolgado em conhecê-lo! Estou aqui para tornar a contabilidade divertida e ajudar seu negócio a prosperar. Como posso ajudá-lo hoje?",
    
    // Status messages
    analyzing: 'B.U.C.K. AI está analisando...',
    gotIt: 'Entendi! 🤔 Deixe-me analisar...',
    loading: 'Carregando...',
    error: 'Ops! Algo deu errado',
    success: 'Sucesso!',
    
    // Pricing
    everythingFree: 'Tudo GRÁTIS',
    launchSpecial: 'Especial de Lançamento',
    allTiersFree: '✨ Todos os Níveis GRÁTIS',
    noLimitsNoCatch: 'Sem Limites, Sem Pegadinha',
    getStartedFree: 'Começar GRÁTIS',
    
    // Forms
    customerName: 'Nome do Cliente',
    email: 'Email',
    phone: 'Telefone',
    address: 'Endereço',
    amount: 'Valor',
    description: 'Descrição',
    date: 'Data',
    category: 'Categoria',
    
    // Languages
    language: 'Idioma',
    selectLanguage: 'Selecionar Idioma'
  },
  
  de: {
    // Navigation
    dashboard: 'Dashboard',
    transactions: 'Transaktionen',
    invoices: 'Rechnungen',
    customers: 'Kunden',
    purchaseOrders: 'Bestellungen',
    accountsReceivable: 'Forderungen',
    accountsPayable: 'Verbindlichkeiten',
    reports: 'Berichte',
    settings: 'Einstellungen',
    buckAI: 'B.U.C.K. AI',
    
    // Common actions
    save: 'Speichern',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    create: 'Erstellen',
    search: 'Suchen',
    filter: 'Filtern',
    export: 'Exportieren',
    
    // Dashboard
    welcomeBack: 'Willkommen zurück',
    totalRevenue: 'Gesamtumsatz',
    totalExpenses: 'Gesamtausgaben',
    netProfit: 'Nettogewinn',
    outstandingInvoices: 'Offene Rechnungen',
    addTransaction: 'Transaktion hinzufügen',
    newInvoice: 'Neue Rechnung',
    viewReports: 'Berichte anzeigen',
    
    // AI Assistant
    chatWithBuck: 'Chat mit B.U.C.K. AI',
    buckAISubtitle: 'Ihr KI-Finanzchef',
    askBuckAnything: 'Fragen Sie B.U.C.K. alles über die Finanzen Ihres Unternehmens...',
    voiceInput: 'Spracheingabe',
    sendMessage: 'Nachricht senden',
    
    // Quick Actions
    hiBuck: 'Hallo Buck! 👋',
    howsMyBusiness: 'Wie läuft mein Geschäft?',
    whatShouldIFocusOn: 'Worauf sollte ich mich konzentrieren?',
    amIMakingMoney: 'Verdiene ich Geld?',
    explainMyFinances: 'Meine Finanzen erklären',
    isMyBusinessHealthy: 'Ist mein Unternehmen gesund?',
    shouldIHireSomeone: 'Sollte ich jemanden einstellen?',
    taxHelpSimple: 'Steuerhilfe (Einfach)',
    simplifyAnything: 'Alles vereinfachen',
    moneyMakingIdeas: 'Geld verdienen Ideen',
    
    // Greetings and responses
    greeting1: "Hallo! 👋 Ich bin Buck, Ihr KI-Finanzchef! Ich freue mich, Ihnen zu helfen, Ihre Finanzen zu verstehen und Ihr Unternehmen zu vergrößern. Was möchten Sie wissen?",
    greeting2: "Hallo! 🌟 Buck hier, bereit, Ihre Buchhaltung einfach und profitabel zu machen! Ich kann Ihre Zahlen analysieren, Fragen beantworten und Ihnen umsetzbare Erkenntnisse geben. Wie kann ich helfen?",
    greeting3: "Hallo! 💼 Ich bin Buck, Ihr persönlicher CFO-Assistent! Ich bin hier, um Ihnen zu helfen, kluge finanzielle Entscheidungen zu treffen und Ihr Unternehmen besser zu verstehen. Was haben Sie im Sinn?",
    greeting4: "Grüße! 🚀 Buck zu Ihren Diensten! Ich helfe gerne Geschäftsinhabern wie Ihnen beim finanziellen Erfolg. Ob Trends analysieren oder Fragen beantworten, ich bin für Sie da!",
    greeting5: "Willkommen! 😊 Ich bin Buck und freue mich sehr, Sie kennenzulernen! Ich bin hier, um die Buchhaltung unterhaltsam zu machen und Ihrem Unternehmen zum Erfolg zu verhelfen. Wie kann ich Ihnen heute helfen?",
    
    // Status messages
    analyzing: 'B.U.C.K. AI analysiert...',
    gotIt: 'Verstanden! 🤔 Lass mich analysieren...',
    loading: 'Laden...',
    error: 'Ups! Etwas ist schief gelaufen',
    success: 'Erfolg!',
    
    // Pricing
    everythingFree: 'Alles KOSTENLOS',
    launchSpecial: 'Launch-Special',
    allTiersFree: '✨ Alle Stufen KOSTENLOS',
    noLimitsNoCatch: 'Keine Grenzen, Kein Haken',
    getStartedFree: 'KOSTENLOS starten',
    
    // Forms
    customerName: 'Kundenname',
    email: 'E-Mail',
    phone: 'Telefon',
    address: 'Adresse',
    amount: 'Betrag',
    description: 'Beschreibung',
    date: 'Datum',
    category: 'Kategorie',
    
    // Languages
    language: 'Sprache',
    selectLanguage: 'Sprache auswählen'
  },
  
  it: {
    // Navigation
    dashboard: 'Dashboard',
    transactions: 'Transazioni',
    invoices: 'Fatture',
    customers: 'Clienti',
    purchaseOrders: 'Ordini di Acquisto',
    accountsReceivable: 'Crediti',
    accountsPayable: 'Debiti',
    reports: 'Report',
    settings: 'Impostazioni',
    buckAI: 'B.U.C.K. AI',
    
    // Common actions
    save: 'Salva',
    cancel: 'Annulla',
    delete: 'Elimina',
    edit: 'Modifica',
    create: 'Crea',
    search: 'Cerca',
    filter: 'Filtra',
    export: 'Esporta',
    
    // Dashboard
    welcomeBack: 'Bentornato',
    totalRevenue: 'Ricavi Totali',
    totalExpenses: 'Spese Totali',
    netProfit: 'Profitto Netto',
    outstandingInvoices: 'Fatture in Sospeso',
    addTransaction: 'Aggiungi Transazione',
    newInvoice: 'Nuova Fattura',
    viewReports: 'Visualizza Report',
    
    // AI Assistant
    chatWithBuck: 'Chatta con B.U.C.K. AI',
    buckAISubtitle: 'Il tuo Direttore Finanziario AI',
    askBuckAnything: 'Chiedi a B.U.C.K. qualsiasi cosa sulle finanze della tua azienda...',
    voiceInput: 'Input Vocale',
    sendMessage: 'Invia Messaggio',
    
    // Quick Actions
    hiBuck: 'Ciao Buck! 👋',
    howsMyBusiness: 'Come va la mia Azienda?',
    whatShouldIFocusOn: 'Su cosa dovrei Concentrarmi?',
    amIMakingMoney: 'Sto Guadagnando Soldi?',
    explainMyFinances: 'Spiega le mie Finanze',
    isMyBusinessHealthy: 'La mia Azienda è in Salute?',
    shouldIHireSomeone: 'Dovrei Assumere Qualcuno?',
    taxHelpSimple: 'Aiuto Tasse (Semplice)',
    simplifyAnything: 'Semplifica Qualsiasi Cosa',
    moneyMakingIdeas: 'Idee per Fare Soldi',
    
    // Greetings and responses
    greeting1: "Ciao! 👋 Sono Buck, il tuo Direttore Finanziario AI! Sono entusiasta di aiutarti a capire le tue finanze e far crescere la tua azienda. Cosa vorresti sapere?",
    greeting2: "Ciao! 🌟 Buck qui, pronto a rendere la tua contabilità semplice e redditizia! Posso analizzare i tuoi numeri, rispondere alle domande e darti insights azionabili. Come posso aiutare?",
    greeting3: "Ciao! 💼 Sono Buck, il tuo assistente CFO personale! Sono qui per aiutarti a prendere decisioni finanziarie intelligenti e capire meglio la tua azienda. A cosa stai pensando?",
    greeting4: "Saluti! 🚀 Buck al tuo servizio! Amo aiutare imprenditori come te ad avere successo finanziario. Che si tratti di analizzare tendenze o rispondere a domande, sono qui per te!",
    greeting5: "Benvenuto! 😊 Sono Buck, e sono assolutamente entusiasta di conoscerti! Sono qui per rendere la contabilità divertente e aiutare la tua azienda a prosperare. Come posso aiutarti oggi?",
    
    // Status messages
    analyzing: 'B.U.C.K. AI sta analizzando...',
    gotIt: 'Capito! 🤔 Fammi analizzare...',
    loading: 'Caricamento...',
    error: 'Ops! Qualcosa è andato storto',
    success: 'Successo!',
    
    // Pricing
    everythingFree: 'Tutto GRATIS',
    launchSpecial: 'Speciale Lancio',
    allTiersFree: '✨ Tutti i Livelli GRATIS',
    noLimitsNoCatch: 'Nessun Limite, Nessun Trucco',
    getStartedFree: 'Inizia GRATIS',
    
    // Forms
    customerName: 'Nome Cliente',
    email: 'Email',
    phone: 'Telefono',
    address: 'Indirizzo',
    amount: 'Importo',
    description: 'Descrizione',
    date: 'Data',
    category: 'Categoria',
    
    // Languages
    language: 'Lingua',
    selectLanguage: 'Seleziona Lingua'
  },
  
  zh: {
    // Navigation
    dashboard: '仪表板',
    transactions: '交易',
    invoices: '发票',
    customers: '客户',
    purchaseOrders: '采购订单',
    accountsReceivable: '应收账款',
    accountsPayable: '应付账款',
    reports: '报告',
    settings: '设置',
    buckAI: 'B.U.C.K. AI',
    
    // Common actions
    save: '保存',
    cancel: '取消',
    delete: '删除',
    edit: '编辑',
    create: '创建',
    search: '搜索',
    filter: '筛选',
    export: '导出',
    
    // Dashboard
    welcomeBack: '欢迎回来',
    totalRevenue: '总收入',
    totalExpenses: '总支出',
    netProfit: '净利润',
    outstandingInvoices: '未付发票',
    addTransaction: '添加交易',
    newInvoice: '新发票',
    viewReports: '查看报告',
    
    // AI Assistant
    chatWithBuck: '与 B.U.C.K. AI 聊天',
    buckAISubtitle: '您的AI首席财务官',
    askBuckAnything: '向 B.U.C.K. 询问有关您企业财务的任何问题...',
    voiceInput: '语音输入',
    sendMessage: '发送消息',
    
    // Quick Actions
    hiBuck: '你好 Buck! 👋',
    howsMyBusiness: '我的生意怎么样？',
    whatShouldIFocusOn: '我应该专注于什么？',
    amIMakingMoney: '我在赚钱吗？',
    explainMyFinances: '解释我的财务',
    isMyBusinessHealthy: '我的企业健康吗？',
    shouldIHireSomeone: '我应该雇人吗？',
    taxHelpSimple: '税务帮助（简单）',
    simplifyAnything: '简化任何事情',
    moneyMakingIdeas: '赚钱想法',
    
    // Greetings and responses
    greeting1: "你好！👋 我是Buck，您的AI首席财务官！我很兴奋能帮助您了解财务并发展业务。您想了解什么？",
    greeting2: "您好！🌟 Buck在这里，准备让您的会计变得简单和盈利！我可以分析您的数字，回答问题，并给您可行的见解。我如何帮助您？",
    greeting3: "嗨！💼 我是Buck，您的个人CFO助手！我在这里帮助您做出明智的财务决策并更好地了解您的业务。您在想什么？",
    greeting4: "问候！🚀 Buck为您服务！我喜欢帮助像您这样的企业主在财务上取得成功。无论是分析趋势还是回答问题，我都在这里为您服务！",
    greeting5: "欢迎！😊 我是Buck，我非常兴奋见到您！我在这里让会计变得有趣，帮助您的企业蓬勃发展。今天我能为您做什么？",
    
    // Status messages
    analyzing: 'B.U.C.K. AI 正在分析...',
    gotIt: '明白了！🤔 让我分析一下...',
    loading: '加载中...',
    error: '哎呀！出了点问题',
    success: '成功！',
    
    // Pricing
    everythingFree: '一切免费',
    launchSpecial: '发布特惠',
    allTiersFree: '✨ 所有层级免费',
    noLimitsNoCatch: '无限制，无陷阱',
    getStartedFree: '免费开始',
    
    // Forms
    customerName: '客户姓名',
    email: '邮箱',
    phone: '电话',
    address: '地址',
    amount: '金额',
    description: '描述',
    date: '日期',
    category: '类别',
    
    // Languages
    language: '语言',
    selectLanguage: '选择语言'
  },
  
  ja: {
    // Navigation
    dashboard: 'ダッシュボード',
    transactions: '取引',
    invoices: '請求書',
    customers: '顧客',
    purchaseOrders: '発注書',
    accountsReceivable: '売掛金',
    accountsPayable: '買掛金',
    reports: 'レポート',
    settings: '設定',
    buckAI: 'B.U.C.K. AI',
    
    // Common actions
    save: '保存',
    cancel: 'キャンセル',
    delete: '削除',
    edit: '編集',
    create: '作成',
    search: '検索',
    filter: 'フィルター',
    export: 'エクスポート',
    
    // Dashboard
    welcomeBack: 'おかえりなさい',
    totalRevenue: '総収益',
    totalExpenses: '総支出',
    netProfit: '純利益',
    outstandingInvoices: '未払い請求書',
    addTransaction: '取引を追加',
    newInvoice: '新しい請求書',
    viewReports: 'レポートを表示',
    
    // AI Assistant
    chatWithBuck: 'B.U.C.K. AIとチャット',
    buckAISubtitle: 'あなたのAI最高財務責任者',
    askBuckAnything: 'B.U.C.K.にあなたのビジネス財務について何でも聞いてください...',
    voiceInput: '音声入力',
    sendMessage: 'メッセージを送信',
    
    // Quick Actions
    hiBuck: 'こんにちはBuck! 👋',
    howsMyBusiness: '私のビジネスはどうですか？',
    whatShouldIFocusOn: '何に集中すべきですか？',
    amIMakingMoney: 'お金を稼いでいますか？',
    explainMyFinances: '私の財務を説明して',
    isMyBusinessHealthy: '私のビジネスは健全ですか？',
    shouldIHireSomeone: '誰かを雇うべきですか？',
    taxHelpSimple: '税務ヘルプ（シンプル）',
    simplifyAnything: '何でも簡単に',
    moneyMakingIdeas: 'お金を稼ぐアイデア',
    
    // Greetings and responses
    greeting1: "こんにちは！👋 私はBuck、あなたのAI最高財務責任者です！あなたの財務を理解し、ビジネスを成長させるお手伝いができることを嬉しく思います。何を知りたいですか？",
    greeting2: "こんにちは！🌟 Buckです。あなたの会計をシンプルで収益性の高いものにする準備ができています！数字を分析し、質問に答え、実行可能な洞察を提供できます。どのようにお手伝いできますか？",
    greeting3: "こんにちは！💼 私はBuck、あなたの個人的なCFOアシスタントです！賢い財務決定を下し、ビジネスをより良く理解するお手伝いをします。何をお考えですか？",
    greeting4: "ご挨拶！🚀 Buckがお手伝いします！あなたのような事業主が財務的に成功するお手伝いをするのが大好きです。トレンドの分析でも質問への回答でも、私はあなたのためにここにいます！",
    greeting5: "ようこそ！😊 私はBuckです。お会いできて本当に嬉しいです！会計を楽しくし、あなたのビジネスが繁栄するお手伝いをします。今日は何をお手伝いできますか？",
    
    // Status messages
    analyzing: 'B.U.C.K. AIが分析中...',
    gotIt: 'わかりました！🤔 分析させてください...',
    loading: '読み込み中...',
    error: 'おっと！何かがうまくいきませんでした',
    success: '成功！',
    
    // Pricing
    everythingFree: 'すべて無料',
    launchSpecial: 'ローンチスペシャル',
    allTiersFree: '✨ 全ティア無料',
    noLimitsNoCatch: '制限なし、落とし穴なし',
    getStartedFree: '無料で始める',
    
    // Forms
    customerName: '顧客名',
    email: 'メール',
    phone: '電話',
    address: '住所',
    amount: '金額',
    description: '説明',
    date: '日付',
    category: 'カテゴリー',
    
    // Languages
    language: '言語',
    selectLanguage: '言語を選択'
  }
}

export const useTranslation = (language: Language) => {
  return translations[language] || translations.en
}