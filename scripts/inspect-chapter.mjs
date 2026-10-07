import * as cheerio from "cheerio";

async function inspectChapter() {
  const url = "https://bacakomik.my/one-piece-ace-story-chapter-4-end/";
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/133.0.0.0 Safari/537.36",
      "Referer": "https://bacakomik.my/",
    },
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  console.log("HTML length:", html.length);
  console.log("#chimg exists:", $("#chimg").length);
  console.log("#chimg-thumbs exists:", $("#chimg-thumbs").length);
  console.log(".reader-area exists:", $(".reader-area").length);
  console.log("#readerarea exists:", $("#readerarea").length);
  
  // Find all img tags and their parent containers
  $("img").each((i, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src") || $(el).attr("data-lazy-src");
    const parentClass = $(el).parent().attr("class") || $(el).parent().prop("tagName");
    const id = $(el).attr("id") || "";
    const parentId = $(el).parent().attr("id") || "";
    console.log(`img [${i}]: parent=<${parentClass} id="${parentId}"> src=${src?.substring(0, 80)}`);
  });

  // Check script tags for any JSON / images array
  $("script").each((i, el) => {
    const text = $(el).html() || "";
    if (text.includes(".jpg") || text.includes(".png") || text.includes(".webp") || text.includes("images") || text.includes("ts_reader")) {
      console.log(`Found image in script [${i}]:`, text.substring(0, 300));
    }
  });
}

inspectChapter();
