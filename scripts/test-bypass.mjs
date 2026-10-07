const testImgUrl = 'https://imageainewgeneration.lol/data/35777737/4 End/cd0fb2ff157a4baa70adc5fe9f5cb986/ADx6jBpty3okMqiAUxuKKvOPKbIeyAEK0MuXdn8Q.jpg';

async function testFetch() {
  console.log("1. Fetching WITHOUT Referer header (Normal browser/hotlink):");
  try {
    const resNoReferer = await fetch(testImgUrl);
    console.log("Status:", resNoReferer.status, resNoReferer.statusText);
  } catch (e) {
    console.log("Error:", e.message);
  }

  console.log("\n2. Fetching WITH Referer: https://bacakomik.my/ (Our Proxy):");
  try {
    const resWithReferer = await fetch(testImgUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/133.0.0.0 Safari/537.36",
        "Referer": "https://bacakomik.my/",
      },
    });
    console.log("Status:", resWithReferer.status, resWithReferer.statusText);
    console.log("Content-Type:", resWithReferer.headers.get("content-type"));
    console.log("Content-Length:", resWithReferer.headers.get("content-length"));
  } catch (e) {
    console.log("Error:", e.message);
  }
}

testFetch();
