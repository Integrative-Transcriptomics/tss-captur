const FROM_COLNAME_TO_TITLE = {
  index: { title: "Transcript ID", default: true, category: "main" },
  position: { title: "TSS Position", default: true, category: "main" },
  strand: { title: "Strand", default: true, category: "main" },
  transcript_length: { title: "Extracted length", default: true, category: "main" },
  winner: { title: "Gene class", default: true, category: "main" },
  feature: { title: "Predicted terminator", default: true, category: "main" },
  term_start: { title: "Term. start", default: true, category: "main" },
  term_end: { title: "Term. end", default: true, category: "main" },
  mfe: { title: "MFE (kcal/mol)", default: true, category: "main" },
  summary: {
    title: "Promoter motifs",
    renderTitle: returnMotifSummary,
    default: true,
    category: "main",
  },
  GeneStart: { title: "Gene start", default: true, category: "main" },
  GeneEnd: { title: "Gene end", default: true, category: "main" },
  GeneLength: { title: "Gene length", default: true, category: "main" },
  GeneLengthWithUTR: { title: "Length with 5' UTR", default: true, category: "main" },
  url_for_image: { title: "RNA-Structure", default: true, category: "main" },
};

function returnMotifSummary(summary) {
  return `<a target="_blank" rel="noopener noreferrer" data-html="true" class="wide-tooltip link-to-motif" data-toggle="tooltip" title="${summary}">Promoter motifs</a>`;
}

/**
 * Once selected, the functions updates the table to shown only required columns.
 *
 */
function updateColumns() {
  let elements = $("#selectionColumns").find("input:checked");
  let colnames = Object.values(elements).map((el) => el.value);
  let colDefToHide = columnNames[genome_selected]
    .map((x, d) => [x, d])
    .filter((el) => !colnames.includes(el[0]));
  // set all columns to visible to afterwards hide the ones that are unselected
  $("#dataTableOverview").DataTable().columns().visible(true);
  $("#dataTableOverview")
    .DataTable()
    .columns(colDefToHide.map((x) => x[1] + 1))
    .visible(false);
}

index = localStorage.getItem("genome") ? localStorage.getItem("genome") : 0;
genome_selected = genomes[index];
let dataOverview = overviewData[genome_selected].map((x) => [""].concat(x));

let dataSummary = summaryMotifs[genome_selected];
let summary = dataSummary
  .map((x) => `${x[0]} (${x[1]})<br/>Appears ${x[3]} times (E-value: ${x[2].toExponential(2)})`)
  .join("<br/>");

/**
 * Creates a checkbox for each uploaded column
 *
 * @param {string} name of the column of the table
 * @returns HTML code for the checkbox of the column
 */
function createCheckbox(name) {
  let idCheckbox = `checkbox-${name}`;
  let is_checked = FROM_COLNAME_TO_TITLE[name].default ? "checked" : "";
  return `<div class="form-check">
                <input class="form-check-input" type="checkbox" value="${name}" id="${idCheckbox}" ${is_checked} />
                <label class="form-check-label" for= "${idCheckbox}" >
                    ${FROM_COLNAME_TO_TITLE[name].title}
                </label >
                </div> `;
}

/**
 * Creates the checkboxes for each column.
 */
function prepareColumnSelection() {
  for (let colName of columnNames[genome_selected]) {
    $("#selectionColumns").append(createCheckbox(colName));
  }
}

/**
 *
 * @param {string} csv string containing the table's data
 * @returns {string} modified csv
 */
function modifyingCSV(csv) {
  //Split the csv to get the rows
  var split_csv = csv.split("\n");
  //For each row except the first one (header)
  let header = split_csv[0].split(",");
  let motifIndex = header.findIndex((word) => word.match(/<a*/g));

  let motifRegex = /<a.*\">(.*)<\/a\s*>/;
  // The matched group is found in [1], not sure why
  console.log(header[motifIndex].match(motifRegex));
  header[motifIndex] = header[motifIndex].match(motifRegex)[1];
  header = header.join(",");
  split_csv[0] = header;
  $.each(split_csv.slice(1), function (index, csv_row) {
    //Split on quotes and comma to get each cell
    var csv_cell_array = csv_row.split('","');

    //Extract motif to output only the necessary information
    let motif_cell = csv_cell_array[motifIndex];
    csv_cell_array[motifIndex] = motif_cell.length > 0 ? motif_cell.match(motifRegex)[1] : "";
    //Join the table on the quotes and comma; add back the quotes at the beginning and end
    csv_cell_array_quotes = csv_cell_array.join('","');

    //Insert the new row into the rows array at the previous index (index +1 because the header was sliced)
    split_csv[index + 1] = csv_cell_array_quotes;
  });

  //Join the rows with line breck and return the final csv (datatables will take the returned csv and process it)
  mod_csv = split_csv.join("\n");
  return mod_csv;
}
/**
 * Mofification of the table's data to a gff file
 *
 * @param {string} csv with all columns of TSScaptur
 * @returns csv as a gff format.
 *
 */
function creatingGFF(csv) {
  return csv;
}

/**
 *
 * @param {string} name name of the button
 * @param {string} type either "csv" or "gff"
 * @param {dict} mod selector-modifier
 * @returns dict for the export configuration
 */
function defineExportFunction(name, type, mod) {
  let is_csv = type == "csv";
  return {
    extend: "csv",
    text: name,
    customize: is_csv ? modifyingCSV : creatingGFF,

    exportOptions: {
      modifier: mod,
      stripHtml: false,
      // TODO: extract columns that are important for the gff
      columns: is_csv
        ? [":not(.select-checkbox):not(.show-structure):visible"]
        : ":not(.select-checkbox)",
    },
  };
}
$(document).ready(function () {
  prepareColumnSelection();

  $("#dataTableOverview").DataTable({
    dom: "Blfrtip",
    buttons: [
      {
        extend: "colvis",
        text: "Select Columns",
      },
      {
        extend: "collection",
        text: "Export CSV",
        buttons: [
          defineExportFunction("Export All", "csv", { search: "none", selected: "none" }),
          defineExportFunction("Export selected", "csv", { selected: true }),
          defineExportFunction("Export filtered", "csv", { search: "applied" }),
        ],
      },
      {
        extend: "collection",
        text: "Export GFF",
        buttons: [
          defineExportFunction("Export All", "gff", { search: "none", selected: "none" }),
          defineExportFunction("Export selected", "gff", { selected: true }),
          defineExportFunction("Export filtered", "gff", { search: "applied" }),
        ],
      },
    ],
    select: {
      style: "os",
      selector: "td:first-child",
    },
    scrollX: true,
    scrollY: $(window).height() * 0.8,
    scrollCollapse: true,
    columnDefs: [
      {
        targets: 0,
        data: null,
        defaultContent: "",
        orderable: false,
        className: "select-checkbox",
        name: "select-column",
      },
      {
        targets: 1,
        type: "natural",
      },
      {
        targets: 15,
        className: "show-structure",
        render: function (data, type, row, meta) {
          if (data != "") {
            return '<a href="#" onclick=updateViz("' + row[14] + '")>Show</a>';
          } else {
            return "";
          }
        },
      },
      {
        targets: 10,
        render: function (data, type, row, meta) {
          if (data != "NA") {
            let string = data.map(
              (x) => `${x[0]} found at crd.${x[1] - 51} (p - value: ${x[2].toExponential(2)})`
            );
            return `<a target="_blank" rel = "noopener noreferrer"  data-container="body" 
                        href = "../MotifAnalysis/${genome_selected}/meme_out/meme.html" 
                        data-html="true" data-toggle="tooltip" 
                        class="header-tooltip link-to-motif" 
                        title = "${string.join(" <br /> ")}"> ${data.length} ${
              data.length > 1 ? `motifs` : `motif`
            } found </a > `;
          } else {
            return "";
          }
        },
      },
      {
        targets: 9,
        type: "natural",
        render: function (data, type, row, meta) {
          if (data != "NA") {
            return parseFloat(row[9]).toFixed(2);
          } else {
            return "NA";
          }
        },
      },
    ],
    order: [[1, "asc"]],
    data: dataOverview,
    columns: [
      { title: "Select" },
      { title: "Transcript ID" },
      { title: "Position" },
      { title: "Strand" },
      { title: "Extracted Length" },
      { title: "Class" },
      { title: "Type of Terminator" },
      { title: "Terminator Start" },
      { title: "Terminator End" },
      { title: "MFE (kcal/mol)" },
      { title: returnMotifSummary(summary) },
      { title: "Gene Start" },
      { title: "Gene End" },
      { title: "Length of Gene" },
      { title: "Length with 5'UTR" },
      { title: "RNA-Struct" },
    ],
  });
});

$(document).ready(function () {
  $("body").tooltip({
    selector: '[data-toggle="tooltip"]',
  });
  updateSummary(genome_selected);
});

$(`.link-to-motif`).each(function () {
  $(this).attr("href", `../MotifAnalysis/${genome_selected}/meme_out/meme.html`);
});
