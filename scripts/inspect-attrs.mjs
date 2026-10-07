import * as cheerio from "cheerio";

async function inspectImgAttrs() {
  const url = "https://bacakomik.my/one-piece-ace-story-chapter-4-end/";
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/133.0.0.0 Safari/537.36",
      "Referer": "https://bacakomik.my/",
    },
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  const container = $("#anjay_ini_id_kh");
  console.log("Found container #anjay_ini_id_kh:", container.length);
  const imgs = container.find("img");
  console.log("Images inside #anjay_ini_id_kh:", imgs.length);

  if (imgs.length > 0) {
    const first = imgs.first();
    console.log("First img attributes:", first.attr());
  }

  // Also check popular page url on bacakomik
  const popUrls = [
    "https://bacakomik.my/daftar-manga/?order=popular",
    "https://bacakomik.my/komik-populer/",
    "https://bacakomik.my/hot/",
  ];

  for (const pu of popUrls) {
    const pr = await fetch(pu, { headers: { "Referer": "https://bacakomik.my/" } });
    console.log(`URL ${pu} status:`, pr.status);
  }
}

inspectImgAttrs();
