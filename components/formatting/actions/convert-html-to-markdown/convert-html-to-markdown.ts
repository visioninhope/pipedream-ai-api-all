import { defineAction } from "@pipedream/types";
import showdown from "showdown";
import jsdom from "jsdom@21.1.1";
import app from "../../app/formatting.app";

export default defineAction({
  name: "[Text] Convert HTML to Markdown",
  description: "Convert valid HTML to Markdown text",
  key: "formatting-convert-html-to-markdown",
  version: "0.0.3",
  type: "action",
  props: {
    app,
    input: {
      label: "Input",
      description: "HTML string to be converted to Markdown",
      type: "string",
    },
  },
  async run({ $ }): Promise<string> {
    const { input } = this;
    const converter = new showdown.Converter();
    const dom = new jsdom.JSDOM();
    const result = converter.makeMarkdown(input, dom.window.document);

    $.export("$summary", "Successfully converted to Markdown");
    return result;
  },
});
