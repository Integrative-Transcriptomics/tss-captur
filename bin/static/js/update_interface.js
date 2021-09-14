updateViz = function (id) {
  index = localStorage.getItem("genome") ? localStorage.getItem("genome") : 0;
  indexSelected = index;
  genome_selected = genomes[index];
  $("#vizStructure").attr("src", `../SecondaryStructure/${genome_selected}/Visualizations/${id}`);
  $("#collapseExample").collapse("show");
  $("html,body").animate(
    {
      scrollTop: $("#collapseExample").offset().top,
    },
    "slow"
  );
};
/**
 * @param  {list} array
 *
 * Reduction of a JS list into the continius sum of the elements.
 */
let sum = function (array) {
  return array.reduce(function (pv, cv) {
    return pv + cv;
  }, 0);
};
/**
 * Given the seelcted genome, update the summay view.
 *
 * @param  {string} genome
 */
updateSummary = function (genome) {
  let valuesSummary = [];
  let data = shortDescription[genome];
  console.log(data);
  let naValues = [];
  for (let i of ["antisense", "orphan"]) {
    let subdata = data[i] || {};
    for (let j of ["RNA", "COD"]) {
      valuesSummary.push(subdata[j] || 0);
    }

    naValues.push(subdata["NA"] || 0);
    console.log(naValues);
  }

  console.log(valuesSummary);

  for (let datapoint of [
    data["Ignored"],
    sum(valuesSummary),
    sum(valuesSummary.slice(0, 2)),
    sum(valuesSummary.slice(2, 4)),
  ]) {
    valuesSummary.push(datapoint);
  }
  // valuesSummary.push(data["Ignored"]);
  // valuesSummary.push(sum(valuesSummary));
  // valuesSummary.push(sum(valuesSummary.slice(0, 2)));
  // valuesSummary.push(sum(valuesSummary.slice(2, 4)));
  let ids = ["ncATSS", "CodingATSS", "ncOTSS", "CodingOTSS", "iTSS", "allTSS", "ATSS", "OTSS"];
  valuesSummary.forEach(function (value, i) {
    $(`#${ids[i]}`).text(value);
  });

  /* If there is no classification (e.g. it was ignored in both cases by QRNA and CNIT) 
  then add a not-classified information */
  if (sum(naValues) > 0) {
    $("#noclassAS").text(naValues[0]);
    $("#ATSS").text(valuesSummary[6] + naValues[0]);
    $("#noclassOR").text(naValues[1]);
    $("#OTSS").text(valuesSummary[7] + naValues[1]);
    $("#allTSS").text(valuesSummary[5] + sum(naValues));
  } else {
    $("#not-classified-or").remove();
    $("#not-classified-as").remove();
  }
};

createOption = function (text, value) {
  return $("<option>").val(value).text(text);
};

/**
 * Creates a multiselect window for each available genome.
 *
 * @param  {list} listGenomes
 */
function createElementMultiSelect(listGenomes) {
  listGenomes.forEach(function (x, i) {
    $("#selectGenome").append(createOption(x, i));
  });
}
/**
 * Runs the update of the interface after changing the selected genome
 */
function mainInterfaceUpdate() {
  let index = localStorage.getItem("genome") ? localStorage.getItem("genome") : 0;
  indexSelected = index;
  genome_selected = genomes[index];

  $(`#selectGenome option[value='${indexSelected}']`).attr("selected", true);

  $(`.link-to-motif`).each(function () {
    $(this).attr("href", `../MotifAnalysis/${genome_selected}/meme_out/meme.html`);
  });

  $("#selectGenome").on("change", function () {
    let index = $(`#selectGenome option`).filter(":selected").val();
    genome_selected = genomes[index];
    console.log("genome_selected:", genome_selected);
    localStorage.setItem("genome", index);
    let currentTable = $(".dataTables_wrapper")[0].id.replace("_wrapper", "");
    let data;
    switch (currentTable) {
      case "dataTableOverview":
        data = overviewData[genome_selected];
        break;
      case "dataTableClass":
        data = classified[genome_selected];
        break;
      case "dataTableTerms":
        data = terminators[genome_selected];
        break;
      case "dataTableAvoided":
        data = avoidedTSS[genome_selected];
        break;
    }
    data = data.map((x) => [""].concat(x));
    let datatable = new $.fn.dataTable.Api(`#${currentTable}`);
    datatable.clear();
    datatable.rows.add(data);
    if (currentTable == "dataTableOverview") {
      dataSummary = summaryMotifs[genome_selected];
      newSummary = dataSummary
        .map(
          (x) => `${x[0]} (${x[1]})<br/>Appears ${x[3]} times (E-value: ${x[2].toExponential(2)})`
        )
        .join("<br/>");
      $(datatable.column(10).header()).html(
        '<a target="_blank" rel="noopener noreferrer" data-html="true" class="wide-tooltip link-to-motif" data-toggle="tooltip" title="' +
          newSummary +
          '">Promoter motifs</a>'
      );
    }
    datatable.draw();

    $(`.link-to-motif`).each(function () {
      $(this).attr("href", `../MotifAnalysis/${genome_selected}/meme_out/meme.html`);
    });
    updateSummary(genome_selected);
  });
}

createElementMultiSelect(genomes);

mainInterfaceUpdate();
