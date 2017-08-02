var job_id = undefined;
var since = 0;
var progress = 0;
var resultsLoopTimeout = 1000;
var setScrollPos = undefined;
var pushScrollPos = true;

var validateFields = function () {
    checked = false;
    query_valid = false;

    $("input.engine-checkbox").each(function (index) {
        i = $(this);
        if (i.prop("checked")) {
            checked = true;
            return false;
        }
    });
    if (!checked) {
        btn = $("button#btn-engines");
        showErrorTooltip(btn, "At least one search engine must be selected");
        setEventRemoveTooltip(btn, "click");
    }

    querybox = $("input#input-query");
    if (getQuery() !== "") {
        query_valid = true;
    } else {
        showErrorTooltip(querybox, "Please type some search keywords");
        setEventRemoveTooltip(querybox, "keypress");
        setEventRemoveTooltip(querybox, "focus");
    }

    return checked && query_valid;
};

var showErrorTooltip = function (el, text) {
    el = $(el);
    el.attr("data-original-title", text);
    el.tooltip('show');
};

var removeTooltip = function (el, removeHandler) {
    el = $(el);
    el.tooltip('hide');
    el.attr("data-original-title", "");
    if (removeHandler !== undefined)
        el.off(removeHandler);
}

var setEventRemoveTooltip = function (el, event) {
    $(el).on(event, function () {
        removeTooltip(el, event);
    })
}

var getEngineStr = function () {
    engines = [];
    all = true;
    $("input.engine-checkbox").each(function (index) {
        i = $(this);
        if (i.prop("checked"))
            engines.push(i.attr("name"));
        else
            all = false;
    });

    if (all)
        return "all";
    return engines.join(",");
};

var setEnginesFromStr = function (engines) {
    if (engines === "all") {
        $("input.engine-checkbox").prop("checked", true);
        return;
    }
    e = engines.split(",");
    $("input.engine-checkbox").prop("checked", false);
    for (i in e) {
        $('input.engine-checkbox[name="' + e[i] + '"]').prop("checked", true);
    }
};

var getCategory = function () {
    return $("#btn-category").attr("data-category");
}

var setCategory = function (category) {
    $("button#btn-category").attr("data-category", category);
    d = $("#dropdown-category");
    d.find("a").removeClass("active");
    d.find('a[data-category="' + category + '"]').addClass("active");
};

var getQuery = function () {
    return $("#input-query").val();
};

var setQuery = function (query) {
    $("#input-query").val(query);
};

var startStopSearch = function () {
    if (job_id === undefined)
        doSearch();
    else
        stopSearch();
}

var doSearch = function (replace_state) {
    if (replace_state === undefined)
        replace_state = false;

    if (!validateFields())
        return;

    uiSearchStart();

    window.job_id = undefined;
    window.since = 0;

    enginestr = getEngineStr();

    category = getCategory();
    query = getQuery();

    $.post("/api/v1.0/search", {"engines": enginestr, "query": query, "category": category},
        success = function (data, status, xhr) {
            job_id = data["uuid"];
            pushState(replace_state);
            setTimeout(queryResultsLoop, resultsLoopTimeout);
        })
};

var stopSearch = function () {
    uiSearchDone();

    $.get("/api/v1.0/stopsearch?uuid=" + job_id);
    job_id = undefined;
    since = -1;
};

var filenamify = function (string) {
    return string.trim().replace(/[^\x00-\x7F]/g, "").replace(/[*?!#"'&()~@=[\]{}]/g, "").replace(/[\s\\/]/g, "_");
};

var showFunnySearchMsg = function () {
    messages = [
        "Search may take up to 2 minutes, please wait...",
        "Spinning up the hamster, please wait...",
        "Adding randomly mispeled words into text, please wait...",
        "Attaching beards to dwarves, please wait...",
        "Doing something you don't wanna know about, please wait...",
        "Ensuring gnomes are still short, please wait...",
        "Drinking a glass out of the BitTorrent, please wait...",
        "Getting angry won't make this faster, please wait...",
        "Pay no attention to the man behind the curtain",
        "Go ahead -- hold your breath",
        "We're testing your patience"
    ];

    $("h1.search-message").text(messages[Math.floor(Math.random() * messages.length)]);
}

var uiSearchStart = function (progress) {
    if (progress === undefined)
        progress = true;
    btn = $("button#btn-search");
    btn.empty();
    btn.append("Stop <i class=\"fa fa-stop-circle\"></i>");
    btn.removeClass("btn-outline-success").addClass("btn-danger");
    showFunnySearchMsg();

    $("section#search-message").show()
    $("section#results").hide();
    $("table#results-table tbody").empty();

    window.pushScrollPos = false;

    if (progress)
        NProgress.start();
}

var uiSearchDone = function () {
    btn = $("button#btn-search");
    btn.empty();

    btn.append("Search <i class=\"fa fa-search\"></i>");
    btn.removeClass("btn-danger").addClass("btn-outline-success");

    $("h1.search-message").text("Search something");

    NProgress.done();
    window.pushScrollPos = true;

    if (setScrollPos !== undefined) {
        $(window).scrollTop(setScrollPos);
        window.setScrollPos = undefined;
    }
}

var formatSize = function (bytes) {
    mults = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
    index = 0;

    while (bytes > 1000) {
        bytes = bytes / 1024;
        index++;
    }
    return (Math.round(bytes * 10) / 10).toString() + " " + mults[Math.min(index, mults.length - 1)];
};

var sizeToBytes = function (size) {
    s = size.split(" ");
    n = parseFloat(s[0]);
    mults = ["b", "kib", "mib", "gib", "tib", "pib", "eib", "zib", "yib"];
    e = mults.indexOf(s[1].toLowerCase());
    if (e <= 0)
        return n;
    return n * Math.pow(1024, e);
};

var addResult = function (r) {
    // console.log(r);
    if (r["found_at"] > since)
        window.since = r["found_at"];
    tr = $("<tr></tr>");
    dl = $("<td class=\"dl-td\"></td>");
    a = $("<a target=\"_blank\"></a>");
    if (r.link.startsWith("magnet")) {
        a.append("<i class=\"fa fa-magnet\"></i>");
        a.attr("href", r.link);
    } else {
        a.append("<i class=\"fa fa-download\"></i>");
        a.attr("href", "/api/v1.0/download/"+filenamify(r.name)+".torrent?url="+encodeURIComponent(r.link)+"&engine="+encodeURIComponent(r.engine_url));
    }
    dl.append(a);
    title = $("<td></td>");
    if (r.desc_link !== undefined) {
        a = $("<a target=\"_blank\"></a>");
        a.attr("href", r.desc_link);
        a.text(r["name"]);
        title.append(a)
    } else {
        title.text(r["name"]);
    }
    size = "<td>" + formatSize(r.size) + "</td>";
    seeds = "<td>" + r.seeds + "</td>";
    leech = "<td>" + r.leech + "</td>";
    a = $("<a _target=\"blank\"></a>");
    a.attr("href", r.engine_url);
    a.text(r.engine_url);
    source = $("<td></td>").append(a);
    tr.append(dl).append(title).append(size).append(seeds).append(leech).append(source);
    $("#results-table").find("tbody").append(tr);
};

var readResults = function (res) {
    if (res["results"].length > 0 && !$("section#results").is(":visible")) {
        $("section#results").show();
        $("section#search-message").hide();
    }
    for (r in res["results"]) {
        addResult(res["results"][r]);
    }
    if (res["finished"]) {
        window.job_id = undefined;
    }
    if (res["progress"] !== progress) {
        progress = res["progress"];
        NProgress.set(progress / 100);
    }
    $("#results-table").trigger("update");
};

var queryResultsLoop = function () {
    $.get("/api/v1.0/results?uuid=" + job_id + "&since=" + since,
        success = function (data, status, xhr) {
            readResults(data);
            if (job_id !== undefined)
                setTimeout(queryResultsLoop, resultsLoopTimeout);
            else {
                uiSearchDone();
                if ($("table#results-table tbody").children().length == 0 && since !== -1)
                    $("h1.search-message").text("No results");
            }
        });
};

var sortSizes = function (a, b, direction, column, table) {
    a = sizeToBytes(a);
    b = sizeToBytes(b);
    return ((a < b) ? -1 : ((a > b) ? 1 : 0));
};

var resetSort = function () {
    $("#results-table").trigger("sorton", [[[3, 1], [4, 0], [1, 0]]]);
};

var resetFilters = function () {
    t = $("#results-table");
    t.find("input[data-column]").val("");
    t.trigger("search", false);
};

var seedsGT10 = function () {
    t = $("#results-table");
    t.find("input[data-column='3']").val(">10");
    t.trigger("search", false);
};

var leechLT10 = function () {
    t = $("#results-table");
    t.find("input[data-column='4']").val("<10");
    t.trigger("search", false);
};

var queryInName = function () {
    t = $("#results-table");
    t.find("input[data-column='1']").val(getQuery());
    t.trigger("search", false);
};

var bindWindowScroll = function () {
    $(window).scroll(function () {
        scroll = $(window).scrollTop();
        if (scroll > 5) {
            $(".navbar").addClass("navbar-shadow");
        } else {
            $(".navbar").removeClass("navbar-shadow");
        }
        if (pushScrollPos) {
            prevscroll = history.state.scrollPos;
            if (Math.abs(scroll - prevscroll) > 10)
                pushScrollPosToState(scroll);
        }
    });
}

var unbindWindowScroll = function () {
    $(window).off("scroll");
}

// https://stackoverflow.com/a/4656873/1124621
var getGET = function () {
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
};

var genGET = function (args) {
    getstr = "?";
    for (arg in args) {
        if (!args.hasOwnProperty(arg))
            continue;
        getstr += arg + "=" + encodeURIComponent(args[arg]) + "&";
    }
    return getstr.substring(0, getstr.length-1);
};

var popState = function (state) {
    if (job_id !== undefined)
        stopSearch();

    if (state === null && location.search !== "") {
        parseArgs();
    } else if (state === null) {
        setQuery("");
        setCategory("all");
        setEnginesFromStr("all");
        window.job_id = undefined;
        window.since = 0;
        uiSearchStart(false);
        uiSearchDone();
    } else {
        setQuery(state.query);
        setCategory(state.category);
        setEnginesFromStr(state.engines);
        window.job_id = state.uuid;
        window.since = 0;
        window.pushScrollPos = false;
        window.setScrollPos = state.scrollPos;
        uiSearchStart();
        setTimeout(queryResultsLoop, 0);
    }
};

window.onpopstate = function (event) {
    popState(event.state);
}

var pushScrollPosToState = function (scroll) {
    stateObj = history.state;
    stateObj.scrollPos = scroll;

    history.replaceState(stateObj,
        document.title,
        location.toString());
};

var pushUUIDToState = function (uuid) {
    stateObj = history.state;
    stateObj.uuid = uuid;

    history.replaceState(stateObj,
        document.title,
        location.toString()+"&uuid="+uuid);
};

var pushState = function (replace) {
    if (replace === undefined)
        replace = true;

    stateObj = {
        uuid: job_id,
        engines: getEngineStr(),
        category: getCategory(),
        query: getQuery(),
        scrollPos: 0
    };
    args = {
        q: stateObj.query,
        uuid: job_id,
        engines: stateObj.engines,
        category: stateObj.category
    };
    if (!replace)
        history.pushState(stateObj,
        document.title,
        location.pathname + genGET(args));
    else
        history.replaceState(stateObj,
        document.title,
        location.pathname + genGET(args));
};

var parseArgs = function () {
    // Read GET arguments to find out if we need to start a search right away
    args = getGET();

    if (args.engines !== undefined) {
        setEnginesFromStr(args.engines);
    }
    if (args.category !== undefined) {
        setCategory(args.category);
    }
    if (args.q !== undefined)
        setQuery(decodeURIComponent(args.q));

    // If uuid is specified, don't start a new search
    if (args.uuid !== undefined) {
        window.job_id = args.uuid;
        window.since = 0;
        uiSearchStart();
        setTimeout(queryResultsLoop, 0);
    } else if (args.q !== undefined) {
        doSearch(true);
    }
};

$(document).ready(function () {
    tooltip_error = '<div class="tooltip tooltip-error" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>';

    $('[data-tooltip="tooltip-error"]').tooltip({
        container: 'body',
        template: tooltip_error,
        placement: 'bottom'
    });

    $('textarea, input').keyup(function (e) {
        if (e.keyCode == 13) {
            $(this).trigger("enterKey");
        }
    });

    bindWindowScroll();

    NProgress.configure({trickleSpeed: 1000});
    NProgress.trickle = function () {
        NProgress.inc(0.003);
    }
});

if (typeof(String.prototype.trim) === "undefined") {
    String.prototype.trim = function() {
        return String(this).replace(/^\s+|\s+$/g, '');
    };
}