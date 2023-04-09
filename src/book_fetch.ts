import { DOMParser } from "deno_dom";
import dayjs from "npm:dayjs@1.11.7";
import {  getNextValidContent } from "./utils.ts";
import { DB_PROPERTIES } from "./constants.ts";
import { BookItem } from "./type.ts";

export async function htmlParser(link?: string) {
  if (!link) return;
  const data: BookItem = {};
  const response = await (await fetch(link)).text();
  const dom = new DOMParser().parseFromString(response, "text/html")!;

  data[DB_PROPERTIES.书名] = dom
    .querySelector('#wrapper > h1 > [property="v:itemreviewed"]')
    ?.textContent.trim();
  data[DB_PROPERTIES.封面] = dom
    .querySelector("#mainpic > a")
    ?.getAttribute("href")
    ?.replace(/\.webp$/, ".jpg");

  const infoContents = dom.querySelectorAll("#info .pl");

  for (const content of infoContents) {
    const text = content.textContent.trim();
    const parentNode = content.parentElement;
    if (parentNode?.id !== "info") {
      if (text.startsWith(DB_PROPERTIES.作者)) {
        data[DB_PROPERTIES.作者] = parentNode?.textContent.replace(
          "作者:",
          "",
        ).trim()
          .replace(/\n/g, "").replace(/\s/g, "");
      }

      if (text.startsWith(DB_PROPERTIES.译者)) {
        data[DB_PROPERTIES.译者] = parentNode?.textContent.replace(
          "译者:",
          "",
        ).trim()
          .replace(/\n/g, "").replace(/\s/g, "");
      }
      continue;
    }
    if (text.startsWith(DB_PROPERTIES.出版社)) {
      data[DB_PROPERTIES.出版社] = getNextValidContent(content)?.textContent
        .trim();
      continue;
    }

    if (text.startsWith("副书名")) {
      data[DB_PROPERTIES.书名] += `_${
        getNextValidContent(content)?.textContent.trim()
      }`;
      continue;
    }

    if (text.startsWith("原作名")) {
      data[DB_PROPERTIES.书名] += `_[${
        getNextValidContent(content)?.textContent.trim()
      }]`;
      continue;
    }

    if (text.startsWith("出版年")) {
      let nextText = getNextValidContent(content)?.textContent.trim() || "";
      if (/年|月|日/.test(nextText)) {
        nextText = nextText.replace(/年|月|日/g, "-").slice(0, -1);
      }
      data[DB_PROPERTIES.出版日期] = dayjs(nextText).format(
        "YYYY-MM-DD",
      );
      continue;
    }

    if (text.startsWith(DB_PROPERTIES.ISBN)) {
      data[DB_PROPERTIES.ISBN] = getNextValidContent(content)?.textContent
        .trim();
      continue;
    }

    if (text.startsWith(DB_PROPERTIES.丛书)) {
      data[DB_PROPERTIES.丛书] = getNextValidContent(content)?.textContent
        .trim();
      continue;
    }

    if (text.startsWith("出品方")) {
      data[DB_PROPERTIES.出品方] = getNextValidContent(content)?.textContent
        .trim();
      continue;
    }
  }
  return data;
}
