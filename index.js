import puppeteer from "puppeteer";
import express from "express";
import ejs from "ejs";
import bodyParser from "body-parser";

const app = express();

app.use(express.static("public"));

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: false }));

async function scrape(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);
  const data = await page.evaluate(() => {
    let list = document.querySelectorAll(".torrent-work-detail.no-top-radius");
    let final = Array.from(list).map((x) => x.innerText);
    function start(v) {
      if (v.length > 1500) {
        return true;
      }
    }
    let mediaInfo = final.filter(start);
    let title = document.querySelector("title").innerText.substring(9);
    let imageLinks = Array.from(document.querySelectorAll(".descrimg")).map(
      (x) => x.getAttribute("data-original")
    );
    let imageString = "[img]" + imageLinks.join("[/img][img]") + "[/img]";
    return {
      title: title,
      mediaInfo: mediaInfo,
      images: imageString,
    };
  });
  await browser.close();
  return data;
}

app.get("/", (req, res) => {
  res.render("main");
});

app.post("/data", async (req, res) => {
  const URL = req.body.pageUrl;
  const downLink = req.body.downloadLink;
  const data = await scrape(URL);

  let finalString = `
  [size=200][color=#8FBDD3][b]Screenshots[/b][/color][/size]
  [hr][/hr]
  ${data.images}
  [hr][/hr]
  [size=200][color=#8FBDD3][b]Media Info[/b][/color][/size]
  [hr][/hr]
  [code]
  ${data.mediaInfo}
  [/code]
  [hr][/hr]
  [size=100][color=#8FBDD3][b]Download Link[/b][/color][/size]
  [hr][/hr]
  [center]
  [b][color=#FF0000]MEGA[/color][/b][/center]
  [code]${downLink}[/code]
  `;
  res.render("data", {
    finalData: finalString,
    title: data.title,
  });
});

app.listen(3000, () => {
  console.log("The port started on 3000");
});
