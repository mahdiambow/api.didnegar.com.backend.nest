/** لینک یا دامنهٔ وب در متن */
const LINK_PATTERN =
  /(?:https?:\/\/|www\.)|[\w.-]+\.(?:com|ir|net|org|io|co|info|me|tv)\b/i;

/** موبایل ایران: 09xxxxxxxxx یا +989xxxxxxxxx */
const MOBILE_PATTERN = /(?:\+98|0098|0)?9\d{9}/;

/** تلفن ثابت تقریبی: 0 + کد شهر + شماره */
const LANDLINE_PATTERN = /(?:\+98|0098)?0(?:21|26|25|31|41|51|61|71|81|11|13|17|34|35|38|44|45|54|56|58|61|66|74|76|77|83|84|86|87)\d{7,8}/;

export function assertReviewContentClean(content: string): string | null {
  const text = content.trim();
  if (LINK_PATTERN.test(text)) {
    return 'لینک در متن نظر مجاز نیست';
  }
  if (MOBILE_PATTERN.test(text.replace(/[\s\-]/g, ''))) {
    return 'شماره همراه در متن نظر مجاز نیست';
  }
  if (LANDLINE_PATTERN.test(text.replace(/[\s\-]/g, ''))) {
    return 'شماره تلفن ثابت در متن نظر مجاز نیست';
  }
  return null;
}
