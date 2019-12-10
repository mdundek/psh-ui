import en from "./en.json";

const langs = {
  en
};

export default function (lang = "en") {
  return langs[lang];
};