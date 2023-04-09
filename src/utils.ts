import {
  Node,
  NodeType,
} from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

export function getNextElementSibling(content: Node) {
  let next = content.nextSibling;
  while (true) {
    if (next?.nodeType !== NodeType.ELEMENT_NODE && next !== null) {
      next = next.nextSibling;
    } else {
      return next;
    }
  }
}

export function getNextValidContent(content: Node) {
  const next = content.nextSibling?.textContent?.trim();
  if (next) return content.nextSibling;
  else return getNextElementSibling(content);
}

export function getIDFromURL(url?: string): string {
  const [id] = url?.match(/(?<=\/subject\/)\d+(?=\/)?/) || [""];
  return id;
}
