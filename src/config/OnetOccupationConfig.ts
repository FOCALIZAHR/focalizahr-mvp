// ════════════════════════════════════════════════════════════════════════════
// O*NET OCCUPATION CONFIG — Tabla de aliases para empresas chilenas
// src/config/OnetOccupationConfig.ts
// ════════════════════════════════════════════════════════════════════════════
// ~150-200 ocupaciones con aliases en español chileno.
// Patrón: réplica de DepartmentAdapter.gerenciaAliases
// Cada SOC code tiene 5-20 aliases cubriendo:
//   - Títulos comunes en Chile (retail, banca, salud, tech, manufactura, servicios)
//   - Equivalentes en inglés
//   - Abreviaciones usadas en empresas medianas/grandes
//
// Organizado por familia SOC (11=Management, 13=Business, 15=Computer, etc.)
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// SOC ALIASES — keyword matching por código SOC
// Key: SOC code | Value: aliases en español/inglés
// ════════════════════════════════════════════════════════════════════════════

export const SOC_ALIASES: Record<string, string[]> = {

  // ══════════════════════════════════════════════════════════════════════
  // 11-XXXX — MANAGEMENT OCCUPATIONS
  // ══════════════════════════════════════════════════════════════════════

  '11-1011.00': [ // Chief Executives
    'gerente general', 'director general', 'ceo', 'chief executive officer',
    'presidente', 'presidenta', 'managing director', 'country manager',
    'director ejecutivo', 'directora ejecutiva', 'gerenta general',
  ],
  '11-1021.00': [ // General and Operations Managers
    'gerente de operaciones', 'operations manager', 'gerente operacional',
    'director de operaciones', 'coo', 'chief operating officer',
    'gerente de planta', 'plant manager', 'gerente de sucursal',
    'branch manager', 'gerente de tienda', 'store manager',
    'gerente regional', 'regional manager',
  ],
  '11-2021.00': [ // Marketing Managers
    'gerente de marketing', 'marketing manager', 'director de marketing',
    'cmo', 'chief marketing officer', 'gerente de mercadeo',
    'gerente de marca', 'brand manager', 'gerente de comunicaciones',
    'head of marketing', 'vp marketing',
  ],
  '11-2022.00': [ // Sales Managers
    'gerente de ventas', 'sales manager', 'director de ventas',
    'gerente comercial', 'director comercial', 'chief revenue officer',
    'head of sales', 'vp ventas', 'vp comercial',
    'gerente de negocios', 'business manager',
  ],
  '11-3011.00': [ // Administrative Services Managers
    'gerente de administracion', 'gerente administrativo', 'administration manager',
    'director administrativo', 'gerente de servicios generales',
    'facilities manager', 'office manager', 'gerente de oficina',
  ],
  '11-3021.00': [ // Computer and Information Systems Managers
    'gerente de tecnologia', 'gerente de ti', 'it manager',
    'cto', 'chief technology officer', 'director de tecnologia',
    'gerente de sistemas', 'gerente de informatica',
    'head of engineering', 'vp engineering', 'vp tecnologia',
    'director de ti', 'cio', 'chief information officer',
  ],
  '11-3031.00': [ // Financial Managers
    'gerente de finanzas', 'finance manager', 'director financiero',
    'cfo', 'chief financial officer', 'gerente financiero',
    'controller', 'contralor', 'gerente de contraloria',
    'head of finance', 'vp finanzas', 'director de finanzas',
  ],
  '11-3051.00': [ // Industrial Production Managers
    'gerente de produccion', 'production manager', 'gerente de manufactura',
    'manufacturing manager', 'jefe de planta', 'jefe de produccion',
    'director de manufactura', 'director de produccion',
  ],
  '11-3061.00': [ // Purchasing Managers
    'gerente de compras', 'purchasing manager', 'gerente de adquisiciones',
    'procurement manager', 'director de compras', 'head of procurement',
    'gerente de abastecimiento', 'supply chain manager',
    'gerente de cadena de suministro',
  ],
  '11-3071.00': [ // Transportation, Storage, and Distribution Managers
    'gerente de logistica', 'logistics manager', 'gerente de distribucion',
    'distribution manager', 'gerente de bodega', 'warehouse manager',
    'gerente de transporte', 'jefe de logistica', 'jefe de bodega',
    'director de logistica', 'head of logistics',
  ],
  '11-3111.00': [ // Compensation and Benefits Managers
    'gerente de compensaciones', 'compensation manager',
    'gerente de beneficios', 'benefits manager',
    'gerente de compensaciones y beneficios', 'total rewards manager',
    'jefe de remuneraciones',
  ],
  '11-3121.00': [ // Human Resources Managers
    'gerente de recursos humanos', 'hr manager', 'gerente rrhh',
    'gerente de personas', 'people manager', 'director de personas',
    'chief people officer', 'cpo', 'gerente de capital humano',
    'gerente de talento humano', 'gerente de gestion humana',
    'head of people', 'vp people', 'vp recursos humanos',
    'directora de personas', 'gerenta de personas',
  ],
  '11-3131.00': [ // Training and Development Managers
    'gerente de capacitacion', 'training manager',
    'gerente de desarrollo organizacional', 'gerente de formacion',
    'learning manager', 'head of learning', 'gerente de aprendizaje',
    'jefe de capacitacion', 'director de desarrollo',
  ],
  '11-9021.00': [ // Construction Managers
    'gerente de construccion', 'construction manager',
    'director de obras', 'jefe de obra', 'project manager construccion',
    'gerente de proyectos inmobiliarios',
  ],
  '11-9051.00': [ // Food Service Managers
    'gerente de restaurant', 'restaurant manager', 'gerente de local',
    'gerente de food service', 'jefe de cocina', 'gerente de alimentos',
    'gerente de casino', 'food service manager',
  ],
  '11-9111.00': [ // Medical and Health Services Managers
    'director medico', 'medical director', 'gerente de salud',
    'gerente de clinica', 'hospital administrator',
    'director de hospital', 'jefe de servicio clinico',
    'gerente de servicios de salud',
  ],
  '11-9198.00': [ // Personal Service Managers (Hotel, Travel, etc.)
    'gerente de hotel', 'hotel manager', 'gerente hotelero',
    'gerente de turismo', 'director de hotel', 'hospitality manager',
  ],
  '11-9199.00': [ // Managers, All Other
    'gerente de area', 'area manager', 'gerente de division',
    'division manager', 'gerente de unidad', 'business unit manager',
    'gerente de proyecto', 'jefe de departamento',
  ],

  // ══════════════════════════════════════════════════════════════════════
  // 13-XXXX — BUSINESS AND FINANCIAL OPERATIONS
  // ══════════════════════════════════════════════════════════════════════

  '13-1041.00': [ // Compliance Officers
    'oficial de cumplimiento', 'compliance officer', 'jefe de compliance',
    'encargado de cumplimiento', 'compliance manager',
    'auditor de cumplimiento', 'regulatory affairs',
  ],
  '13-1071.00': [ // Human Resources Specialists
    'analista de recursos humanos', 'hr specialist', 'analista rrhh',
    'especialista en recursos humanos', 'hr analyst', 'hr generalist',
    'generalista de rrhh', 'ejecutivo de personas',
    'analista de personas', 'people analyst',
    'analista de seleccion', 'recruiter', 'reclutador', 'reclutadora',
    'talent acquisition', 'ejecutivo de seleccion',
  ],
  '13-1075.00': [ // Labor Relations Specialists
    'especialista en relaciones laborales', 'labor relations specialist',
    'analista de relaciones laborales', 'encargado de relaciones laborales',
    'jefe de relaciones laborales',
  ],
  '13-1081.00': [ // Logisticians
    'analista de logistica', 'logistician', 'planificador de logistica',
    'analista de supply chain', 'supply chain analyst',
    'coordinador de logistica', 'planner logistica',
  ],
  '13-1111.00': [ // Management Analysts (Consultants)
    'analista de gestion', 'management analyst', 'consultor de gestion',
    'management consultant', 'business analyst', 'analista de negocios',
    'consultor empresarial', 'analista de procesos', 'process analyst',
    'consultor de procesos', 'analista de mejora continua',
  ],
  '13-1151.00': [ // Training and Development Specialists
    'analista de capacitacion', 'training specialist',
    'coordinador de capacitacion', 'especialista en formacion',
    'facilitador', 'instructor', 'capacitador',
    'learning specialist', 'instructional designer',
  ],
  '13-1161.00': [ // Market Research Analysts
    'analista de mercado', 'market research analyst',
    'investigador de mercado', 'analista de estudios',
    'market intelligence', 'consumer insights',
    'analista de inteligencia de mercado',
  ],
  '13-2011.00': [ // Accountants and Auditors
    'contador', 'contadora', 'accountant', 'auditor', 'auditora',
    'contador general', 'contador publico', 'analista contable',
    'encargado de contabilidad', 'jefe de contabilidad',
    'senior accountant', 'staff accountant',
  ],
  '13-2041.00': [ // Credit Analysts
    'analista de credito', 'credit analyst', 'analista de riesgo crediticio',
    'analista de cobranza', 'ejecutivo de credito',
    'evaluador de credito', 'risk analyst credito',
  ],
  '13-2051.00': [ // Financial and Investment Analysts
    'analista financiero', 'financial analyst', 'analista de inversiones',
    'investment analyst', 'fp&a analyst', 'analista fp&a',
    'analista de presupuesto', 'budget analyst',
    'analista de control de gestion', 'controller junior',
  ],
  '13-2052.00': [ // Personal Financial Advisors
    'asesor financiero', 'financial advisor', 'ejecutivo de inversiones',
    'wealth manager', 'private banker', 'banca privada',
    'planificador financiero', 'financial planner',
  ],
  '13-2072.00': [ // Loan Officers
    'ejecutivo de credito', 'loan officer', 'oficial de credito',
    'ejecutivo hipotecario', 'mortgage officer',
    'ejecutivo de prestamos', 'ejecutivo bancario creditos',
  ],
  '13-2082.00': [ // Tax Preparers / Tax Examiners
    'analista tributario', 'tax analyst', 'encargado de impuestos',
    'especialista tributario', 'asesor tributario', 'tax specialist',
    'contador tributario',
  ],

  // ══════════════════════════════════════════════════════════════════════
  // 15-XXXX — COMPUTER AND MATHEMATICAL
  // ══════════════════════════════════════════════════════════════════════

  '15-1211.00': [ // Computer Systems Analysts
    'analista de sistemas', 'systems analyst', 'analista de ti',
    'it analyst', 'analista de tecnologia', 'analista funcional',
    'functional analyst', 'business systems analyst',
  ],
  '15-1232.00': [ // Computer User Support Specialists
    'soporte tecnico', 'it support', 'help desk', 'mesa de ayuda',
    'tecnico de soporte', 'support specialist', 'desktop support',
    'soporte ti', 'soporte informatico', 'it helpdesk',
  ],
  '15-1241.00': [ // Computer Network Architects
    'arquitecto de redes', 'network architect', 'ingeniero de redes',
    'network engineer', 'especialista en redes', 'cloud architect',
    'arquitecto cloud', 'infrastructure architect',
  ],
  '15-1242.00': [ // Database Administrators
    'administrador de base de datos', 'dba', 'database administrator',
    'administrador bd', 'database engineer', 'ingeniero de datos',
  ],
  '15-1244.00': [ // Network and Computer Systems Administrators
    'administrador de sistemas', 'sysadmin', 'system administrator',
    'administrador de servidores', 'server administrator',
    'administrador de infraestructura', 'infrastructure admin',
    'administrador de redes', 'network administrator',
  ],
  '15-1251.00': [ // Computer Programmers
    'programador', 'programmer', 'developer', 'desarrollador',
    'programador de software', 'software programmer',
    'full stack developer', 'fullstack', 'backend developer',
    'frontend developer', 'web developer',
  ],
  '15-1252.00': [ // Software Developers
    'ingeniero de software', 'software engineer', 'software developer',
    'desarrollador de software', 'senior developer', 'tech lead',
    'lider tecnico', 'lead developer', 'staff engineer',
    'ingeniero de desarrollo', 'sr developer', 'sr engineer',
  ],
  '15-1253.00': [ // Software Quality Assurance Analysts
    'qa', 'quality assurance', 'tester', 'analista qa',
    'ingeniero de calidad de software', 'qa engineer', 'qa analyst',
    'automation tester', 'sdet', 'qa lead',
  ],
  '15-1254.00': [ // Web Developers
    'desarrollador web', 'web developer', 'frontend developer',
    'frontend', 'maquetador', 'desarrollador frontend',
    'react developer', 'angular developer', 'vue developer',
  ],
  '15-1255.00': [ // Web and Digital Interface Designers
    'disenador ux', 'ux designer', 'ui designer', 'ux/ui designer',
    'disenador de interfaces', 'product designer', 'disenador de producto',
    'disenador digital', 'digital designer',
  ],
  '15-1256.00': [ // Software Developers and Programmers, All Other
    'devops', 'devops engineer', 'ingeniero devops', 'sre',
    'site reliability engineer', 'platform engineer',
    'ingeniero de plataforma', 'cloud engineer', 'ingeniero cloud',
  ],
  '15-1299.00': [ // Computer Occupations, All Other
    'analista de datos', 'data analyst', 'especialista en datos',
    'data specialist', 'analista bi', 'bi analyst',
    'business intelligence analyst', 'tableau developer',
    'power bi developer', 'etl developer',
  ],
  '15-2031.00': [ // Operations Research Analysts
    'analista de investigacion operativa', 'operations research analyst',
    'analista de optimizacion', 'analista de operaciones',
  ],
  '15-2051.00': [ // Data Scientists
    'data scientist', 'cientifico de datos', 'machine learning engineer',
    'ml engineer', 'ingeniero de machine learning', 'ai engineer',
    'ingeniero de inteligencia artificial', 'data engineer',
    'ingeniero de datos',
  ],

  // ══════════════════════════════════════════════════════════════════════
  // 17-XXXX — ARCHITECTURE AND ENGINEERING
  // ══════════════════════════════════════════════════════════════════════

  '17-2051.00': [ // Civil Engineers
    'ingeniero civil', 'civil engineer', 'ingeniero de obras',
    'ingeniero estructural', 'structural engineer',
  ],
  '17-2071.00': [ // Electrical Engineers
    'ingeniero electrico', 'electrical engineer', 'ingeniero electronico',
    'electronic engineer', 'ingeniero en electricidad',
  ],
  '17-2112.00': [ // Industrial Engineers
    'ingeniero industrial', 'industrial engineer',
    'ingeniero de procesos', 'process engineer',
    'ingeniero de mejora continua', 'lean engineer',
    'ingeniero de metodos', 'ingeniero de produccion',
  ],
  '17-2141.00': [ // Mechanical Engineers
    'ingeniero mecanico', 'mechanical engineer',
    'ingeniero de mantenimiento', 'maintenance engineer',
  ],
  '17-2199.00': [ // Engineers, All Other
    'ingeniero de proyectos', 'project engineer',
    'ingeniero de calidad', 'quality engineer',
    'ingeniero ambiental', 'environmental engineer',
    'ingeniero de seguridad', 'safety engineer',
    'ingeniero en prevencion de riesgos', 'prevencionista',
  ],

  // ══════════════════════════════════════════════════════════════════════
  // 21-XXXX — COMMUNITY AND SOCIAL SERVICE
  // ══════════════════════════════════════════════════════════════════════

  '21-1012.00': [ // Educational, Guidance, and Career Counselors
    'orientador', 'counselor', 'consejero', 'psicologo educacional',
    'orientador vocacional', 'career counselor',
  ],
  '21-1023.00': [ // Mental Health and Substance Abuse Social Workers
    'trabajador social', 'social worker', 'asistente social',
  ],

  // ══════════════════════════════════════════════════════════════════════
  // 23-XXXX — LEGAL
  // ══════════════════════════════════════════════════════════════════════

  '23-1011.00': [ // Lawyers
    'abogado', 'abogada', 'lawyer', 'attorney', 'fiscal',
    'asesor legal', 'legal counsel', 'abogado senior',
    'abogado corporativo', 'corporate lawyer', 'in-house counsel',
    'jefe legal', 'director legal', 'gerente legal',
  ],
  '23-2011.00': [ // Paralegals and Legal Assistants
    'asistente legal', 'paralegal', 'legal assistant',
    'procurador', 'auxiliar legal', 'tecnico juridico',
    'analista legal',
  ],

  // ══════════════════════════════════════════════════════════════════════
  // 25-XXXX — EDUCATIONAL INSTRUCTION AND LIBRARY
  // ══════════════════════════════════════════════════════════════════════

  '25-1011.00': [ // Business Teachers, Postsecondary
    'profesor universitario', 'academico', 'docente universitario',
    'catedratico', 'investigador academico',
  ],
  '25-9031.00': [ // Instructional Designers and Technologists
    'disenador instruccional', 'instructional designer',
    'disenador de aprendizaje', 'learning designer',
    'especialista e-learning', 'elearning developer',
  ],

  // ══════════════════════════════════════════════════════════════════════
  // 27-XXXX — ARTS, DESIGN, ENTERTAINMENT
  // ══════════════════════════════════════════════════════════════════════

  '27-1024.00': [ // Graphic Designers
    'disenador grafico', 'graphic designer', 'disenador',
    'director de arte', 'art director', 'creative director',
    'director creativo',
  ],
  '27-3031.00': [ // Public Relations Specialists
    'relacionista publico', 'pr specialist', 'comunicador',
    'periodista corporativo', 'especialista en comunicaciones',
    'jefe de comunicaciones', 'corporate communications',
  ],
  '27-3042.00': [ // Technical Writers
    'redactor tecnico', 'technical writer', 'documentador',
    'content writer', 'redactor de contenidos', 'copywriter',
  ],

  // ══════════════════════════════════════════════════════════════════════
  // 29-XXXX — HEALTHCARE PRACTITIONERS
  // ══════════════════════════════════════════════════════════════════════

  '29-1141.00': [ // Registered Nurses
    'enfermera', 'enfermero', 'nurse', 'registered nurse',
    'enfermera clinica', 'enfermera jefe', 'nurse practitioner',
  ],
  '29-1171.00': [ // Nurse Practitioners
    'matrona', 'midwife', 'enfermera matrona',
    'nurse practitioner', 'enfermera especialista',
  ],
  '29-2018.00': [ // Clinical Laboratory Technologists
    'tecnologo medico', 'laboratorista', 'clinical lab technologist',
    'tecnico de laboratorio', 'lab technician',
  ],
  '29-2052.00': [ // Pharmacy Technicians
    'tecnico en farmacia', 'pharmacy technician', 'auxiliar de farmacia',
    'quimico farmaceutico', 'farmaceutico',
  ],
  '29-9021.00': [ // Health Information Technologists
    'informatico de salud', 'health informatics',
    'analista de informacion clinica', 'registros medicos',
    'codificador clinico',
  ],

  // ══════════════════════════════════════════════════════════════════════
  // 31-XXXX — HEALTHCARE SUPPORT
  // ══════════════════════════════════════════════════════════════════════

  '31-1131.00': [ // Nursing Assistants
    'tens', 'tecnico en enfermeria', 'nursing assistant',
    'auxiliar de enfermeria', 'cuidador',
  ],

  // ══════════════════════════════════════════════════════════════════════
  // 33-XXXX — PROTECTIVE SERVICE
  // ══════════════════════════════════════════════════════════════════════

  '33-9032.00': [ // Security Guards
    'guardia de seguridad', 'security guard', 'vigilante',
    'guardia', 'rondin', 'agente de seguridad',
    'jefe de seguridad fisica', 'security officer',
  ],

  // ══════════════════════════════════════════════════════════════════════
  // 35-XXXX — FOOD PREPARATION AND SERVING
  // ══════════════════════════════════════════════════════════════════════

  '35-1012.00': [ // First-Line Supervisors of Food Preparation
    'jefe de cocina', 'chef', 'chef ejecutivo', 'sous chef',
    'encargado de cocina', 'supervisor de alimentacion',
    'jefe de casino',
  ],

  // ══════════════════════════════════════════════════════════════════════
  // 37-XXXX — BUILDING AND GROUNDS CLEANING
  // ══════════════════════════════════════════════════════════════════════

  '37-1011.00': [ // First-Line Supervisors of Housekeeping
    'supervisor de aseo', 'housekeeping supervisor', 'jefe de aseo',
    'encargado de limpieza', 'facilities coordinator',
    'coordinador de servicios generales',
  ],

  // ══════════════════════════════════════════════════════════════════════
  // 41-XXXX — SALES AND RELATED
  // ══════════════════════════════════════════════════════════════════════

  '41-1012.00': [ // First-Line Supervisors of Non-Retail Sales Workers
    'supervisor de ventas', 'sales supervisor', 'jefe de ventas',
    'lider de ventas', 'team leader ventas', 'coordinador comercial',
    'jefe comercial',
  ],
  '41-2031.00': [ // Retail Salespersons
    'vendedor', 'vendedora', 'sales associate', 'retail salesperson',
    'ejecutivo de tienda', 'asesor de ventas', 'promotor de ventas',
    'dependiente',
  ],
  '41-3021.00': [ // Insurance Sales Agents
    'ejecutivo de seguros', 'insurance agent', 'corredor de seguros',
    'agente de seguros', 'asesor de seguros',
  ],
  '41-3031.00': [ // Securities and Financial Services Sales Agents
    'ejecutivo de inversiones', 'broker', 'trader',
    'ejecutivo de bolsa', 'agente de valores', 'corredor de bolsa',
    'financial sales', 'wealth advisor',
  ],
  '41-3091.00': [ // Sales Representatives, Services
    'ejecutivo de cuentas', 'account executive', 'ejecutivo comercial',
    'representante de ventas', 'sales representative',
    'key account manager', 'kam', 'ejecutivo de negocios',
    'business development representative', 'bdr', 'sdr',
    'sales development representative',
  ],
  '41-4012.00': [ // Sales Representatives, Wholesale and Manufacturing
    'representante de ventas industrial', 'vendedor tecnico',
    'ejecutivo de ventas b2b', 'sales representative wholesale',
    'vendedor mayorista', 'ejecutivo canal mayorista',
  ],
  '41-9031.00': [ // Sales Engineers
    'ingeniero de ventas', 'sales engineer', 'ingeniero comercial',
    'preventa', 'pre-sales engineer', 'solution engineer',
    'ingeniero de soluciones', 'consultor de ventas tecnico',
  ],

  // ══════════════════════════════════════════════════════════════════════
  // 43-XXXX — OFFICE AND ADMINISTRATIVE SUPPORT
  // ══════════════════════════════════════════════════════════════════════

  '43-1011.00': [ // First-Line Supervisors of Office Workers
    'supervisor administrativo', 'office supervisor',
    'jefe administrativo', 'coordinador administrativo',
    'encargado administrativo', 'jefe de oficina',
  ],
  '43-3011.00': [ // Bill and Account Collectors
    'ejecutivo de cobranza', 'collector', 'cobrador',
    'analista de cobranza', 'gestor de cobranza',
    'encargado de cuentas por cobrar',
  ],
  '43-3021.00': [ // Billing and Posting Clerks
    'encargado de facturacion', 'billing clerk', 'facturador',
    'analista de facturacion', 'billing specialist',
  ],
  '43-3031.00': [ // Bookkeeping, Accounting, and Auditing Clerks
    'asistente contable', 'bookkeeper', 'auxiliar contable',
    'tecnico contable', 'accounting clerk', 'data entry contable',
  ],
  '43-3051.00': [ // Payroll and Timekeeping Clerks
    'analista de remuneraciones', 'payroll specialist',
    'encargado de remuneraciones', 'payroll clerk',
    'analista de nomina', 'payroll analyst', 'nomina',
    'jefe de remuneraciones', 'payroll manager',
  ],
  '43-3061.00': [ // Procurement Clerks
    'asistente de compras', 'procurement clerk', 'auxiliar de compras',
    'analista de compras', 'comprador', 'buyer',
    'ejecutivo de compras', 'purchasing analyst',
  ],
  '43-4051.00': [ // Customer Service Representatives
    'ejecutivo de atencion al cliente', 'customer service representative',
    'agente de servicio al cliente', 'ejecutivo de servicio',
    'representante de servicio', 'customer care', 'call center agent',
    'telefonista', 'operador de call center', 'contact center agent',
    'ejecutivo de post venta', 'ejecutivo de postventa',
    'ejecutivo de reclamos', 'agente de contacto',
  ],
  '43-4111.00': [ // Interviewers
    'entrevistador', 'interviewer', 'encuestador',
    'ejecutivo de admision', 'analista de admision',
  ],
  '43-4161.00': [ // HR Assistants
    'asistente de rrhh', 'hr assistant', 'asistente de recursos humanos',
    'auxiliar de rrhh', 'hr coordinator', 'coordinador de rrhh',
    'asistente de personas', 'people coordinator',
  ],
  '43-4171.00': [ // Receptionists and Information Clerks
    'recepcionista', 'receptionist', 'front desk',
    'informaciones', 'atencion de publico',
  ],
  '43-5061.00': [ // Production, Planning, and Expediting Clerks
    'planificador de produccion', 'production planner',
    'programador de produccion', 'scheduler',
    'analista de planificacion', 'planner',
  ],
  '43-6011.00': [ // Executive Secretaries
    'secretaria ejecutiva', 'executive assistant', 'asistente ejecutiva',
    'asistente de gerencia', 'executive secretary',
    'asistente de directorio', 'secretaria de gerencia',
  ],
  '43-6014.00': [ // Secretaries and Administrative Assistants
    'secretaria', 'secretary', 'asistente administrativa',
    'administrative assistant', 'asistente de oficina',
    'asistente administrativo', 'auxiliar administrativo',
    'oficinista',
  ],
  '43-9061.00': [ // Office Clerks, General
    'auxiliar de oficina', 'office clerk', 'administrativo general',
    'back office', 'operador administrativo',
  ],

  // ══════════════════════════════════════════════════════════════════════
  // 47-XXXX — CONSTRUCTION AND EXTRACTION
  // ══════════════════════════════════════════════════════════════════════

  '47-1011.00': [ // First-Line Supervisors of Construction
    'supervisor de obra', 'construction supervisor', 'capataz',
    'jefe de obra', 'maestro de obra', 'foreman',
    'supervisor de construccion',
  ],

  // ══════════════════════════════════════════════════════════════════════
  // 49-XXXX — INSTALLATION, MAINTENANCE, AND REPAIR
  // ══════════════════════════════════════════════════════════════════════

  '49-1011.00': [ // First-Line Supervisors of Mechanics
    'supervisor de mantenimiento', 'maintenance supervisor',
    'jefe de mantenimiento', 'encargado de mantenimiento',
    'coordinador de mantenimiento',
  ],
  '49-2022.00': [ // Telecommunications Equipment Installers
    'tecnico en telecomunicaciones', 'telecom technician',
    'instalador de telecomunicaciones', 'tecnico de redes',
  ],
  '49-9071.00': [ // Maintenance and Repair Workers, General
    'tecnico de mantenimiento', 'maintenance technician',
    'operario de mantenimiento', 'mecanico industrial',
    'tecnico general', 'maintenance worker',
  ],

  // ══════════════════════════════════════════════════════════════════════
  // 51-XXXX — PRODUCTION
  // ══════════════════════════════════════════════════════════════════════

  '51-1011.00': [ // First-Line Supervisors of Production
    'supervisor de produccion', 'production supervisor',
    'jefe de linea', 'line supervisor', 'jefe de turno',
    'shift supervisor', 'supervisor de turno',
    'encargado de produccion',
  ],
  '51-9061.00': [ // Inspectors, Testers, Sorters, Samplers
    'inspector de calidad', 'quality inspector', 'controlador de calidad',
    'analista de calidad', 'qa inspector', 'quality control',
    'control de calidad',
  ],
  '51-9111.00': [ // Packaging and Filling Machine Operators
    'operador de maquinas', 'machine operator', 'operario de produccion',
    'operador de empaque', 'operario de linea',
  ],

  // ══════════════════════════════════════════════════════════════════════
  // 53-XXXX — TRANSPORTATION AND MATERIAL MOVING
  // ══════════════════════════════════════════════════════════════════════

  '53-1047.00': [ // First-Line Supervisors of Transportation
    'supervisor de transporte', 'transport supervisor',
    'jefe de flota', 'fleet manager', 'jefe de transporte',
    'coordinador de transporte', 'despachador',
  ],
  '53-3032.00': [ // Heavy and Tractor-Trailer Truck Drivers
    'conductor', 'chofer', 'driver', 'camionero', 'truck driver',
    'operador de camion', 'transportista',
  ],
  '53-7051.00': [ // Industrial Truck and Tractor Operators
    'operador de grua horquilla', 'forklift operator',
    'operador de montacarga', 'operador de bodega',
  ],
  '53-7062.00': [ // Laborers and Freight, Stock, and Material Movers
    'bodeguero', 'warehouse worker', 'auxiliar de bodega',
    'operario de bodega', 'peoneta', 'cargador',
    'auxiliar de despacho', 'repartidor',
  ],
}

// ════════════════════════════════════════════════════════════════════════════
// STRONG KEYWORDS — keywords "killer" que dan +10 puntos por SOC family
// Mismo patrón que DepartmentAdapter.strongKeywords
// ════════════════════════════════════════════════════════════════════════════

export const STRONG_KEYWORDS: Record<string, string[]> = {
  // SOC 11 — Management
  '11-1011.00': ['ceo', 'gerente general', 'director general', 'presidente'],
  '11-1021.00': ['coo', 'operaciones', 'planta', 'sucursal', 'tienda'],
  '11-2021.00': ['cmo', 'marketing', 'marca', 'branding'],
  '11-2022.00': ['ventas', 'sales', 'comercial', 'revenue'],
  '11-3021.00': ['cto', 'cio', 'tecnologia', 'sistemas', 'ti', 'it'],
  '11-3031.00': ['cfo', 'finanzas', 'financiero', 'controller'],
  '11-3121.00': ['rrhh', 'personas', 'people', 'capital humano'],

  // SOC 13 — Business
  '13-1041.00': ['compliance', 'cumplimiento', 'regulatorio'],
  '13-1071.00': ['reclutamiento', 'seleccion', 'recruitment', 'talent acquisition'],
  '13-2011.00': ['contador', 'contabilidad', 'auditor', 'accounting'],
  '13-2051.00': ['fp&a', 'presupuesto', 'control gestion'],

  // SOC 15 — Computer
  '15-1252.00': ['software', 'engineer', 'ingeniero', 'developer'],
  '15-1253.00': ['qa', 'testing', 'quality assurance', 'tester'],
  '15-1254.00': ['frontend', 'web', 'react', 'angular', 'vue'],
  '15-1255.00': ['ux', 'ui', 'disenador', 'product design'],
  '15-1256.00': ['devops', 'sre', 'cloud', 'platform'],
  '15-2051.00': ['data scientist', 'machine learning', 'ml', 'ai'],

  // SOC 23 — Legal
  '23-1011.00': ['abogado', 'abogada', 'legal', 'juridico', 'lawyer'],

  // SOC 41 — Sales
  '41-3091.00': ['ejecutivo', 'account', 'kam', 'bdr', 'sdr'],
  '41-9031.00': ['preventa', 'presales', 'sales engineer'],

  // SOC 43 — Office/Admin
  '43-3051.00': ['remuneraciones', 'payroll', 'nomina'],
  '43-4051.00': ['call center', 'contact center', 'atencion al cliente'],

  // SOC 51 — Production
  '51-1011.00': ['supervisor produccion', 'jefe linea', 'jefe turno'],
}

// ════════════════════════════════════════════════════════════════════════════
// CONTEXT HINTS — desambiguación por gerencia × nivel
// Cuando un cargo es ambiguo (ej: "analista"), el contexto de gerencia
// define qué SOC code es más probable.
// Key: standardCategory | Value: Record<acotadoGroup, SOC code>
// ════════════════════════════════════════════════════════════════════════════

export const CONTEXT_HINTS: Record<string, Record<string, string>> = {
  personas: {
    alta_gerencia:   '11-3121.00', // HR Managers
    mandos_medios:   '13-1151.00', // Training Specialists
    profesionales:   '13-1071.00', // HR Specialists
    base_operativa:  '43-4161.00', // HR Assistants
  },
  comercial: {
    alta_gerencia:   '11-2022.00', // Sales Managers
    mandos_medios:   '41-1012.00', // Sales Supervisors
    profesionales:   '41-3091.00', // Sales Representatives
    base_operativa:  '41-2031.00', // Retail Salespersons
  },
  marketing: {
    alta_gerencia:   '11-2021.00', // Marketing Managers
    mandos_medios:   '27-3031.00', // PR Specialists (as supervisor)
    profesionales:   '13-1161.00', // Market Research Analysts
    base_operativa:  '27-1024.00', // Graphic Designers
  },
  tecnologia: {
    alta_gerencia:   '11-3021.00', // IT Managers
    mandos_medios:   '15-1252.00', // Software Developers (senior/lead)
    profesionales:   '15-1251.00', // Programmers
    base_operativa:  '15-1232.00', // IT Support
  },
  operaciones: {
    alta_gerencia:   '11-1021.00', // Operations Managers
    mandos_medios:   '51-1011.00', // Production Supervisors
    profesionales:   '17-2112.00', // Industrial Engineers
    base_operativa:  '53-7062.00', // Material Movers
  },
  finanzas: {
    alta_gerencia:   '11-3031.00', // Financial Managers
    mandos_medios:   '13-2051.00', // Financial Analysts
    profesionales:   '13-2011.00', // Accountants
    base_operativa:  '43-3031.00', // Bookkeeping Clerks
  },
  servicio: {
    alta_gerencia:   '11-9199.00', // Managers, All Other
    mandos_medios:   '43-1011.00', // Office Supervisors
    profesionales:   '43-4051.00', // Customer Service Reps
    base_operativa:  '43-4171.00', // Receptionists
  },
  legal: {
    alta_gerencia:   '23-1011.00', // Lawyers (as director)
    mandos_medios:   '23-1011.00', // Lawyers (as jefe)
    profesionales:   '23-1011.00', // Lawyers
    base_operativa:  '23-2011.00', // Paralegals
  },
}

// ════════════════════════════════════════════════════════════════════════════
// SOC METADATA — títulos en español para display
// Se usa cuando se necesita mostrar el nombre de la ocupación al CEO
// ════════════════════════════════════════════════════════════════════════════

export const SOC_TITLES_ES: Record<string, string> = {
  '11-1011.00': 'Ejecutivos Principales',
  '11-1021.00': 'Gerentes de Operaciones',
  '11-2021.00': 'Gerentes de Marketing',
  '11-2022.00': 'Gerentes de Ventas',
  '11-3011.00': 'Gerentes Administrativos',
  '11-3021.00': 'Gerentes de Tecnología',
  '11-3031.00': 'Gerentes de Finanzas',
  '11-3051.00': 'Gerentes de Producción',
  '11-3061.00': 'Gerentes de Compras',
  '11-3071.00': 'Gerentes de Logística',
  '11-3111.00': 'Gerentes de Compensaciones',
  '11-3121.00': 'Gerentes de Recursos Humanos',
  '11-3131.00': 'Gerentes de Capacitación',
  '11-9021.00': 'Gerentes de Construcción',
  '11-9051.00': 'Gerentes de Restaurantes',
  '11-9111.00': 'Directores Médicos',
  '11-9198.00': 'Gerentes de Hotelería',
  '11-9199.00': 'Gerentes (Otros)',
  '13-1041.00': 'Oficiales de Cumplimiento',
  '13-1071.00': 'Especialistas en RRHH',
  '13-1075.00': 'Especialistas en Relaciones Laborales',
  '13-1081.00': 'Analistas de Logística',
  '13-1111.00': 'Analistas de Gestión',
  '13-1151.00': 'Especialistas en Capacitación',
  '13-1161.00': 'Analistas de Mercado',
  '13-2011.00': 'Contadores y Auditores',
  '13-2041.00': 'Analistas de Crédito',
  '13-2051.00': 'Analistas Financieros',
  '13-2052.00': 'Asesores Financieros',
  '13-2072.00': 'Ejecutivos de Crédito',
  '13-2082.00': 'Analistas Tributarios',
  '15-1211.00': 'Analistas de Sistemas',
  '15-1232.00': 'Soporte Técnico TI',
  '15-1241.00': 'Arquitectos de Redes',
  '15-1242.00': 'Administradores de Base de Datos',
  '15-1244.00': 'Administradores de Sistemas',
  '15-1251.00': 'Programadores',
  '15-1252.00': 'Ingenieros de Software',
  '15-1253.00': 'Analistas QA',
  '15-1254.00': 'Desarrolladores Web',
  '15-1255.00': 'Diseñadores UX/UI',
  '15-1256.00': 'Ingenieros DevOps',
  '15-1299.00': 'Analistas de Datos / BI',
  '15-2031.00': 'Analistas de Investigación Operativa',
  '15-2051.00': 'Científicos de Datos',
  '17-2051.00': 'Ingenieros Civiles',
  '17-2071.00': 'Ingenieros Eléctricos',
  '17-2112.00': 'Ingenieros Industriales',
  '17-2141.00': 'Ingenieros Mecánicos',
  '17-2199.00': 'Ingenieros (Otros)',
  '21-1012.00': 'Orientadores',
  '21-1023.00': 'Trabajadores Sociales',
  '23-1011.00': 'Abogados',
  '23-2011.00': 'Asistentes Legales',
  '25-1011.00': 'Profesores Universitarios',
  '25-9031.00': 'Diseñadores Instruccionales',
  '27-1024.00': 'Diseñadores Gráficos',
  '27-3031.00': 'Especialistas en Comunicaciones',
  '27-3042.00': 'Redactores Técnicos',
  '29-1141.00': 'Enfermeras',
  '29-1171.00': 'Matronas',
  '29-2018.00': 'Tecnólogos Médicos',
  '29-2052.00': 'Técnicos en Farmacia',
  '29-9021.00': 'Informáticos de Salud',
  '31-1131.00': 'Técnicos en Enfermería',
  '33-9032.00': 'Guardias de Seguridad',
  '35-1012.00': 'Jefes de Cocina',
  '37-1011.00': 'Supervisores de Aseo',
  '41-1012.00': 'Supervisores de Ventas',
  '41-2031.00': 'Vendedores',
  '41-3021.00': 'Ejecutivos de Seguros',
  '41-3031.00': 'Ejecutivos de Inversiones',
  '41-3091.00': 'Ejecutivos Comerciales',
  '41-4012.00': 'Representantes de Ventas Industriales',
  '41-9031.00': 'Ingenieros de Ventas',
  '43-1011.00': 'Supervisores Administrativos',
  '43-3011.00': 'Ejecutivos de Cobranza',
  '43-3021.00': 'Encargados de Facturación',
  '43-3031.00': 'Asistentes Contables',
  '43-3051.00': 'Analistas de Remuneraciones',
  '43-3061.00': 'Analistas de Compras',
  '43-4051.00': 'Ejecutivos de Atención al Cliente',
  '43-4111.00': 'Entrevistadores',
  '43-4161.00': 'Asistentes de RRHH',
  '43-4171.00': 'Recepcionistas',
  '43-5061.00': 'Planificadores de Producción',
  '43-6011.00': 'Secretarias Ejecutivas',
  '43-6014.00': 'Asistentes Administrativos',
  '43-9061.00': 'Auxiliares de Oficina',
  '47-1011.00': 'Supervisores de Obra',
  '49-1011.00': 'Supervisores de Mantenimiento',
  '49-2022.00': 'Técnicos en Telecomunicaciones',
  '49-9071.00': 'Técnicos de Mantenimiento',
  '51-1011.00': 'Supervisores de Producción',
  '51-9061.00': 'Inspectores de Calidad',
  '51-9111.00': 'Operadores de Máquinas',
  '53-1047.00': 'Supervisores de Transporte',
  '53-3032.00': 'Conductores',
  '53-7051.00': 'Operadores de Grúa Horquilla',
  '53-7062.00': 'Bodegueros',
}
