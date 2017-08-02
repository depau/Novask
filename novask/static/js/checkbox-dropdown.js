var options = [];

$(document).ready(function () {
    $('#dropdown-engines').find('li a').click(function (event) {
        $("button#btn-engines").attr("data-original-title", "").tooltip('hide');

        var $target = $(event.currentTarget),
            $inp = $target.find('input');

        $inp.prop("checked", !$inp.prop("checked"));

        $(event.target).blur();

        return false;
    });

    $('#dropdown-category').find('a').click(function (event) {
        $('#dropdown-category').find('a').removeClass("active");

        t = $(event.target);
        t.addClass("active");
        cat = t.attr("data-category");
        $("#btn-category").attr("data-category", cat);
        if (cat == "all")
            $("#btn-category .name").text("Category")
        else
            $("#btn-category .name").text(t.text())
    });
});