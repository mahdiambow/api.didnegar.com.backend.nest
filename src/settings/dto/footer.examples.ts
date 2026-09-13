/** نمونه داده فوتر برای Swagger و سید لوکال */
export const FOOTER_MENU_LINKS_EXAMPLE = [
  {
    title: 'خدمات',
    url: '/services',
    subMenu: [
      { title: 'گارانتی', url: '/services/warranty' },
      { title: 'پشتیبانی', url: '/services/support' },
      { title: 'تعمیرات', url: '/services/repair' },
    ],
  },
  {
    title: 'خرید',
    url: '/shop',
    subMenu: [
      { title: 'دوربین', url: '/shop/cameras' },
      { title: 'لنز', url: '/shop/lenses' },
      { title: 'لوازم جانبی', url: '/shop/accessories' },
    ],
  },
  {
    title: 'درباره ما',
    url: '/about',
    subMenu: [
      { title: 'تماس با ما', url: '/contact' },
      { title: 'قوانین', url: '/terms' },
    ],
  },
  {
    title: 'وبلاگ',
    url: '/blog',
    subMenu: [],
  },
] as const;

export const FOOTER_ENAMAD_URLS_EXAMPLE = [
  'https://trustseal.enamad.ir/?id=123456&Code=AAAA',
  'https://logo.samandehi.ir/logo.aspx?id=111111',
  'https://ecunion.ir/verify/didnegar.com?token=222222',
  'https://www.zarinpal.com/trustPage/didnegar.com',
] as const;

export const FOOTER_ABOUT_US_EXAMPLE = {
  title: 'درباره دیدنگار',
  text: 'دیدنگار فروشگاه تخصصی تجهیزات عکاسی و فیلمبرداری است؛ از دوربین و لنز تا نورپردازی و لوازم جانبی، با پشتیبانی تخصصی همراه شماییم.',
} as const;

export const FOOTER_EXAMPLE = {
  logoUrl: 'https://cdn.didnegar.com/media/branding/didnegar-logo.svg',
  logoText: 'دیدنگار',
  menuLinks: FOOTER_MENU_LINKS_EXAMPLE,
  enamadUrls: FOOTER_ENAMAD_URLS_EXAMPLE,
  aboutUs: FOOTER_ABOUT_US_EXAMPLE,
  address: 'تهران، خیابان جمهوری، پلاک ۱۲۰',
  phoneNumber: '02191001234',
  email: 'info@didnegar.com',
  workingHours: 'شنبه تا پنجشنبه، ۹ تا ۱۸',
  instagram: 'https://instagram.com/didnegar',
  whatsapp: 'https://wa.me/989121234567',
  telegram: 'https://t.me/didnegar',
  bale: 'https://ble.ir/didnegar',
  rubika: 'https://rubika.ir/didnegar',
} as const;

export const FOOTER_RESPONSE_EXAMPLE = {
  id: 1,
  ...FOOTER_EXAMPLE,
  createdAt: '2026-09-06T12:18:52.435Z',
  updatedAt: '2026-09-13T10:00:00.000Z',
} as const;
