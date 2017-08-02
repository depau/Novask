var goToSearchForm = function() {
    if (!validateFields())
        return;

    args = {
        q: getQuery(),
        engines: getEngineStr(),
        category: getCategory()
    };

    window.location = "/search/" + genGET(args);
};

$(document).ready(function () {
    $("button#btn-search").click(goToSearchForm);
    $("input#input-query").bind("enterKey", goToSearchForm);
});