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

export function getIDFromURLForGoodReads(url?: string): string {
  const [id] = url?.match(/(?<=\/book\/show\/)\d+(?=[-.])?/) || [""];
  return id;
}

export function templateURL(
  spans: TemplateStringsArray,
  ...keys: (string | number)[]
) {
  return (...args: unknown[]) => {
    const dicts: Record<string, string | number> =
      args[args.length - 1] as Record<string, string | number>;
    return spans[0] + keys.map((key, index) => {
      return Number.isInteger(key)
        ? args[key as number] + spans[index + 1]
        : key + "=" + dicts[key] + spans[index + 1];
    }).join("");
  };
}
