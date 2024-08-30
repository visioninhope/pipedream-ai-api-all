import common from "../common/worksheet.mjs";
import { ConfigurationError } from "@pipedream/platform";
import { parseArray } from "../../common/utils.mjs";

const { googleSheets } = common.props;

export default {
  ...common,
  key: "google_sheets-add-single-row",
  name: "Add Single Row",
  description: "Add a single row of data to Google Sheets. [See the documentation](https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/append)",
  version: "2.1.10",
  type: "action",
  props: {
    googleSheets,
    drive: {
      propDefinition: [
        googleSheets,
        "watchedDrive",
      ],
    },
    sheetId: {
      propDefinition: [
        googleSheets,
        "sheetID",
        (c) => ({
          driveId: googleSheets.methods.getDriveId(c.drive),
        }),
      ],
    },
    worksheetId: {
      propDefinition: [
        googleSheets,
        "worksheetIDs",
        (c) => ({
          sheetId: c.sheetId?.value || c.sheetId,
        }),
      ],
      type: "string",
      label: "Worksheet ID",
    },
    hasHeaders: {
      type: "boolean",
      label: "Does the first row of the sheet have headers?",
      description: "If the first row of your document has headers, we'll retrieve them to make it easy to enter the value for each column. Please note, that if you are referencing a worksheet using a custom expression referencing data from another step, e.g. `{{steps.my_step.$return_value}}` this prop cannot be used. If you want to retrieve the header row, select both **Spreadsheet** and **Worksheet ID** from the dropdowns above.",
      reloadProps: true,
    },
  },
  async additionalProps() {
    const {
      sheetId,
      worksheetId,
    } = this;

    const props = {};
    if (this.hasHeaders) {
      const worksheet = await this.getWorksheetById(sheetId, worksheetId);

      const { values } = await this.googleSheets.getSpreadsheetValues(sheetId, `${worksheet?.properties?.title}!1:1`);
      if (!values[0]?.length) {
        throw new ConfigurationError("Could not find a header row. Please either add headers and click \"Refresh fields\" or adjust the action configuration to continue.");
      }
      for (let i = 0; i < values[0]?.length; i++) {
        props[`col_${i.toString().padStart(4, "0")}`] = {
          type: "string",
          label: values[0][i],
          optional: true,
        };
      }
      props.allColumns = {
        type: "string",
        hidden: true,
        default: JSON.stringify(values),
      };
    } else {
      props.myColumnData = {
        type: "string[]",
        label: "Values",
        description: "Provide a value for each cell of the row. Google Sheets accepts strings, numbers and boolean values for each cell. To set a cell to an empty value, pass an empty string.",
      };
    }
    return props;
  },
  async run({ $ }) {
    const {
      sheetId,
      worksheetId,
    } = this;

    const { name: sheetName } = await this.googleSheets.getFile(sheetId, {
      fields: "name",
    });

    const worksheet = await this.getWorksheetById(sheetId, worksheetId);

    let cells;
    if (this.hasHeaders) {
      const rows = JSON.parse(this.allColumns);
      const [
        headers,
      ] = rows;
      cells = headers
        .map((_, i) => `col_${i.toString().padStart(4, "0")}`)
        .map((column) => this[column] ?? "");
    } else {
      cells = this.googleSheets.sanitizedArray(this.myColumnData);
    }

    // validate input
    if (!cells || !cells.length) {
      throw new ConfigurationError("Please enter an array of elements in `Cells / Column Values`.");
    }
    cells = parseArray(cells);
    if (!cells) {
      throw new ConfigurationError("Cell / Column data is not an array. Please enter an array of elements in `Cells / Column Values`.");
    } else if (Array.isArray(cells[0])) {
      throw new ConfigurationError("Cell / Column data is a multi-dimensional array. A one-dimensional is expected. If you're trying to send multiple rows to Google Sheets, search for the action to add multiple rows to Sheets.");
    }

    const {
      arr,
      convertedIndexes,
    } = this.googleSheets.arrayValuesToString(cells);

    const data = await this.googleSheets.addRowsToSheet({
      spreadsheetId: sheetId,
      range: worksheet?.properties?.title,
      rows: [
        arr,
      ],
    });

    let summary = `Added 1 row to [${sheetName || sheetId} (${data.updatedRange})](https://docs.google.com/spreadsheets/d/${sheetId}).`;
    if (convertedIndexes.length > 0) {
      summary += " We detected something other than a string/number/boolean in at least one of the fields and automatically converted it to a string.";
    }
    $.export("$summary", summary);

    return data;
  },
};
