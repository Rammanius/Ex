(function () {
    function normalize(value) {
        return (value || "").toString().trim().toLowerCase();
    }

    function getFilterValue(row, key) {
        return normalize(row.getAttribute("data-" + key));
    }

    function matchesFilter(row, key, value) {
        if (!value) return true;
        var attrValue = getFilterValue(row, key);
        if (attrValue) return attrValue === value;
        return normalize(row.textContent).indexOf(value) !== -1;
    }

    function initRegistry(registry) {
        var search = registry.querySelector("[data-registry-search]");
        var filters = Array.prototype.slice.call(registry.querySelectorAll("[data-registry-filter]"));
        var reset = registry.querySelector("[data-registry-reset]");
        var tbody = registry.querySelector("[data-registry-body]");
        var emptyRow = registry.querySelector("[data-registry-empty]");

        if (!tbody) return;

        var rows = Array.prototype.slice.call(tbody.querySelectorAll("tr")).filter(function (row) {
            return !row.hasAttribute("data-registry-empty");
        });

        function applyFilters() {
            var query = normalize(search ? search.value : "");
            var activeFilters = filters.map(function (filter) {
                return {
                    key: filter.getAttribute("data-registry-filter"),
                    value: normalize(filter.value)
                };
            });
            var visibleCount = 0;

            rows.forEach(function (row) {
                var searchSource = normalize(row.getAttribute("data-search") || row.textContent);
                var isVisible = (!query || searchSource.indexOf(query) !== -1) && activeFilters.every(function (filter) {
                    return matchesFilter(row, filter.key, filter.value);
                });

                row.hidden = !isVisible;
                if (isVisible) visibleCount += 1;
            });

            if (emptyRow) {
                emptyRow.hidden = visibleCount !== 0;
                var emptyCell = emptyRow.querySelector("td");
                if (emptyCell) {
                    emptyCell.textContent = rows.length === 0
                        ? "Записи реестра пока не добавлены."
                        : "По выбранным параметрам записи не найдены.";
                }
            }

        }

        if (search) search.addEventListener("input", applyFilters);
        filters.forEach(function (filter) {
            filter.addEventListener("change", applyFilters);
        });

        if (reset) {
            reset.addEventListener("click", function () {
                if (search) search.value = "";
                filters.forEach(function (filter) {
                    filter.value = "";
                });
                applyFilters();
            });
        }

        applyFilters();
    }

    document.addEventListener("DOMContentLoaded", function () {
        document.querySelectorAll("[data-registry]").forEach(initRegistry);
    });
})();
