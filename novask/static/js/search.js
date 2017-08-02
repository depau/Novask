$(document).ready(function () {
    $("button#btn-search").click(startStopSearch);
    $("input#input-query").bind("enterKey", startStopSearch);

    $("table#results-table").tablesorter({
        theme: "bootstrap",
        widgets: ["filter", "zebra", "columns"],
        // columns: ["primary", "secondary", "tertiary"],
        sortList: [[3, 1], [4, 0], [1, 0]],
        delayInit: true,
        textSorter: {2: sortSizes}
    }).tablesorterPager({
        container: $(".ts-pager"),
        cssGoto: ".pagenum",
        removeRows: false,

        // output string - default is '{page}/{totalPages}';
        // possible variables: {page}, {totalPages}, {filteredPages}, {startRow}, {endRow}, {filteredRows} and {totalRows}
        output: '{startRow} - {endRow} / {filteredRows} ({totalRows})'
    });

    // Read any GET arguments
    parseArgs();
});