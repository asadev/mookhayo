/**
 * SINGLE SOURCE OF TRUTH for all site content.
 *
 * Two halves, deliberately separated:
 *   SITE — structural facts (ids, dates, image paths, hrefs). Language-independent.
 *   COPY — every user-visible string, in en / ru / uz. Keyed by the ids in SITE.
 *
 * Rule: never hardcode a user-visible string in a component. If it renders, it lives here.
 * Rule: never invent a fact. Anything not supplied by the client is marked PENDING below.
 */

export const LANGS = ['en', 'ru', 'uz'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'en';

export const LANG_LABELS: Record<Lang, string> = {
  en: 'EN',
  ru: 'RU',
  uz: 'UZ',
};

/* ------------------------------------------------------------------ *
 * STRUCTURE — facts, not prose
 * ------------------------------------------------------------------ */

export type SectionId =
  | 'hero'
  | 'intro'
  | 'reel'
  | 'work'
  | 'disciplines'
  | 'journey'
  | 'certificates'
  | 'contact';

export type JourneyKind = 'education' | 'role';

export type JourneyEntry = {
  id: string;
  /** ISO-ish sort key, newest first when sorted descending */
  sort: number;
  kind: JourneyKind;
  /** Language-independent proper nouns */
  org: string;
  /** Optional external link for the organisation */
  href?: string;
};

export type Discipline = { id: string };

export type Certificate = {
  id: string;
  org: string;
  year: number;
  /** Path under /public, or null when the client has not supplied the scan yet */
  image: string | null;
  thumb: string | null;
  /** Certificate number where printed on the document */
  ref?: string;
  /** Date printed on the document, as printed */
  issued?: string;
};

/**
 * A single piece of portfolio work.
 * `poster` and `src` are paths under /public.
 * NOTE: intentionally empty — see WORK_STATUS. Do not populate with stock or placeholder
 * media; a videographer's gallery is only credible with her real footage.
 */
export type Project = {
  id: string;
  /** 'video' plays inline muted+looped; 'image' renders a still */
  kind: 'video' | 'image';
  src: string;
  poster?: string;
  /** Intrinsic aspect ratio, e.g. 9/16 for Reels, 16/9 for landscape */
  ratio: number;
  year: number;
  /** Category id — must exist in COPY[lang].work.categories */
  category: WorkCategory;
  client?: string;
};

export type WorkCategory =
  | 'real-estate'
  | 'commercial'
  | 'social'
  | 'education'
  | 'event';

export const WORK_CATEGORIES: WorkCategory[] = [
  'real-estate',
  'commercial',
  'social',
  'education',
  'event',
];

export const PROJECTS: Project[] = [];

/** Flips to false the moment real work lands in PROJECTS. Drives the awaiting-media state. */
export const WORK_STATUS = {
  awaitingMedia: PROJECTS.length === 0,
} as const;

/** Showreel. PENDING — client has not supplied a reel file or link. */
export const REEL: { src: string | null; poster: string | null; duration: string | null } = {
  src: null,
  poster: null,
  duration: null,
};

export const PORTRAIT = {
  full: '/media/portrait/muhayyo-859.webp',
  small: '/media/portrait/muhayyo-560.webp',
  blur: '/media/portrait/muhayyo-blur.webp',
  width: 859,
  height: 1831,
} as const;

export const JOURNEY: JourneyEntry[] = [
  { id: 'imza', sort: 202507, kind: 'role', org: 'Imza Premium Properties' },
  { id: 'goldvision', sort: 202503, kind: 'education', org: 'Gold Vision Group Academy' },
  { id: 'proacademy', sort: 202301, kind: 'role', org: 'Pro Academy School' },
  { id: 'rtm', sort: 202300, kind: 'education', org: 'RTM IT School' },
  { id: 'freelance', sort: 202200, kind: 'role', org: 'Freelance' },
  { id: 'pharmuni', sort: 202201, kind: 'role', org: 'Tashkent Pharmaceutical University' },
  { id: 'dig', sort: 202202, kind: 'education', org: 'DIG Mobilography Academy' },
];

export const DISCIPLINES: Discipline[] = [
  { id: 'videography' },
  { id: 'mobileography' },
  { id: 'editing' },
  { id: 'realestate' },
  { id: 'social' },
  { id: 'color' },
];

export const CERTIFICATES: Certificate[] = [
  {
    id: 'dig',
    org: 'DIG Mobilography Academy',
    year: 2022,
    issued: '13.11.2022',
    image: '/media/certificates/dig-mobilography-2022.webp',
    thumb: '/media/certificates/dig-mobilography-2022-thumb.webp',
  },
  {
    id: 'rtm',
    org: 'RTM — Raqamli Texnologiyalar Markazi',
    year: 2023,
    ref: '1537',
    issued: '01.08.2023',
    // PENDING: scan shown in chat but file not yet supplied
    image: null,
    thumb: null,
  },
  {
    id: 'goldvision',
    org: 'Gold Vision Group Academy',
    year: 2025,
    // PENDING: not yet supplied
    image: null,
    thumb: null,
  },
];

/**
 * Contact channels.
 * PENDING — the client has supplied no email, phone or social handles.
 * Every value here is null on purpose. Components must render a channel only when
 * its value is non-null, so nothing fake ever reaches the page.
 */
export const CONTACT = {
  email: null as string | null,
  phone: null as string | null,
  whatsapp: null as string | null,
  telegram: null as string | null,
  instagram: null as string | null,
  location: 'Dubai, UAE · Tashkent, Uzbekistan',
} as const;

export const SITE = {
  domain: 'mookhayo.com',
  url: 'https://mookhayo.com',
  mark: 'MOOKHAYO',
  yearsExperience: '4+',
  sections: ['hero', 'intro', 'reel', 'work', 'disciplines', 'journey', 'certificates', 'contact'] as SectionId[],
  /** Sections that appear in the nav rail (hero is the top, not a nav target) */
  navSections: ['reel', 'work', 'disciplines', 'journey', 'certificates', 'contact'] as SectionId[],
} as const;

/* ------------------------------------------------------------------ *
 * COPY — every visible string, three languages
 * ------------------------------------------------------------------ */

type JourneyCopy = { period: string; location: string; role: string; body: string };
type DisciplineCopy = { title: string; body: string };
type CertificateCopy = { qualification: string; location: string };

export type Copy = {
  meta: { title: string; description: string };
  a11y: { skipToContent: string; langSwitcher: string; menu: string; close: string; scrollHint: string };
  nav: Record<Exclude<SectionId, 'hero' | 'intro'>, string> & { index: string };
  hero: {
    name: string;
    roles: string[];
    tagline: string;
    based: string;
    experience: string;
    scroll: string;
    /** Alt text for the studio portrait — describes the photograph, not the page. */
    portraitAlt: string;
  };
  intro: { eyebrow: string; heading: string; body: string[] };
  reel: { eyebrow: string; heading: string; body: string; pending: string; play: string; pause: string };
  work: {
    eyebrow: string;
    heading: string;
    body: string;
    pending: { title: string; body: string };
    all: string;
    categories: Record<WorkCategory, string>;
  };
  disciplines: { eyebrow: string; heading: string; body: string; items: Record<string, DisciplineCopy> };
  journey: {
    eyebrow: string;
    heading: string;
    body: string;
    /** Slate label on the newest entry — it leads the timeline and says so */
    latest: string;
    kinds: Record<JourneyKind, string>;
    entries: Record<string, JourneyCopy>;
  };
  certificates: {
    eyebrow: string;
    heading: string;
    body: string;
    pending: string;
    view: string;
    ref: string;
    issued: string;
    items: Record<string, CertificateCopy>;
  };
  contact: {
    eyebrow: string;
    heading: string;
    body: string;
    pending: string;
    basedIn: string;
    channels: { email: string; phone: string; whatsapp: string; telegram: string; instagram: string };
  };
  footer: { rights: string; built: string; backToTop: string };
};

const en: Copy = {
  meta: {
    title: 'Mookhayo — Muhayyo Rahmatxonova · Videographer & Mobileographer',
    description:
      'Videographer, mobileographer and video editor with 4+ years creating commercial, real-estate and social content across Uzbekistan and the UAE.',
  },
  a11y: {
    skipToContent: 'Skip to content',
    langSwitcher: 'Change language',
    menu: 'Menu',
    close: 'Close',
    scrollHint: 'Scroll to continue',
  },
  nav: {
    index: 'Index',
    reel: 'Reel',
    work: 'Work',
    disciplines: 'Disciplines',
    journey: 'Journey',
    certificates: 'Certificates',
    contact: 'Contact',
  },
  hero: {
    name: 'Muhayyo Rahmatxonova',
    roles: ['Videographer', 'Mobileographer', 'Content Creator', 'Video Editor'],
    tagline: 'Light, motion, and the patience to wait for both.',
    based: 'Dubai · Tashkent',
    experience: '4+ years of visual content',
    scroll: 'Scroll',
    portraitAlt:
      'Muhayyo Rahmatxonova in a black suit, photographed against a dark studio backdrop lit by a warm rim light.',
  },
  intro: {
    eyebrow: 'Introduction',
    heading: 'The format changes. The standard does not.',
    body: [
      'I make video for commercial, educational and digital projects — shot on professional bodies and on phones, then cut and graded by the same hands that filmed it.',
      'Property tours in Dubai. Course content for a university in Tashkent. Reels for a school in Fergana. Freelance commercial work in between. Different budgets, different rooms, one standard.',
      'Four years in, the part I care about has not moved: find the light, hold the frame long enough to mean something, and cut nothing that earns its place.',
    ],
  },
  reel: {
    eyebrow: 'Showreel',
    heading: 'Sixty seconds, everything I do.',
    body: 'The fastest way to know whether we should work together.',
    pending: 'Reel arriving shortly.',
    play: 'Play reel',
    pause: 'Pause reel',
  },
  work: {
    eyebrow: 'Selected work',
    heading: 'Rooms, products, people.',
    body: 'Commercial, real-estate, education and social projects from Uzbekistan and the UAE.',
    pending: {
      title: 'Gallery in preparation',
      body: 'Selected projects are being cleared and prepared for publication. Nothing placeholder will appear here — only real work.',
    },
    all: 'All',
    categories: {
      'real-estate': 'Real estate',
      commercial: 'Commercial',
      social: 'Social',
      education: 'Education',
      event: 'Events',
    },
  },
  disciplines: {
    eyebrow: 'Expertise',
    heading: 'Six disciplines, one pair of hands.',
    body: 'Shot, edited and graded in-house — no handoffs, no drift between what was filmed and what is delivered.',
    items: {
      videography: {
        title: 'Videography',
        body: 'Commercial, lifestyle and real-estate shoots. Camera, light and composition handled end to end.',
      },
      mobileography: {
        title: 'Mobileography',
        body: 'Phone-shot photo and video built for social platforms — certified through DIG Academy in 2022, and still the fastest route from idea to posted.',
      },
      editing: {
        title: 'Video Editing',
        body: 'Short-form and commercial cuts. Reels, promos and social content assembled for pace, rhythm and retention.',
      },
      realestate: {
        title: 'Real Estate Content',
        body: 'Property tours, interiors and exteriors, and the lifestyle framing that makes a listing feel lived in rather than listed.',
      },
      social: {
        title: 'Social Media Content',
        body: 'Visual content for Instagram and digital platforms — planned as a set, shot as a set, delivered as a set.',
      },
      color: {
        title: 'Color Correction',
        body: 'Grading and finishing that holds a single visual identity across an entire body of work, not just the hero shot.',
      },
    },
  },
  journey: {
    eyebrow: 'Journey',
    heading: 'From a phone in Fergana to property films in Dubai.',
    body: 'Four years, two countries, and a deliberate route through every part of the craft.',
    latest: 'Most recent',
    kinds: { education: 'Training', role: 'Role' },
    entries: {
      imza: {
        period: 'Jul 2025 — Aug 2026',
        location: 'Dubai, UAE',
        role: 'Videographer · Content Creator · Video Editor',
        body: 'Real-estate content and digital media. Filming properties, interiors and exteriors; producing Reels and short-form video; promotional and lifestyle content; editing, colour correction, and the visual material used to market the portfolio.',
      },
      goldvision: {
        period: 'March 2025',
        location: 'Tashkent, Uzbekistan',
        role: 'Professional Videographer & Video Editor',
        body: 'Professional training in videography and video editing — camera and lighting, composition, edit craft and colour correction.',
      },
      proacademy: {
        period: '2023 — 2025',
        location: 'Fergana Region, Uzbekistan',
        role: 'Mobileographer · Content Creator · Social Media Manager',
        body: 'Photo and video content for the school’s social channels. Filming the teaching process and events, producing Reels and Stories, and running the visual side of the platforms.',
      },
      rtm: {
        period: '2023',
        location: 'Fergana Region, Uzbekistan',
        role: 'SMM Specialist',
        body: 'Professional training in social media marketing — content planning, digital content production, and the visual identity of social platforms.',
      },
      freelance: {
        period: '2022 — 2025',
        location: 'Uzbekistan',
        role: 'Independent projects',
        body: 'Individual and commercial work in mobile photography and videography: social content, Reels, short-form video, photography, event coverage and editing.',
      },
      pharmuni: {
        period: '2022 — 2023',
        location: 'Tashkent, Uzbekistan',
        role: 'Mobileographer / Content Creator',
        body: 'Photo and video content for the university’s education programmes — teaching materials, events, and visual content for academic projects.',
      },
      dig: {
        period: '2022',
        location: 'Tashkent, Uzbekistan',
        role: 'Mobileographer',
        body: 'Professional training in mobileography — mobile photo and video, composition, working with light, content production and the fundamentals of editing.',
      },
    },
  },
  certificates: {
    eyebrow: 'Credentials',
    heading: 'Trained, not self-taught.',
    body: 'Three professional programmes across mobileography, social media and videography.',
    pending: 'Certificate scan to follow.',
    view: 'View certificate',
    ref: 'Certificate no.',
    issued: 'Issued',
    items: {
      dig: { qualification: 'Mobileography', location: 'Tashkent, Uzbekistan' },
      rtm: { qualification: 'SMM Specialist', location: 'Fergana Region, Uzbekistan' },
      goldvision: {
        qualification: 'Professional Videographer & Video Editor',
        location: 'Tashkent, Uzbekistan',
      },
    },
  },
  contact: {
    eyebrow: 'Contact',
    heading: 'Tell me what you need filmed.',
    body: 'Commercial, property, education or social — send the brief, the dates and the city.',
    pending: 'Contact details coming shortly.',
    basedIn: 'Based in',
    channels: {
      email: 'Email',
      phone: 'Phone',
      whatsapp: 'WhatsApp',
      telegram: 'Telegram',
      instagram: 'Instagram',
    },
  },
  footer: {
    rights: 'All rights reserved.',
    built: 'Videographer · Mobileographer · Content Creator · Video Editor',
    backToTop: 'Back to top',
  },
};

const ru: Copy = {
  meta: {
    title: 'Mookhayo — Мухайё Рахматхонова · Видеограф и мобилограф',
    description:
      'Видеограф, мобилограф и видеомонтажёр с опытом 4+ года: коммерческий, недвижимость и social-контент в Узбекистане и ОАЭ.',
  },
  a11y: {
    skipToContent: 'Перейти к содержанию',
    langSwitcher: 'Сменить язык',
    menu: 'Меню',
    close: 'Закрыть',
    scrollHint: 'Прокрутите, чтобы продолжить',
  },
  nav: {
    index: 'Разделы',
    reel: 'Шоурил',
    work: 'Работы',
    disciplines: 'Направления',
    journey: 'Путь',
    certificates: 'Сертификаты',
    contact: 'Контакты',
  },
  hero: {
    name: 'Мухайё Рахматхонова',
    roles: ['Видеограф', 'Мобилограф', 'Контент-креатор', 'Видеомонтажёр'],
    tagline: 'Свет, движение и терпение дождаться и того, и другого.',
    based: 'Дубай · Ташкент',
    experience: '4+ года визуального контента',
    scroll: 'Вниз',
    portraitAlt:
      'Мухайё Рахматхонова в чёрном костюме на тёмном студийном фоне, освещённая тёплым контровым светом.',
  },
  intro: {
    eyebrow: 'О себе',
    heading: 'Меняется формат. Стандарт — нет.',
    body: [
      'Снимаю видео для коммерческих, образовательных и digital-проектов — на профессиональные камеры и на телефон, а монтирую и крашу тем же руками, которыми снимала.',
      'Туры по недвижимости в Дубае. Учебный контент для университета в Ташкенте. Reels для школы в Фергане. Между ними — фриланс и коммерция. Разные бюджеты, разные помещения, один стандарт.',
      'За четыре года главное не изменилось: найти свет, удержать кадр достаточно долго, чтобы он что-то значил, и не оставить в монтаже ничего лишнего.',
    ],
  },
  reel: {
    eyebrow: 'Шоурил',
    heading: 'Шестьдесят секунд — и всё, что я делаю.',
    body: 'Самый быстрый способ понять, стоит ли нам работать вместе.',
    pending: 'Шоурил скоро появится.',
    play: 'Смотреть шоурил',
    pause: 'Приостановить шоурил',
  },
  work: {
    eyebrow: 'Избранные работы',
    heading: 'Пространства, продукты, люди.',
    body: 'Коммерческие, real estate, образовательные и social-проекты из Узбекистана и ОАЭ.',
    pending: {
      title: 'Галерея готовится',
      body: 'Избранные проекты согласуются и готовятся к публикации. Здесь не будет заглушек — только реальные работы.',
    },
    all: 'Все',
    categories: {
      'real-estate': 'Недвижимость',
      commercial: 'Коммерция',
      social: 'Social',
      education: 'Образование',
      event: 'Мероприятия',
    },
  },
  disciplines: {
    eyebrow: 'Направления',
    heading: 'Шесть направлений, одни руки.',
    body: 'Съёмка, монтаж и цвет — внутри одного процесса, без передачи между людьми и без расхождения между тем, что снято, и тем, что сдано.',
    items: {
      videography: {
        title: 'Видеография',
        body: 'Коммерческая, lifestyle и real estate съёмка. Камера, свет и композиция — от начала до конца.',
      },
      mobileography: {
        title: 'Мобилография',
        body: 'Мобильная фото- и видеосъёмка для социальных платформ — сертификация DIG Academy, 2022. Самый быстрый путь от идеи до публикации.',
      },
      editing: {
        title: 'Видеомонтаж',
        body: 'Короткие и коммерческие ролики. Reels, промо и social-контент, собранные под темп, ритм и удержание.',
      },
      realestate: {
        title: 'Real Estate контент',
        body: 'Туры по объектам, интерьеры и экстерьеры, lifestyle-подача, после которой объект выглядит обжитым, а не выставленным.',
      },
      social: {
        title: 'Social Media контент',
        body: 'Визуальный контент для Instagram и digital-платформ — планируется, снимается и сдаётся комплектом.',
      },
      color: {
        title: 'Цветокоррекция',
        body: 'Обработка и грейд, которые держат единый визуальный стиль на всём объёме работ, а не только на главном кадре.',
      },
    },
  },
  journey: {
    eyebrow: 'Путь',
    heading: 'От телефона в Фергане до съёмок недвижимости в Дубае.',
    body: 'Четыре года, две страны и осознанный маршрут через все части профессии.',
    latest: 'Последнее',
    kinds: { education: 'Обучение', role: 'Работа' },
    entries: {
      imza: {
        period: 'Июль 2025 — Август 2026',
        location: 'Дубай, ОАЭ',
        role: 'Видеограф · Контент-креатор · Видеомонтажёр',
        body: 'Real estate контент и digital media. Съёмка объектов, интерьеров и экстерьеров; Reels и short-form video; promotional и lifestyle контент; монтаж, цветокоррекция и визуальные материалы для продвижения недвижимости.',
      },
      goldvision: {
        period: 'Март 2025',
        location: 'Ташкент, Узбекистан',
        role: 'Professional Videographer & Video Editor',
        body: 'Профессиональное обучение по видеосъёмке и монтажу — работа с камерой и светом, композиция, монтаж и цветокоррекция.',
      },
      proacademy: {
        period: '2023 — 2025',
        location: 'Ферганская область, Узбекистан',
        role: 'Мобилограф · Контент-креатор · SMM-менеджер',
        body: 'Фото- и видеоконтент для социальных сетей школы. Съёмка образовательного процесса и мероприятий, Reels и Stories, ведение визуальной части платформ.',
      },
      rtm: {
        period: '2023',
        location: 'Ферганская область, Узбекистан',
        role: 'SMM-специалист',
        body: 'Профессиональное обучение по SMM — контент-планирование, создание digital-контента и визуальное оформление социальных платформ.',
      },
      freelance: {
        period: '2022 — 2025',
        location: 'Узбекистан',
        role: 'Независимые проекты',
        body: 'Индивидуальные и коммерческие работы в мобильной фотографии и видеографии: social-контент, Reels, short-form video, фотосъёмка, съёмка мероприятий и монтаж.',
      },
      pharmuni: {
        period: '2022 — 2023',
        location: 'Ташкент, Узбекистан',
        role: 'Мобилограф / Контент-креатор',
        body: 'Фото- и видеоконтент для образовательных программ университета — учебные материалы, мероприятия и визуальный контент для академических проектов.',
      },
      dig: {
        period: '2022',
        location: 'Ташкент, Узбекистан',
        role: 'Мобилограф',
        body: 'Профессиональное обучение по мобилографии — мобильная фото- и видеосъёмка, композиция, работа со светом, создание контента и основы монтажа.',
      },
    },
  },
  certificates: {
    eyebrow: 'Квалификация',
    heading: 'Обучена, а не самоучка.',
    body: 'Три профессиональные программы: мобилография, SMM и видеография.',
    pending: 'Скан сертификата будет добавлен.',
    view: 'Смотреть сертификат',
    ref: 'Сертификат №',
    issued: 'Выдан',
    items: {
      dig: { qualification: 'Мобилография', location: 'Ташкент, Узбекистан' },
      rtm: { qualification: 'SMM-специалист', location: 'Ферганская область, Узбекистан' },
      goldvision: {
        qualification: 'Professional Videographer & Video Editor',
        location: 'Ташкент, Узбекистан',
      },
    },
  },
  contact: {
    eyebrow: 'Контакты',
    heading: 'Расскажите, что нужно снять.',
    body: 'Коммерция, недвижимость, образование или social — пришлите бриф, даты и город.',
    pending: 'Контактные данные будут добавлены.',
    basedIn: 'Локация',
    channels: {
      email: 'Email',
      phone: 'Телефон',
      whatsapp: 'WhatsApp',
      telegram: 'Telegram',
      instagram: 'Instagram',
    },
  },
  footer: {
    rights: 'Все права защищены.',
    built: 'Видеограф · Мобилограф · Контент-креатор · Видеомонтажёр',
    backToTop: 'Наверх',
  },
};

const uz: Copy = {
  meta: {
    title: 'Mookhayo — Muhayyo Raxmatxonova · Videograf va mobilograf',
    description:
      'Videograf, mobilograf va video montajchi. 4+ yillik tajriba: tijoriy, koʻchmas mulk va ijtimoiy tarmoqlar uchun kontent — Oʻzbekiston va BAA.',
  },
  a11y: {
    skipToContent: 'Asosiy qismga oʻtish',
    langSwitcher: 'Tilni oʻzgartirish',
    menu: 'Menyu',
    close: 'Yopish',
    scrollHint: 'Davom etish uchun pastga suring',
  },
  nav: {
    index: 'Boʻlimlar',
    reel: 'Shourил',
    work: 'Ishlar',
    disciplines: 'Yoʻnalishlar',
    journey: 'Yoʻl',
    certificates: 'Sertifikatlar',
    contact: 'Aloqa',
  },
  hero: {
    name: 'Muhayyo Raxmatxonova',
    roles: ['Videograf', 'Mobilograf', 'Kontent-kreator', 'Video montajchi'],
    tagline: 'Yorugʻlik, harakat va ikkalasini kutishga sabr.',
    based: 'Dubay · Toshkent',
    experience: '4+ yillik vizual kontent tajribasi',
    scroll: 'Pastga',
    portraitAlt:
      'Muhayyo Raxmatxonova qora kostyumda, toʻq studiya foni oldida, iliq kontur yorugʻlik bilan yoritilgan.',
  },
  intro: {
    eyebrow: 'Men haqimda',
    heading: 'Format oʻzgaradi. Daraja — yoʻq.',
    body: [
      'Tijoriy, taʼlimiy va digital loyihalar uchun video suratga olaman — professional kamerada ham, telefonda ham. Montaj va rang korreksiyasini ham oʻzim qilaman.',
      'Dubayda koʻchmas mulk turlari. Toshkentdagi universitet uchun oʻquv kontenti. Fargʻonadagi maktab uchun Reels. Orasida — frilans va tijorat ishlari. Byudjetlar har xil, xonalar har xil, daraja bitta.',
      'Toʻrt yildan keyin ham asosiysi oʻzgargani yoʻq: yorugʻlikni topish, kadrni maʼno paydo boʻlguncha ushlab turish va montajda ortiqcha hech narsa qoldirmaslik.',
    ],
  },
  reel: {
    eyebrow: 'Shouril',
    heading: 'Oltmish soniya — men qiladigan hamma narsa.',
    body: 'Birga ishlashimiz kerakmi yoʻqmi — buni bilishning eng tez yoʻli.',
    pending: 'Shouril tez orada qoʻshiladi.',
    play: 'Shourilni koʻrish',
    pause: 'Shourilni toʻxtatib turish',
  },
  work: {
    eyebrow: 'Tanlangan ishlar',
    heading: 'Makonlar, mahsulotlar, odamlar.',
    body: 'Oʻzbekiston va BAAdagi tijoriy, koʻchmas mulk, taʼlimiy va ijtimoiy loyihalar.',
    pending: {
      title: 'Galereya tayyorlanmoqda',
      body: 'Tanlangan loyihalar kelishilmoqda va nashrga tayyorlanmoqda. Bu yerda vaqtinchalik oʻrindoshlar boʻlmaydi — faqat haqiqiy ishlar.',
    },
    all: 'Barchasi',
    categories: {
      'real-estate': 'Koʻchmas mulk',
      commercial: 'Tijorat',
      social: 'Ijtimoiy tarmoqlar',
      education: 'Taʼlim',
      event: 'Tadbirlar',
    },
  },
  disciplines: {
    eyebrow: 'Yoʻnalishlar',
    heading: 'Olti yoʻnalish, bitta juft qoʻl.',
    body: 'Suratga olish, montaj va rang — bitta jarayon ichida. Qoʻldan qoʻlga oʻtish yoʻq, olingan va topshirilgan material orasida farq ham yoʻq.',
    items: {
      videography: {
        title: 'Videografiya',
        body: 'Tijoriy, lifestyle va koʻchmas mulk suratga olish. Kamera, yorugʻlik va kompozitsiya — boshidan oxirigacha.',
      },
      mobileography: {
        title: 'Mobilografiya',
        body: 'Ijtimoiy platformalar uchun mobil foto va video — 2022-yilda DIG Academy sertifikati. Gʻoyadan nashrgacha eng tez yoʻl.',
      },
      editing: {
        title: 'Video montaj',
        body: 'Qisqa va tijoriy roliklar. Reels, promo va social kontent — sur’at, ritm va ushlab turishga moslab yigʻiladi.',
      },
      realestate: {
        title: 'Koʻchmas mulk kontenti',
        body: 'Obyekt turlari, interyer va eksteryer, hamda obyektni sotuvga qoʻyilgandek emas, yashaladigan joydek koʻrsatadigan lifestyle podacha.',
      },
      social: {
        title: 'Ijtimoiy tarmoqlar kontenti',
        body: 'Instagram va digital platformalar uchun vizual kontent — toʻplam sifatida rejalashtiriladi, olinadi va topshiriladi.',
      },
      color: {
        title: 'Rang korreksiyasi',
        body: 'Faqat asosiy kadrda emas, butun ish hajmida yagona vizual uslubni ushlab turadigan qayta ishlash va greyd.',
      },
    },
  },
  journey: {
    eyebrow: 'Yoʻl',
    heading: 'Fargʻonadagi telefondan Dubaydagi koʻchmas mulk suratga olishgacha.',
    body: 'Toʻrt yil, ikki mamlakat va kasbning har bir qismidan ongli ravishda oʻtilgan yoʻl.',
    latest: 'Eng soʻnggi',
    kinds: { education: 'Taʼlim', role: 'Ish' },
    entries: {
      imza: {
        period: 'Iyul 2025 — Avgust 2026',
        location: 'Dubay, BAA',
        role: 'Videograf · Kontent-kreator · Video montajchi',
        body: 'Koʻchmas mulk kontenti va digital media. Obyektlar, interyer va eksteryerlarni suratga olish; Reels va short-form videolar; promotional va lifestyle kontent; montaj, rang korreksiyasi va koʻchmas mulkni targʻib qilish uchun vizual materiallar.',
      },
      goldvision: {
        period: 'Mart 2025',
        location: 'Toshkent, Oʻzbekiston',
        role: 'Professional Videographer & Video Editor',
        body: 'Videografiya va video montaj boʻyicha professional taʼlim — kamera va yorugʻlik bilan ishlash, kompozitsiya, montaj va rang korreksiyasi.',
      },
      proacademy: {
        period: '2023 — 2025',
        location: 'Fargʻona viloyati, Oʻzbekiston',
        role: 'Mobilograf · Kontent-kreator · SMM menejer',
        body: 'Maktabning ijtimoiy tarmoqlari uchun foto va videokontent. Taʼlim jarayoni va tadbirlarni suratga olish, Reels va Stories tayyorlash, platformalarning vizual qismini yuritish.',
      },
      rtm: {
        period: '2023',
        location: 'Fargʻona viloyati, Oʻzbekiston',
        role: 'SMM mutaxassisi',
        body: 'SMM yoʻnalishi boʻyicha professional taʼlim — kontent-rejalashtirish, digital kontent yaratish va ijtimoiy platformalarning vizual koʻrinishi.',
      },
      freelance: {
        period: '2022 — 2025',
        location: 'Oʻzbekiston',
        role: 'Mustaqil loyihalar',
        body: 'Mobil fotografiya va videografiya boʻyicha individual va tijoriy ishlar: social kontent, Reels, short-form video, fotosuratga olish, tadbirlar va montaj.',
      },
      pharmuni: {
        period: '2022 — 2023',
        location: 'Toshkent, Oʻzbekiston',
        role: 'Mobilograf / Kontent-kreator',
        body: 'Universitetning taʼlim dasturlari uchun foto va videokontent — oʻquv materiallari, tadbirlar va akademik loyihalar uchun vizual kontent.',
      },
      dig: {
        period: '2022',
        location: 'Toshkent, Oʻzbekiston',
        role: 'Mobilograf',
        body: 'Mobilografiya boʻyicha professional taʼlim — mobil foto va videotasvirga olish, kompozitsiya, yorugʻlik bilan ishlash, kontent yaratish va montaj asoslari.',
      },
    },
  },
  certificates: {
    eyebrow: 'Malaka',
    heading: 'Oʻqigan, oʻz-oʻzidan emas.',
    body: 'Uchta professional dastur: mobilografiya, SMM va videografiya.',
    pending: 'Sertifikat nusxasi keyinroq qoʻshiladi.',
    view: 'Sertifikatni koʻrish',
    ref: 'Sertifikat №',
    issued: 'Berilgan sana',
    items: {
      dig: { qualification: 'Mobilografiya', location: 'Toshkent, Oʻzbekiston' },
      rtm: { qualification: 'SMM mutaxassisi', location: 'Fargʻona viloyati, Oʻzbekiston' },
      goldvision: {
        qualification: 'Professional Videographer & Video Editor',
        location: 'Toshkent, Oʻzbekiston',
      },
    },
  },
  contact: {
    eyebrow: 'Aloqa',
    heading: 'Nima suratga olish kerakligini ayting.',
    body: 'Tijorat, koʻchmas mulk, taʼlim yoki social — brif, sanalar va shaharni yuboring.',
    pending: 'Aloqa maʼlumotlari tez orada qoʻshiladi.',
    basedIn: 'Joylashuv',
    channels: {
      email: 'Email',
      phone: 'Telefon',
      whatsapp: 'WhatsApp',
      telegram: 'Telegram',
      instagram: 'Instagram',
    },
  },
  footer: {
    rights: 'Barcha huquqlar himoyalangan.',
    built: 'Videograf · Mobilograf · Kontent-kreator · Video montajchi',
    backToTop: 'Yuqoriga',
  },
};

export const COPY: Record<Lang, Copy> = { en, ru, uz };

export function getCopy(lang: Lang): Copy {
  return COPY[lang] ?? COPY[DEFAULT_LANG];
}
